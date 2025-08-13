import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';

const router = express.Router();

// Create a new session (host)
router.post('/', async (req, res) => {
  try {
    const { host_id } = req.body;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 min expiry
    const session_id = uuidv4();
    // Fixed classroom/building location
    const host_location_lat = 21.96309;
    const host_location_lng = 70.77614;
    const session = new Session({
      session_id,
      host_id,
      host_location_lat,
      host_location_lng,
      created_at: now,
      expires_at: expiresAt,
      is_active: true
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session by session_id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findOne({ session_id: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End a session
router.post('/:id/end', async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { session_id: req.params.id },
      { is_active: false },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
