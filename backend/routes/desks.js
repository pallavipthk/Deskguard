import express from 'express';
import { query } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { broadcastDeskUpdate, sendNotificationToUser } from '../socket.js';

const router = express.Router();

// 1. Get all desks
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM desks ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching desks:', error);
    res.status(500).json({ error: 'Server error retrieving desks.' });
  }
});

// 2. Get specific desk by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM desks WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Desk not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching desk detail:', error);
    res.status(500).json({ error: 'Server error retrieving desk details.' });
  }
});

// 3. QR-Based Desk Check-In
router.post('/:id/checkin', authenticateToken, async (req, res) => {
  const deskId = req.params.id;
  const { qrCode } = req.body; // In real, scans QR. Here we verify.

  try {
    // A. Check if desk exists
    const deskResult = await query('SELECT * FROM desks WHERE id = $1', [deskId]);
    if (deskResult.rowCount === 0) {
      return res.status(404).json({ error: 'Desk not found.' });
    }
    const desk = deskResult.rows[0];

    // B. Verify QR code content if passed
    if (qrCode && desk.qr_code !== qrCode) {
      return res.status(400).json({ error: 'Invalid QR code. Please scan the correct QR code on the desk.' });
    }

    // C. Check desk availability
    if (desk.status !== 'available') {
      return res.status(400).json({ error: 'Desk is already occupied or marked as away.' });
    }

    // D. Check if student already has another active/away session
    const activeSessionCheck = await query(
      "SELECT * FROM sessions WHERE user_id = $1 AND status IN ('active', 'away')",
      [req.user.id]
    );
    if (activeSessionCheck.rowCount > 0) {
      return res.status(400).json({ 
        error: 'You already have an active desk booking. Please check out first before booking a new desk.' 
      });
    }

    // E. Create session
    const checkedInAt = new Date().toISOString();
    const lastPingAt = checkedInAt;
    
    const insertSession = await query(
      "INSERT INTO sessions (user_id, desk_id, status, checked_in_at, last_ping_at) VALUES ($1, $2, 'active', $3, $4) RETURNING id",
      [req.user.id, deskId, checkedInAt, lastPingAt]
    );
    
    let newSessionId;
    if (insertSession.rows && insertSession.rows[0]) {
      newSessionId = insertSession.rows[0].id;
    } else if (insertSession.insertId) {
      newSessionId = insertSession.insertId;
    } else {
      // Fallback fallback
      const recentSession = await query(
        "SELECT id FROM sessions WHERE user_id = $1 AND desk_id = $2 AND status = 'active' ORDER BY checked_in_at DESC LIMIT 1",
        [req.user.id, deskId]
      );
      newSessionId = recentSession.rows[0].id;
    }

    // F. Update desk status
    await query(
      'UPDATE desks SET status = $1, current_session_id = $2 WHERE id = $3',
      ['occupied', newSessionId, deskId]
    );

    // G. Create notification
    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [req.user.id, `Successfully checked in to ${desk.name} (${desk.zone}).`, 'info']
    );

    // H. Socket broadcasts
    broadcastDeskUpdate(deskId, 'occupied', newSessionId);
    sendNotificationToUser(req.user.id, `Checked in to ${desk.name}!`, 'info');

    res.json({
      message: 'Check-in successful.',
      sessionId: newSessionId,
      deskId,
      status: 'occupied'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error during check-in.' });
  }
});

// 4. Temporary Away Mode (starts 20-minute timer)
router.post('/:id/away', authenticateToken, async (req, res) => {
  const deskId = req.params.id;

  try {
    const deskResult = await query('SELECT * FROM desks WHERE id = $1', [deskId]);
    if (deskResult.rowCount === 0) return res.status(404).json({ error: 'Desk not found.' });
    const desk = deskResult.rows[0];

    // Check if desk is occupied
    if (desk.status !== 'occupied') {
      return res.status(400).json({ error: 'Only occupied desks can be set to Away mode.' });
    }

    // Verify user owns the session
    const sessionResult = await query('SELECT * FROM sessions WHERE id = $1', [desk.current_session_id]);
    if (sessionResult.rowCount === 0) return res.status(400).json({ error: 'No active session found.' });
    const session = sessionResult.rows[0];

    if (session.user_id !== req.user.id && req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. You are not the occupant of this desk.' });
    }

    const awayStartedAt = new Date().toISOString();

    // Update session status to away
    await query(
      "UPDATE sessions SET status = 'away', away_started_at = $1 WHERE id = $2",
      [awayStartedAt, session.id]
    );

    // Update desk status to away
    await query(
      "UPDATE desks SET status = 'away', current_session_id = $1 WHERE id = $2",
      [session.id, deskId]
    );

    // Add notification
    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [session.user_id, `Desk ${deskId} is marked as Away. You have 20 minutes to return.`, 'warning']
    );

    // Broadcast WebSocket events
    broadcastDeskUpdate(deskId, 'away', session.id);
    sendNotificationToUser(session.user_id, 'Away mode activated. Timer started (20m).', 'warning');

    res.json({
      message: 'Away mode activated. You have 20 minutes to return.',
      awayStartedAt,
      status: 'away'
    });
  } catch (error) {
    console.error('Away mode error:', error);
    res.status(500).json({ error: 'Server error activating Away mode.' });
  }
});

// 5. Check Back In from Away Mode
router.post('/:id/back', authenticateToken, async (req, res) => {
  const deskId = req.params.id;

  try {
    const deskResult = await query('SELECT * FROM desks WHERE id = $1', [deskId]);
    if (deskResult.rowCount === 0) return res.status(404).json({ error: 'Desk not found.' });
    const desk = deskResult.rows[0];

    if (desk.status !== 'away') {
      return res.status(400).json({ error: 'Desk is not in Away mode.' });
    }

    // Verify session occupant
    const sessionResult = await query('SELECT * FROM sessions WHERE id = $1', [desk.current_session_id]);
    if (sessionResult.rowCount === 0) return res.status(400).json({ error: 'No active session found.' });
    const session = sessionResult.rows[0];

    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized. You are not the occupant of this desk.' });
    }

    // Update session
    await query(
      "UPDATE sessions SET status = 'active', away_started_at = NULL, last_ping_at = $1 WHERE id = $2",
      [new Date().toISOString(), session.id]
    );

    // Update desk
    await query(
      "UPDATE desks SET status = 'occupied', current_session_id = $1 WHERE id = $2",
      [session.id, deskId]
    );

    // Add notification
    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [req.user.id, `Checked back in to ${desk.name}. Session resumed.`, 'info']
    );

    broadcastDeskUpdate(deskId, 'occupied', session.id);
    sendNotificationToUser(req.user.id, 'Welcome back! Desk session resumed.', 'info');

    res.json({ message: 'Welcome back! Seat status restored.', status: 'occupied' });
  } catch (error) {
    console.error('Check back error:', error);
    res.status(500).json({ error: 'Server error resuming session.' });
  }
});

// 6. Check Out / Release Desk
router.post('/:id/checkout', authenticateToken, async (req, res) => {
  const deskId = req.params.id;

  try {
    const deskResult = await query('SELECT * FROM desks WHERE id = $1', [deskId]);
    if (deskResult.rowCount === 0) return res.status(404).json({ error: 'Desk not found.' });
    const desk = deskResult.rows[0];

    if (desk.status === 'available') {
      return res.status(400).json({ error: 'Desk is already available.' });
    }

    // Get current session
    const sessionResult = await query('SELECT * FROM sessions WHERE id = $1', [desk.current_session_id]);
    if (sessionResult.rowCount === 0) {
      // If no session is referenced, force free the desk anyway
      await query('UPDATE desks SET status = $1, current_session_id = NULL WHERE id = $2', ['available', deskId]);
      broadcastDeskUpdate(deskId, 'available', null);
      return res.json({ message: 'Desk released (clean up).' });
    }

    const session = sessionResult.rows[0];

    // Students can only release their own desk; librarians/admins can release any
    const isOwner = session.user_id === req.user.id;
    const isStaff = req.user.role === 'librarian' || req.user.role === 'admin';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized. You cannot check out of this desk.' });
    }

    const checkedOutAt = new Date().toISOString();

    // Update session
    await query(
      "UPDATE sessions SET status = 'completed', checked_out_at = $1 WHERE id = $2",
      [checkedOutAt, session.id]
    );

    // Update desk
    await query(
      'UPDATE desks SET status = $1, current_session_id = NULL WHERE id = $2',
      ['available', deskId]
    );

    // Add notification
    const checkoutMessage = isStaff && !isOwner 
      ? `Desk released by librarian force checkout.` 
      : `Checked out of ${desk.name}.`;
    
    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [session.user_id, checkoutMessage, 'info']
    );

    // Broadcast
    broadcastDeskUpdate(deskId, 'available', null);
    sendNotificationToUser(session.user_id, checkoutMessage, 'info');

    res.json({ message: 'Checked out successfully.', status: 'available' });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Server error checking out.' });
  }
});

// 7. Librarian Force Release (Duplicate logic with librarian check for security audit logs)
router.post('/:id/force-release', authenticateToken, authorizeRoles('librarian', 'admin'), async (req, res) => {
  const deskId = req.params.id;

  try {
    const deskResult = await query('SELECT * FROM desks WHERE id = $1', [deskId]);
    if (deskResult.rowCount === 0) return res.status(404).json({ error: 'Desk not found.' });
    const desk = deskResult.rows[0];

    if (desk.status === 'available') {
      return res.status(400).json({ error: 'Desk is already available.' });
    }

    const sessionResult = await query('SELECT * FROM sessions WHERE id = $1', [desk.current_session_id]);
    
    if (sessionResult.rowCount > 0) {
      const session = sessionResult.rows[0];
      const checkoutTime = new Date().toISOString();

      // Terminate session as 'completed' or 'abandoned' based on desk state
      const terminateStatus = desk.status === 'abandoned' ? 'abandoned' : 'completed';
      await query(
        'UPDATE sessions SET status = $1, checked_out_at = $2 WHERE id = $3',
        [terminateStatus, checkoutTime, session.id]
      );

      // Notify user
      await query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [session.user_id, `Your session at ${desk.name} was released by the librarian.`, 'alert']
      );
      sendNotificationToUser(session.user_id, `Session at ${desk.name} was released by librarian.`, 'alert');
    }

    // Set desk as available
    await query(
      'UPDATE desks SET status = $1, current_session_id = NULL WHERE id = $2',
      ['available', deskId]
    );

    broadcastDeskUpdate(deskId, 'available', null);

    res.json({ message: 'Desk successfully released by staff.', status: 'available' });
  } catch (error) {
    console.error('Force release error:', error);
    res.status(500).json({ error: 'Server error force releasing desk.' });
  }
});

export default router;
