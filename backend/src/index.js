import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import sessionRoutes from './routes/session.js';
import attendanceRoutes from './routes/attendance.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bolt_attendance';

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Bolt Attendance Backend Running');
});

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
