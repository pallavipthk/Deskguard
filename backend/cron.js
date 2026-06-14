import cron from 'node-cron';
import { query } from './database.js';
import { broadcastDeskUpdate, sendNotificationToUser } from './socket.js';

// Configuration timeouts in milliseconds (standard: 20m for Away, 2h for checkin verification prompt, 5m verification grace)
const AWAY_TIMEOUT_MS = 20 * 60 * 1000;
const VERIFICATION_PROMPT_MS = 2 * 60 * 60 * 1000;
const GRACE_PERIOD_MS = 5 * 60 * 1000;

// Exported checker function to allow manual triggering in testing
export const checkTimeouts = async () => {
  const now = new Date();
  console.log(`[Cron] Checking session timeouts at: ${now.toLocaleTimeString()}`);

  try {
    // ----------------------------------------------------
    // TASK 1: Expire Away sessions (Away > 20 mins)
    // ----------------------------------------------------
    const awaySessions = await query(
      "SELECT s.*, d.name as desk_name FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.status = 'away'"
    );

    for (const session of awaySessions.rows) {
      const awayStart = new Date(session.away_started_at);
      const diffMs = now.getTime() - awayStart.getTime();

      if (diffMs >= AWAY_TIMEOUT_MS) {
        console.log(`[Cron] Away session ${session.id} expired for Desk ${session.desk_id}. Releasing desk...`);

        // A. Terminate session as abandoned
        await query(
          "UPDATE sessions SET status = 'abandoned', checked_out_at = $1 WHERE id = $2",
          [now.toISOString(), session.id]
        );

        // B. Free the desk
        await query(
          'UPDATE desks SET status = $1, current_session_id = NULL WHERE id = $2',
          ['available', session.desk_id]
        );

        // C. Notify user in DB and via socket
        const message = `Your Away period at ${session.desk_name} expired. The desk has been released.`;
        await query(
          'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
          [session.user_id, message, 'alert']
        );

        sendNotificationToUser(session.user_id, message, 'alert');
        broadcastDeskUpdate(session.desk_id, 'available', null);
      }
    }

    // ----------------------------------------------------
    // TASK 2: Trigger "Still Here?" prompts (Active > 2h without check)
    // ----------------------------------------------------
    const activeSessions = await query(
      "SELECT s.*, d.name as desk_name FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.status = 'active' AND s.verification_pending_at IS NULL"
    );

    for (const session of activeSessions.rows) {
      const lastCheck = new Date(session.last_ping_at || session.checked_in_at);
      const diffMs = now.getTime() - lastCheck.getTime();

      if (diffMs >= VERIFICATION_PROMPT_MS) {
        console.log(`[Cron] Session ${session.id} (Desk ${session.desk_id}) needs presence verification.`);

        // A. Flag verification pending at current timestamp
        await query(
          'UPDATE sessions SET verification_pending_at = $1 WHERE id = $2',
          [now.toISOString(), session.id]
        );

        // B. Notify user
        const message = `Still at ${session.desk_name}? Please confirm your presence within 5 minutes or your desk will be released.`;
        await query(
          'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
          [session.user_id, message, 'warning']
        );

        sendNotificationToUser(session.user_id, message, 'warning');
        // We also broadcast an update to the desk socket if needed, or simply send the user the warning.
        // The student page will see the verificationPendingAt flag when it pings or via socket.
      }
    }

    // ----------------------------------------------------
    // TASK 3: Expire pending verifications (No response > 5 mins)
    // ----------------------------------------------------
    const pendingSessions = await query(
      "SELECT s.*, d.name as desk_name FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.status = 'active' AND s.verification_pending_at IS NOT NULL"
    );

    for (const session of pendingSessions.rows) {
      const pendingTime = new Date(session.verification_pending_at);
      const diffMs = now.getTime() - pendingTime.getTime();

      if (diffMs >= GRACE_PERIOD_MS) {
        console.log(`[Cron] Session ${session.id} (Desk ${session.desk_id}) failed presence verification. Releasing desk...`);

        // A. Update session as abandoned
        await query(
          "UPDATE sessions SET status = 'abandoned', checked_out_at = $1 WHERE id = $2",
          [now.toISOString(), session.id]
        );

        // B. Update desk status
        await query(
          'UPDATE desks SET status = $1, current_session_id = NULL WHERE id = $2',
          ['available', session.desk_id]
        );

        // C. Notify user in DB and via socket
        const message = `Session terminated. You failed to respond to the presence check at ${session.desk_name}.`;
        await query(
          'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
          [session.user_id, message, 'alert']
        );

        sendNotificationToUser(session.user_id, message, 'alert');
        broadcastDeskUpdate(session.desk_id, 'available', null);
      }
    }

  } catch (error) {
    console.error('Error running cron timeout checks:', error);
  }
};

// Start the scheduler (runs every minute)
export const startCron = () => {
  cron.schedule('* * * * *', () => {
    checkTimeouts();
  });
  console.log('[Cron] Timeout background scheduler initialized to run every minute.');
};
