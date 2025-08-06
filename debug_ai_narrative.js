// Debug script to test AI narrative generation
import axios from 'axios';

const testAIGeneration = async () => {
  try {
    console.log('Testing AI narrative generation...');
    
    // Test data
    const testPatient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      gender: 'male',
      email: 'john.doe@test.com',
      phone: '555-0123',
      medicalHistory: {
        allergies: ['None'],
        medications: ['Ibuprofen'],
        conditions: ['Lower back pain'],
        surgeries: [],
        familyHistory: []
      }
    };

    const testVisits = [{
      _id: 'test123',
      visitType: 'initial',
      date: '2024-01-01',
      chiefComplaint: 'Lower back pain after car accident',
      doctor: {
        firstName: 'Dr. Jane',
        lastName: 'Smith'
      }
    }];

    console.log('Sending request to AI endpoint...');
    const response = await axios.post('https://emr-h.onrender.com/api/ai/generate-narrative', {
      patient: testPatient,
      visits: testVisits
    });

    console.log('Response received:', {
      success: response.data.success,
      hasNarrative: !!response.data.narrative,
      narrativeLength: response.data.narrative ? response.data.narrative.length : 0
    });

    if (response.data.narrative) {
      console.log('AI Narrative Preview (first 500 chars):');
      console.log(response.data.narrative.substring(0, 500));
    } else {
      console.log('No narrative generated!');
    }

  } catch (error) {
    console.error('Error testing AI generation:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
};

testAIGeneration();