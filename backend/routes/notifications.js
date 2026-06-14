import express from 'express';
import { query } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get recent notifications for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error retrieving notifications.' });
  }
});

// Mark all as read
router.post('/read', authenticateToken, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = $1 WHERE user_id = $2',
      [true, req.user.id] // query handles mapping boolean to SQLite/Postgres automatically in database.js
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Server error marking notifications as read.' });
  }
});

export default router;
