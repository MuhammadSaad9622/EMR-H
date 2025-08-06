import express from 'express';
// Add this import at the top
import Patient from '../models/Patient.js';
import { Visit, InitialVisit, FollowupVisit, DischargeVisit } from '../models/Visit.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware for initial visit
const validateInitialVisit = (req, res, next) => {
  const { visitType, chiefComplaint, patient, doctor } = req.body;

  if (visitType !== 'initial') return next();

  if (!patient || !doctor) {
    return res.status(400).json({ 
      message: 'Missing required fields', 
      required: ['patient', 'doctor'] 
    });    
  }

  next();
};

// Validation middleware for followup visit
const validateFollowupVisit = (req, res, next) => {
  const { visitType, previousVisit, patient, doctor } = req.body;

  if (visitType !== 'followup') return next();

  if (!previousVisit || !patient || !doctor) {
    return res.status(400).json({ 
      message: 'Missing required fields for followup visit', 
      required: ['previousVisit', 'patient', 'doctor'] 
    });    
  }

  next();
};


// Create a visit based on visitType
router.post('/', authenticateToken, validateInitialVisit, validateFollowupVisit, async (req, res) => {
  try {
    console.log('Received visit data:', req.body);
    const { visitType, ...visitData } = req.body;

    // Add doctor from auth token if not provided
    if (!visitData.doctor) {
      visitData.doctor = req.user.id;
    }

    let newVisit;

    if (visitType === 'initial') {
      newVisit = new InitialVisit(visitData);
    } else if (visitType === 'followup') {
      newVisit = new FollowupVisit(visitData);
    } else if (visitType === 'discharge') {
      newVisit = new DischargeVisit(visitData);

      // ✅ Also update patient status to discharged
      await Patient.findByIdAndUpdate(visitData.patient, {
        status: 'discharged'
      });
    } else {
      return res.status(400).json({ message: 'Invalid visit type' });
    }

    const savedVisit = await newVisit.save();

    // Populate patient and doctor
    await savedVisit.populate('patient', 'firstName lastName dateOfBirth');
    await savedVisit.populate('doctor', 'firstName lastName');

    res.status(201).json({
      message: 'Visit created successfully',
      visit: savedVisit
    });

  } catch (error) {
    console.error('Visit creation error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate visit',
        error: 'A visit with these details already exists'
      });
    }

    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


// Get all visits for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const visits = await Visit.find({ patient: req.params.patientId })
      .populate('doctor')
      .populate('patient');

    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific visit by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName');

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Check if user has permission to view this visit
    if (req.user.role === 'doctor' && visit.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a visit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Check if user has permission to update this visit
    if (req.user.role === 'doctor' && visit.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update the visit with the provided data
    const updatedVisit = await Visit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Populate patient and doctor for the response
    await updatedVisit.populate('patient', 'firstName lastName dateOfBirth');
    await updatedVisit.populate('doctor', 'firstName lastName');

    res.json({
      message: 'Visit updated successfully',
      visit: updatedVisit
    });

  } catch (error) {
    console.error('Update visit error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Patch a visit (partial update)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Check if user has permission to update this visit
    if (req.user.role === 'doctor' && visit.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update the visit with the provided data
    const updatedVisit = await Visit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Populate patient and doctor for the response
    await updatedVisit.populate('patient', 'firstName lastName dateOfBirth');
    await updatedVisit.populate('doctor', 'firstName lastName');

    res.json({
      message: 'Visit updated successfully',
      visit: updatedVisit
    });

  } catch (error) {
    console.error('Patch visit error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;