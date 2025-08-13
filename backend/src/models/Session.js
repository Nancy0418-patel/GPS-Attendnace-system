import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  host_id: { type: String, required: true },
  host_location_lat: { type: Number, required: true },
  host_location_lng: { type: Number, required: true },
  created_at: { type: Date, required: true },
  expires_at: { type: Date, required: true },
  is_active: { type: Boolean, default: true }
});

export default mongoose.model('Session', SessionSchema);
