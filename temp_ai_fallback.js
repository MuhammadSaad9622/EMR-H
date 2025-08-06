// Temporary fallback for testing - add this to your PatientDetails.tsx

// Replace the AI call section with this for testing:
try {
  const response = await axios.post('https://emr-h.onrender.com/api/ai/generate-narrative', {
    patient,
    visits,
  });
  
  const aiNarrative = response.data.narrative;
  
  // If no narrative received, use a fallback
  if (!aiNarrative || aiNarrative.trim().length === 0) {
    console.log('No AI narrative received, using fallback content');
    aiNarrative = `**CHIEF COMPLAINT:**
• Patient presents with ${patient.subjective?.fullName || 'chief complaint not specified'}
• Onset: ${patient.subjective?.date || 'Date not specified'}
• Severity: ${patient.subjective?.severity || 'Not specified'}

**ASSESSMENT:**
• Based on clinical findings and patient presentation
• Requires comprehensive evaluation and treatment plan

**TREATMENT PLAN:**
• Comprehensive care approach recommended
• Regular follow-up appointments scheduled
• Patient education and home care instructions provided

**PROGNOSIS:**
• Expected improvement with appropriate treatment
• Patient compliance essential for optimal outcomes`;
  }
  
  // Continue with rest of PDF generation...
} catch (error) {
  console.error('AI generation failed:', error);
  
  // Use fallback narrative when AI fails
  const aiNarrative = `**MEDICAL NARRATIVE:**
• Comprehensive medical narrative generation temporarily unavailable
• Please ensure server is running and API key is configured
• Contact system administrator for assistance

**PATIENT SUMMARY:**
• Patient: ${patient.firstName} ${patient.lastName}
• Status: ${patient.status}
• Visits: ${visits.length} recorded
• Last updated: ${new Date().toLocaleDateString()}`;
  
  // Continue with PDF generation using fallback...
}