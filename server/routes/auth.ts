import { Router } from 'express';
import { db } from '../db';
import crypto from 'crypto';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query(
      'SELECT id, name, email, role, department, institution_name, roll_number, points, tier, avatar_url, status FROM users WHERE LOWER(email) = LOWER($1) AND password = $2',
      [email.trim(), password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0] as any;
    if (user.status !== 'active') {
      return res.status(403).json({ error: `Your account is currently ${user.status}` });
    }

    res.json({
      success: true,
      user,
      token: `token-${user.id}-${Date.now()}`
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', department, institution_name, roll_number } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = `usr-${role}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    const tier = role === 'student' ? 'Bronze' : (role === 'issuer' ? 'Issuer' : 'Admin');
    const initialPoints = role === 'student' ? 50 : 0; // welcome 50 pts on registration

    await db.query(
      `INSERT INTO users (id, name, email, password, role, department, institution_name, roll_number, points, tier, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')`,
      [
        id,
        name.trim(),
        email.trim().toLowerCase(),
        password,
        role,
        department || 'General Studies',
        institution_name || 'SRIT College of Engineering & Research',
        roll_number || null,
        initialPoints,
        tier,
        avatar_url
      ]
    );

    const newUser = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department || 'General Studies',
      institution_name: institution_name || 'SRIT College of Engineering & Research',
      roll_number: roll_number || null,
      points: initialPoints,
      tier,
      avatar_url,
      status: 'active'
    };

    res.status(201).json({
      success: true,
      user: newUser,
      token: `token-${id}-${Date.now()}`
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await db.query(
      'SELECT id, name, email, role, department, institution_name, roll_number, points, tier, avatar_url, status, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all demo accounts for instantaneous testing
router.get('/demo-users', async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, department, institution_name, roll_number, points, tier, avatar_url FROM users ORDER BY role, name'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Demo users error:', error);
    res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

// Update profile
router.patch('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, department, institution_name, roll_number, avatar_url } = req.body;

    await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           department = COALESCE($2, department),
           institution_name = COALESCE($3, institution_name),
           roll_number = COALESCE($4, roll_number),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $6`,
      [name, department, institution_name, roll_number, avatar_url, userId]
    );

    const updated = await db.query(
      'SELECT id, name, email, role, department, institution_name, roll_number, points, tier, avatar_url, status FROM users WHERE id = $1',
      [userId]
    );

    res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
