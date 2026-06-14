import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register Endpoint
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  const assignedRole = role || 'student';
  if (!['student', 'librarian', 'admin'].includes(assignedRole)) {
    return res.status(400).json({ error: 'Invalid user role.' });
  }

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, passwordHash, assignedRole]
    );

    let newUser = result.rows[0];
    
    // SQLite compatibility handling:
    if (!newUser) {
      const sqliteResult = await query(
        'SELECT id, username, email, role FROM users WHERE username = $1',
        [username]
      );
      newUser = sqliteResult.rows[0];
    }

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during user registration.' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  const { loginIdentifier, password } = req.body; // Can be username or email

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  try {
    const userResult = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [loginIdentifier, loginIdentifier]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Profile / Current User Endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
});

export default router;
