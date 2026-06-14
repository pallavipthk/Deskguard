import express from 'express';
import { query } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { sendNotificationToUser, broadcastDeskUpdate } from '../socket.js';

const router = express.Router();

// 1. Get active session for student
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeSessionResult = await query(
      "SELECT s.*, d.name as desk_name, d.zone as desk_zone FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.user_id = $1 AND s.status IN ('active', 'away') ORDER BY s.checked_in_at DESC LIMIT 1",
      [req.user.id]
    );

    if (activeSessionResult.rowCount === 0) {
      return res.json({ session: null });
    }

    res.json({ session: activeSessionResult.rows[0] });
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({ error: 'Server error retrieving active session.' });
  }
});

// 2. Get user check-in history (limited to 10)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const historyResult = await query(
      'SELECT s.*, d.name as desk_name, d.zone as desk_zone FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.user_id = $1 ORDER BY s.checked_in_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json(historyResult.rows);
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Server error retrieving session history.' });
  }
});

// 3. Heartbeat / Ping to refresh last_ping_at and check for "Still Here?" verification state
router.post('/ping', authenticateToken, async (req, res) => {
  try {
    const activeSessionResult = await query(
      "SELECT id, verification_pending_at, checked_in_at FROM sessions WHERE user_id = $1 AND status = 'active'",
      [req.user.id]
    );

    if (activeSessionResult.rowCount === 0) {
      return res.json({ status: 'no_active_session' });
    }

    const session = activeSessionResult.rows[0];
    const now = new Date().toISOString();

    // Update last_ping_at to keep connection active
    await query(
      'UPDATE sessions SET last_ping_at = $1 WHERE id = $2',
      [now, session.id]
    );

    res.json({
      status: 'ping_acknowledged',
      verificationPendingAt: session.verification_pending_at,
      checkedInAt: session.checked_in_at
    });
  } catch (error) {
    console.error('Ping heartbeat error:', error);
    res.status(500).json({ error: 'Server error during heartbeat.' });
  }
});

// 4. Respond to "Still Here?" prompt
router.post('/verify-presence', authenticateToken, async (req, res) => {
  try {
    const activeSessionResult = await query(
      "SELECT id, desk_id FROM sessions WHERE user_id = $1 AND status = 'active'",
      [req.user.id]
    );

    if (activeSessionResult.rowCount === 0) {
      return res.status(404).json({ error: 'No active session found to verify.' });
    }

    const session = activeSessionResult.rows[0];
    const now = new Date().toISOString();

    // Reset verification flag and update last_ping_at
    await query(
      'UPDATE sessions SET verification_pending_at = NULL, last_ping_at = $1 WHERE id = $2',
      [now, session.id]
    );

    // Save notification
    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [req.user.id, 'Presence verified. Active session extended.', 'info']
    );

    sendNotificationToUser(req.user.id, 'Presence verified! Session extended.', 'info');

    res.json({ message: 'Presence successfully verified.' });
  } catch (error) {
    console.error('Presence verification error:', error);
    res.status(500).json({ error: 'Server error during presence verification.' });
  }
});

// 5. Get all active sessions (Librarian dashboard)
router.get('/librarian/active', authenticateToken, authorizeRoles('librarian', 'admin'), async (req, res) => {
  try {
    const result = await query(
      "SELECT s.*, u.username, u.email, d.name as desk_name, d.zone as desk_zone FROM sessions s JOIN users u ON s.user_id = u.id JOIN desks d ON s.desk_id = d.id WHERE s.status IN ('active', 'away') ORDER BY s.checked_in_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Librarian active sessions error:', error);
    res.status(500).json({ error: 'Server error retrieving librarian active sessions.' });
  }
});

// Import checker to force scan immediately
import { checkTimeouts } from '../cron.js';

// 6. Test trigger to simulate time elapse for evaluation
router.post('/test-trigger', authenticateToken, async (req, res) => {
  const { type } = req.body; // 'away_timeout' | 'verification_prompt' | 'grace_timeout'
  
  try {
    // Find active or away session for the user
    const sessionRes = await query(
      "SELECT s.*, d.status as desk_status FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.user_id = $1 AND s.status IN ('active', 'away') ORDER BY s.checked_in_at DESC LIMIT 1",
      [req.user.id]
    );

    if (sessionRes.rowCount === 0) {
      return res.status(400).json({ error: 'No active session found to manipulate.' });
    }

    const session = sessionRes.rows[0];
    const now = new Date();

    if (type === 'away_timeout') {
      // Set away_started_at to 21 minutes ago and status to away
      const targetTime = new Date(now.getTime() - 21 * 60 * 1000).toISOString();
      await query(
        "UPDATE sessions SET status = 'away', away_started_at = $1 WHERE id = $2",
        [targetTime, session.id]
      );
      await query(
        "UPDATE desks SET status = 'away' WHERE id = $1",
        [session.desk_id]
      );
      console.log(`[Test Trigger] Set session ${session.id} Away time to 21m ago.`);
    } else if (type === 'verification_prompt') {
      // Set check-in/ping time to 2h 1m ago
      const targetTime = new Date(now.getTime() - (2 * 60 + 2) * 60 * 1000).toISOString();
      await query(
        "UPDATE sessions SET status = 'active', last_ping_at = $1, checked_in_at = $2, verification_pending_at = NULL WHERE id = $3",
        [targetTime, targetTime, session.id]
      );
      await query(
        "UPDATE desks SET status = 'occupied' WHERE id = $1",
        [session.desk_id]
      );
      console.log(`[Test Trigger] Set session ${session.id} active checkin to 2h2m ago.`);
    } else if (type === 'grace_timeout') {
      // Set verification_pending_at to 6m ago
      const targetTime = new Date(now.getTime() - 6 * 60 * 1000).toISOString();
      await query(
        "UPDATE sessions SET status = 'active', verification_pending_at = $1 WHERE id = $2",
        [targetTime, session.id]
      );
      await query(
        "UPDATE desks SET status = 'occupied' WHERE id = $1",
        [session.desk_id]
      );
      console.log(`[Test Trigger] Set session ${session.id} presence check pending to 6m ago.`);
    } else {
      return res.status(400).json({ error: 'Invalid trigger type. Must be away_timeout, verification_prompt, or grace_timeout.' });
    }

    // Force run background cron check IMMEDIATELY so client updates instantly
    await checkTimeouts();

    res.json({ message: `Successfully simulated ${type} and executed background cron scan.` });
  } catch (err) {
    console.error('Test trigger error:', err);
    res.status(500).json({ error: 'Server error triggering test condition.' });
  }
});

export default router;
