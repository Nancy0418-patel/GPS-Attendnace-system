import express from 'express';
import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';

const router = express.Router();

// Mark attendance (student)
router.post('/', async (req, res) => {
  try {
    const { session_id, student_id, student_name, student_location_lat, student_location_lng } = req.body;
    const session = await Session.findOne({ session_id });
    if (!session || !session.is_active) {
      return res.status(400).json({ error: 'Session not found or inactive' });
    }
    // Check expiry
    if (new Date() > session.expires_at) {
      return res.status(400).json({ error: 'Session expired' });
    }
    // Check if already marked
    const existing = await Attendance.findOne({ session_id, student_id });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked' });
    }
    // Calculate distance (Haversine formula)
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371000; // meters
    const dLat = toRad(student_location_lat - session.host_location_lat);
    const dLon = toRad(student_location_lng - session.host_location_lng);
    const lat1 = toRad(session.host_location_lat);
    const lat2 = toRad(student_location_lat);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    if (distance > 500) {
      return res.status(400).json({ error: 'Not within 500m geofence', distance });
    }
    const attendance = new Attendance({
      session_id,
      student_id,
      student_name,
      student_location_lat,
      student_location_lng,
      distance_meters: distance,
      marked_at: new Date()
    });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for a session
router.get('/session/:session_id', async (req, res) => {
  try {
    const records = await Attendance.find({ session_id: req.params.session_id });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent attendance for a student
router.get('/student/:student_id', async (req, res) => {
  try {
    const records = await Attendance.find({ student_id: req.params.student_id }).sort({ marked_at: -1 }).limit(5);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
