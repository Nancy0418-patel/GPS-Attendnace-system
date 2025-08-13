import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  student_id: { type: String, required: true },
  student_name: { type: String, required: true },
  student_location_lat: { type: Number, required: true },
  student_location_lng: { type: Number, required: true },
  distance_meters: { type: Number, required: true },
  marked_at: { type: Date, required: true }
});

export default mongoose.model('Attendance', AttendanceSchema);
