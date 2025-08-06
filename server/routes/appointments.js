import express from 'express';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();


// Cancel appointment
router.patch('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If user is a doctor, check if appointment is for them
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update status to cancelled
    appointment.status = 'cancelled';
    appointment.notes = req.body.notes || appointment.notes;
    await appointment.save();
    
    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark appointment as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If user is a doctor, check if appointment is for them
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update status to completed
    appointment.status = 'completed';
    appointment.notes = req.body.notes || appointment.notes;
    await appointment.save();
    
    res.json({
      message: 'Appointment marked as completed',
      appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all appointments (with filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      doctor, 
      patient: patientId 
    } = req.query;
    
    // Build filter
    const filter = {};
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Doctor filter
    if (doctor) {
      filter.doctor = doctor;
    } else if (req.user.role === 'doctor') {
      // If user is a doctor, only show their appointments
      filter.doctor = req.user.id;
    }
    
    // Patient filter
    if (patientId) {
      filter.patient = patientId;
    }
    
    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .sort({ date: 1, 'time.start': 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName dateOfBirth gender phone email')
      .populate('doctor', 'firstName lastName');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If user is a doctor, check if appointment is for them
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(appointmentData.patient);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // If user is a doctor, check if patient is assigned to them
    if (req.user.role === 'doctor') {
      if (patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: Patient not assigned to you' });
      }
      
      // Set doctor to current user
      appointmentData.doctor = req.user.id;
    }
    
    // Remove conflict check: allow multiple appointments for same slot
    const appointment = new Appointment(appointmentData);
    await appointment.save();
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If user is a doctor, check if appointment is for them
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Remove conflict check: allow multiple appointments for same slot
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // If doctor, make sure it's theirs
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;