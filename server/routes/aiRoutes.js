import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST endpoint to generate narrative text from form data using OpenAI
router.post('/generate-narrative', async (req, res) => {
  const { patient, visits } = req.body;
  if (!patient) {
    return res.status(400).json({ success: false, error: "Missing patient data" });
  }
  const apiKey = process.env.OPENAI_API_KEY;

  // Build a comprehensive, detailed prompt for professional medical documentation
  let prompt = `Generate a comprehensive, detailed medical narrative report for the following patient. This should be a professional medical document suitable for legal and insurance purposes. Write in a formal, clinical style with detailed sections. Include all relevant clinical findings, assessments, and treatment plans.\n\n`;

  // Patient Demographics
  prompt += `PATIENT DEMOGRAPHICS:\n`;
  prompt += `- Name: ${patient.firstName} ${patient.lastName}\n`;
  prompt += `- Date of Birth: ${patient.dateOfBirth}\n`;
  prompt += `- Gender: ${patient.gender}\n`;
  prompt += `- Age: ${calculateAge(patient.dateOfBirth)}\n`;
  prompt += `- Contact: ${patient.email || 'N/A'}, ${patient.phone || 'N/A'}\n`;
  prompt += `- Address: ${patient.address?.street || ''}, ${patient.address?.city || ''}, ${patient.address?.state || ''} ${patient.address?.zipCode || ''}\n`;
  if (patient.accidentDate) prompt += `- Date of Injury/Accident: ${patient.accidentDate}\n`;
  if (patient.accidentType) prompt += `- Type of Accident: ${patient.accidentType}\n`;
  if (patient.injuryDate) prompt += `- Injury Date: ${patient.injuryDate}\n`;
  prompt += `\n`;

  // Medical History - Detailed
  prompt += `MEDICAL HISTORY:\n`;
  prompt += `- Allergies: ${patient.medicalHistory?.allergies?.length > 0 ? patient.medicalHistory.allergies.join(', ') : 'None reported'}\n`;
  prompt += `- Current Medications: ${patient.medicalHistory?.medications?.length > 0 ? patient.medicalHistory.medications.join(', ') : 'None reported'}\n`;
  prompt += `- Medical Conditions: ${patient.medicalHistory?.conditions?.length > 0 ? patient.medicalHistory.conditions.join(', ') : 'None reported'}\n`;
  prompt += `- Surgical History: ${patient.medicalHistory?.surgeries?.length > 0 ? patient.medicalHistory.surgeries.join(', ') : 'None reported'}\n`;
  prompt += `- Family History: ${patient.medicalHistory?.familyHistory?.length > 0 ? patient.medicalHistory.familyHistory.join(', ') : 'None reported'}\n`;
  prompt += `\n`;

  // Attorney Information
  if (patient.attorney) {
    prompt += `ATTORNEY INFORMATION:\n`;
    prompt += `- Attorney Name: ${patient.attorney.name || 'N/A'}\n`;
    prompt += `- Law Firm: ${patient.attorney.firm || 'N/A'}\n`;
    prompt += `- Contact: ${patient.attorney.phone || 'N/A'}, ${patient.attorney.email || 'N/A'}\n`;
    prompt += `- Case Number: ${patient.attorney.caseNumber || 'N/A'}\n`;
    prompt += `- Address: ${patient.attorney.address?.street || ''}, ${patient.attorney.address?.city || ''}, ${patient.attorney.address?.state || ''} ${patient.attorney.address?.zipCode || ''}\n`;
    prompt += `\n`;
  }

  // Subjective Intake - Detailed
  if (patient.subjective) {
    prompt += `SUBJECTIVE INTAKE:\n`;
    prompt += `- Chief Complaint: ${patient.subjective.fullName || 'N/A'}\n`;
    prompt += `- Date of Onset: ${patient.subjective.date || 'N/A'}\n`;
    prompt += `- Pain Severity: ${patient.subjective.severity || 'N/A'}\n`;
    prompt += `- Timing: ${patient.subjective.timing || 'N/A'}\n`;
    prompt += `- Context: ${patient.subjective.context || 'N/A'}\n`;
    prompt += `- Pain Quality: ${patient.subjective.quality?.join(', ') || 'N/A'}\n`;
    prompt += `- Exacerbating Factors: ${patient.subjective.exacerbatedBy?.join(', ') || 'N/A'}\n`;
    prompt += `- Associated Symptoms: ${patient.subjective.symptoms?.join(', ') || 'N/A'}\n`;
    prompt += `- Pain Radiation: ${patient.subjective.radiatingTo || 'N/A'}\n`;
    prompt += `- Radiating Pain: ${[
      patient.subjective.radiatingLeft && 'Left',
      patient.subjective.radiatingRight && 'Right',
    ].filter(Boolean).join(', ') || 'None'}\n`;
    prompt += `- Sciatica: ${[
      patient.subjective.sciaticaLeft && 'Left',
      patient.subjective.sciaticaRight && 'Right',
    ].filter(Boolean).join(', ') || 'None'}\n`;
    prompt += `- Affected Body Parts: ${patient.subjective.bodyPart?.map(bp => `${bp.part} (${bp.side})`).join(', ') || 'N/A'}\n`;
    prompt += `- Additional Notes: ${patient.subjective.notes || 'N/A'}\n`;
    prompt += `\n`;
  }

  // Process visits in chronological order
  if (visits && visits.length > 0) {
    const sortedVisits = visits.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    prompt += `\nCLINICAL VISIT HISTORY (${visits.length} visits):\n`;
    prompt += `The patient has been seen for ${visits.length} clinical visits. Below is the detailed chronological record of each visit:\n\n`;
    
    sortedVisits.forEach((visit, idx) => {
      const visitType = visit.visitType || 'Visit';
      const visitDate = new Date(visit.date).toLocaleDateString();
      const provider = `Dr. ${visit.doctor?.firstName || ''} ${visit.doctor?.lastName || ''}`;
      
      prompt += `VISIT #${idx + 1} - ${visitType.toUpperCase()} (${visitDate}):\n`;
      prompt += `Provider: ${provider}\n`;
      
      // Initial Visit Details
      if (visit.visitType === 'initial' || visit.__t === 'InitialVisit') {
        prompt += `CHIEF COMPLAINT: ${visit.chiefComplaint || 'N/A'}\n`;
        prompt += `ASSESSMENT: ${visit.assessment || 'N/A'}\n`;
        prompt += `DIAGNOSIS: ${visit.diagnosis?.join(', ') || 'N/A'}\n`;
        
        // Vitals
        if (visit.vitals) {
          prompt += `VITAL SIGNS:\n`;
          if (visit.vitals.heightFeet || visit.vitals.heightInches) {
            prompt += `- Height: ${visit.vitals.heightFeet || 0}'${visit.vitals.heightInches || 0}"\n`;
          }
          if (visit.vitals.weight) prompt += `- Weight: ${visit.vitals.weight} lbs\n`;
          if (visit.vitals.temp) prompt += `- Temperature: ${visit.vitals.temp}°F\n`;
          if (visit.vitals.bpSystolic || visit.vitals.bpDiastolic) {
            prompt += `- Blood Pressure: ${visit.vitals.bpSystolic || 0}/${visit.vitals.bpDiastolic || 0} mmHg\n`;
          }
          if (visit.vitals.pulse) prompt += `- Pulse: ${visit.vitals.pulse} bpm\n`;
        }
        
        // Physical Examination
        if (visit.appearance || visit.orientation || visit.posture || visit.gait) {
          prompt += `PHYSICAL EXAMINATION:\n`;
          if (visit.appearance?.length > 0) prompt += `- Appearance: ${visit.appearance.join(', ')}\n`;
          if (visit.appearanceOther) prompt += `- Appearance Notes: ${visit.appearanceOther}\n`;
          if (visit.orientation?.timePlacePerson) prompt += `- Orientation: ${visit.orientation.timePlacePerson}\n`;
          if (visit.orientation?.other) prompt += `- Orientation Notes: ${visit.orientation.other}\n`;
          if (visit.posture?.length > 0) prompt += `- Posture: ${visit.posture.join(', ')}\n`;
          if (visit.gait?.length > 0) prompt += `- Gait: ${visit.gait.join(', ')}\n`;
          if (visit.gaitDevice) prompt += `- Gait Device: ${visit.gaitDevice}\n`;
        }
        
        // Neurological Examination
        if (visit.dtr || visit.neuroTests || visit.romberg || visit.pronatorDrift) {
          prompt += `NEUROLOGICAL EXAMINATION:\n`;
          if (visit.dtr?.length > 0) prompt += `- Deep Tendon Reflexes: ${visit.dtr.join(', ')}\n`;
          if (visit.dtrOther) prompt += `- DTR Notes: ${visit.dtrOther}\n`;
          if (visit.neuroTests?.length > 0) prompt += `- Neurological Tests: ${visit.neuroTests.join(', ')}\n`;
          if (visit.walkTests?.length > 0) prompt += `- Walk Tests: ${visit.walkTests.join(', ')}\n`;
          if (visit.romberg?.length > 0) prompt += `- Romberg Test: ${visit.romberg.join(', ')}\n`;
          if (visit.rombergNotes) prompt += `- Romberg Notes: ${visit.rombergNotes}\n`;
          if (visit.pronatorDrift) prompt += `- Pronator Drift: ${visit.pronatorDrift}\n`;
        }
        
        // Dermatomes
        if (visit.dermatomes) {
          prompt += `DERMATOMES:\n`;
          Object.entries(visit.dermatomes).forEach(([region, sides]) => {
            const left = sides.left ? (sides.left.hypo ? 'Hypo' : sides.left.hyper ? 'Hyper' : 'Normal') : 'Not tested';
            const right = sides.right ? (sides.right.hypo ? 'Hypo' : sides.right.hyper ? 'Hyper' : 'Normal') : 'Not tested';
            prompt += `- ${region}: Left ${left}, Right ${right}\n`;
          });
        }
        
        // Muscle Strength
        if (visit.muscleStrength?.length > 0 || visit.strength) {
          prompt += `MUSCLE STRENGTH:\n`;
          if (visit.muscleStrength?.length > 0) prompt += `- General: ${visit.muscleStrength.join(', ')}\n`;
          if (visit.strength) {
            Object.entries(visit.strength).forEach(([muscle, sides]) => {
              prompt += `- ${muscle}: Left ${sides.left || 'N/A'}, Right ${sides.right || 'N/A'}\n`;
            });
          }
        }
        
        // Pain Assessment
        if (visit.painLocation?.length > 0 || visit.radiatingTo) {
          prompt += `PAIN ASSESSMENT:\n`;
          if (visit.painLocation?.length > 0) prompt += `- Pain Locations: ${visit.painLocation.join(', ')}\n`;
          if (visit.radiatingTo) prompt += `- Pain Radiation: ${visit.radiatingTo}\n`;
        }
        
        // Range of Motion
        if (visit.arom) {
          prompt += `ACTIVE RANGE OF MOTION:\n`;
          Object.entries(visit.arom).forEach(([movement, data]) => {
            const findings = [];
            if (data.pain) findings.push('Pain');
            if (data.left) findings.push('Left');
            if (data.right) findings.push('Right');
            if (data.bilateral) findings.push('Bilateral');
            if (data.exam) findings.push(data.exam);
            prompt += `- ${movement}: ${findings.join(', ')}\n`;
          });
        }
        
        // Orthopedic Tests
        if (visit.ortho) {
          prompt += `ORTHOPEDIC TESTS:\n`;
          Object.entries(visit.ortho).forEach(([test, data]) => {
            const findings = [];
            if (data.left) findings.push('Left');
            if (data.right) findings.push('Right');
            if (data.bilateral) findings.push('Bilateral');
            if (data.ligLaxity) findings.push(`Ligament Laxity: ${data.ligLaxity}`);
            prompt += `- ${test}: ${findings.join(', ')}\n`;
          });
        }
        
        // Tenderness and Spasm
        if (visit.tenderness || visit.spasm) {
          prompt += `PALPATION FINDINGS:\n`;
          if (visit.tenderness) {
            Object.entries(visit.tenderness).forEach(([area, findings]) => {
              const result = Array.isArray(findings) ? findings.join(', ') : findings;
              prompt += `- Tenderness ${area}: ${result}\n`;
            });
          }
          if (visit.spasm) {
            Object.entries(visit.spasm).forEach(([area, findings]) => {
              const result = Array.isArray(findings) ? findings.join(', ') : findings;
              prompt += `- Spasm ${area}: ${result}\n`;
            });
          }
        }
        
        // Treatment Plan
        prompt += `TREATMENT PLAN:\n`;
        if (visit.chiropracticAdjustment?.length > 0) prompt += `- Chiropractic Adjustments: ${visit.chiropracticAdjustment.join(', ')}\n`;
        if (visit.chiropracticOther) prompt += `- Chiropractic Notes: ${visit.chiropracticOther}\n`;
        if (visit.acupuncture?.length > 0) prompt += `- Acupuncture: ${visit.acupuncture.join(', ')}\n`;
        if (visit.acupunctureOther) prompt += `- Acupuncture Notes: ${visit.acupunctureOther}\n`;
        if (visit.physiotherapy?.length > 0) prompt += `- Physiotherapy: ${visit.physiotherapy.join(', ')}\n`;
        if (visit.rehabilitationExercises?.length > 0) prompt += `- Rehabilitation Exercises: ${visit.rehabilitationExercises.join(', ')}\n`;
        if (visit.durationFrequency) {
          prompt += `- Treatment Frequency: ${visit.durationFrequency.timesPerWeek || 0} times/week\n`;
          prompt += `- Re-evaluation: ${visit.durationFrequency.reEvalInWeeks || 0} weeks\n`;
        }
        if (visit.referrals?.length > 0) prompt += `- Referrals: ${visit.referrals.join(', ')}\n`;
        if (visit.imaging) {
          const imagingTypes = [];
          if (visit.imaging.xray?.length > 0) imagingTypes.push(`X-ray: ${visit.imaging.xray.join(', ')}`);
          if (visit.imaging.mri?.length > 0) imagingTypes.push(`MRI: ${visit.imaging.mri.join(', ')}`);
          if (visit.imaging.ct?.length > 0) imagingTypes.push(`CT: ${visit.imaging.ct.join(', ')}`);
          if (imagingTypes.length > 0) prompt += `- Imaging: ${imagingTypes.join('; ')}\n`;
        }
        if (visit.diagnosticUltrasound) prompt += `- Diagnostic Ultrasound: ${visit.diagnosticUltrasound}\n`;
        if (visit.nerveStudy?.length > 0) prompt += `- Nerve Studies: ${visit.nerveStudy.join(', ')}\n`;
        if (visit.restrictions) {
          prompt += `- Activity Restrictions: Avoid activity for ${visit.restrictions.avoidActivityWeeks || 0} weeks\n`;
          prompt += `- Lifting Limit: ${visit.restrictions.liftingLimitLbs || 0} lbs\n`;
          if (visit.restrictions.avoidProlongedSitting) prompt += `- Avoid Prolonged Sitting: Yes\n`;
        }
        if (visit.disabilityDuration) prompt += `- Disability Duration: ${visit.disabilityDuration}\n`;
        if (visit.otherNotes) prompt += `- Additional Notes: ${visit.otherNotes}\n`;
      }
      
      // Follow-up Visit Details
      else if (visit.visitType === 'followup' || visit.__t === 'FollowupVisit') {
        prompt += `PROGRESS ASSESSMENT:\n`;
        prompt += `- Areas of Concern: ${visit.areas || 'N/A'}\n`;
        const progressStatus = [];
        if (visit.areasImproving) progressStatus.push('Improving');
        if (visit.areasExacerbated) progressStatus.push('Exacerbated');
        if (visit.areasSame) progressStatus.push('Same');
        if (visit.areasResolved) progressStatus.push('Resolved');
        if (progressStatus.length > 0) prompt += `- Progress Status: ${progressStatus.join(', ')}\n`;
        
        if (visit.musclePalpation) prompt += `- Muscle Palpation: ${visit.musclePalpation}\n`;
        if (visit.painRadiating) prompt += `- Pain Radiation: ${visit.painRadiating}\n`;
        
        // Range of Motion Assessment
        const romStatus = [];
        if (visit.romWnlNoPain) romStatus.push('Within Normal Limits (No Pain)');
        if (visit.romWnlWithPain) romStatus.push('Within Normal Limits (With Pain)');
        if (visit.romImproved) romStatus.push('Improved');
        if (visit.romDecreased) romStatus.push('Decreased');
        if (visit.romSame) romStatus.push('Same');
        if (romStatus.length > 0) prompt += `- Range of Motion: ${romStatus.join(', ')}\n`;
        
        if (visit.orthos?.tests) prompt += `- Orthopedic Tests: ${visit.orthos.tests} - ${visit.orthos.result || 'N/A'}\n`;
        if (visit.activitiesCausePain) prompt += `- Activities Causing Pain: ${visit.activitiesCausePain}\n`;
        if (visit.activitiesCausePainOther) prompt += `- Other Painful Activities: ${visit.activitiesCausePainOther}\n`;
        
        // Treatment Plan
        if (visit.treatmentPlan) {
          prompt += `TREATMENT PLAN:\n`;
          if (visit.treatmentPlan.treatments) prompt += `- Treatments: ${visit.treatmentPlan.treatments}\n`;
          if (visit.treatmentPlan.timesPerWeek) prompt += `- Frequency: ${visit.treatmentPlan.timesPerWeek}\n`;
          const treatments = [];
          if (visit.treatmentPlan.chiropractic) treatments.push('Chiropractic');
          if (visit.treatmentPlan.acupuncture) treatments.push('Acupuncture');
          if (visit.treatmentPlan.mechanicalTraction) treatments.push('Mechanical Traction');
          if (visit.treatmentPlan.myofascialRelease) treatments.push('Myofascial Release');
          if (visit.treatmentPlan.ultrasound) treatments.push('Ultrasound');
          if (visit.treatmentPlan.infraredElectricMuscleStimulation) treatments.push('Infrared Electric Muscle Stimulation');
          if (visit.treatmentPlan.therapeuticExercise) treatments.push('Therapeutic Exercise');
          if (visit.treatmentPlan.neuromuscularReeducation) treatments.push('Neuromuscular Reeducation');
          if (treatments.length > 0) prompt += `- Treatment Modalities: ${treatments.join(', ')}\n`;
          if (visit.treatmentPlan.other) prompt += `- Other Treatments: ${visit.treatmentPlan.other}\n`;
        }
        
        // Overall Response
        if (visit.overallResponse) {
          const response = [];
          if (visit.overallResponse.improving) response.push('Improving');
          if (visit.overallResponse.worse) response.push('Worse');
          if (visit.overallResponse.same) response.push('Same');
          if (response.length > 0) prompt += `- Overall Response: ${response.join(', ')}\n`;
        }
        
        if (visit.diagnosticStudy?.study) {
          prompt += `- Diagnostic Study: ${visit.diagnosticStudy.study} of ${visit.diagnosticStudy.bodyPart || 'N/A'} - ${visit.diagnosticStudy.result || 'N/A'}\n`;
        }
        
        if (visit.homeCare) {
          if (Array.isArray(visit.homeCare)) {
            prompt += `- Home Care Instructions: ${visit.homeCare.join(', ')}\n`;
          } else {
            const homeCareItems = [];
            if (visit.homeCare.coreProgram) homeCareItems.push('Core Program');
            if (visit.homeCare.stretches) homeCareItems.push('Stretches');
            if (visit.homeCare.icePackHotPack) homeCareItems.push('Ice/Heat Pack');
            if (visit.homeCare.ligamentStabilityProgram) homeCareItems.push('Ligament Stability Program');
            if (homeCareItems.length > 0) prompt += `- Home Care: ${homeCareItems.join(', ')}\n`;
            if (visit.homeCare.other) prompt += `- Other Home Care: ${visit.homeCare.other}\n`;
          }
        }
        
        if (visit.homeCareSuggestions) prompt += `- Home Care Suggestions: ${visit.homeCareSuggestions}\n`;
        if (visit.referral) prompt += `- Referral: ${visit.referral}\n`;
        if (visit.otherNotes) prompt += `- Additional Notes: ${visit.otherNotes}\n`;
      }
      
      // Discharge Visit Details
      else if (visit.visitType === 'discharge' || visit.__t === 'DischargeVisit') {
        prompt += `DISCHARGE ASSESSMENT:\n`;
        if (visit.treatmentSummary) prompt += `- Treatment Summary: ${visit.treatmentSummary}\n`;
        if (visit.dischargeStatus) prompt += `- Discharge Status: ${visit.dischargeStatus}\n`;
        if (visit.prognosis) prompt += `- Prognosis: ${visit.prognosis}\n`;
        if (visit.romPercent) prompt += `- Range of Motion: ${visit.romPercent}% of pre-injury ROM\n`;
        
        if (visit.dischargeDiagnosis?.length > 0) prompt += `- Discharge Diagnosis: ${visit.dischargeDiagnosis.join(', ')}\n`;
        if (visit.medicationsAtDischarge?.length > 0) {
          prompt += `- Medications at Discharge:\n`;
          visit.medicationsAtDischarge.forEach(med => {
            prompt += `  * ${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}\n`;
          });
        }
        
        if (visit.followUpInstructions) prompt += `- Follow-up Instructions: ${visit.followUpInstructions}\n`;
        if (visit.returnPrecautions?.length > 0) prompt += `- Return Precautions: ${visit.returnPrecautions.join(', ')}\n`;
        
        if (visit.futureMedicalCare?.length > 0) prompt += `- Recommended Future Medical Care: ${visit.futureMedicalCare.join(', ')}\n`;
        if (visit.croftCriteria) prompt += `- Croft Criteria: ${visit.croftCriteria}\n`;
        if (visit.amaDisability) prompt += `- AMA Disability: ${visit.amaDisability}\n`;
        if (visit.referralsNotes) prompt += `- Referral Notes: ${visit.referralsNotes}\n`;
      }
      
      prompt += `\n`;
    });
    
    // Add summary information
    const initialVisit = sortedVisits.find(v => v.visitType === 'initial' || v.__t === 'InitialVisit');
    const followupVisits = sortedVisits.filter(v => v.visitType === 'followup' || v.__t === 'FollowupVisit');
    const dischargeVisit = sortedVisits.find(v => v.visitType === 'discharge' || v.__t === 'DischargeVisit');
    
    prompt += `\nTREATMENT SUMMARY:\n`;
    prompt += `- Initial Evaluation: ${initialVisit ? `Completed on ${new Date(initialVisit.date).toLocaleDateString()}` : 'Not completed'}\n`;
    prompt += `- Follow-up Visits: ${followupVisits.length} visits completed\n`;
    prompt += `- Discharge Status: ${dischargeVisit ? `Discharged on ${new Date(dischargeVisit.date).toLocaleDateString()}` : 'Patient remains under active care'}\n`;
    prompt += `- Total Treatment Duration: ${sortedVisits.length > 1 ? `${Math.round((new Date(sortedVisits[sortedVisits.length - 1].date) - new Date(sortedVisits[0].date)) / (1000 * 60 * 60 * 24))} days` : 'Single visit'}\n`;
  }

  prompt += `\nPlease generate a comprehensive, detailed medical narrative report using all the above information. The report should be written in a professional medical style suitable for legal and insurance purposes. 

IMPORTANT FORMATTING REQUIREMENTS:
- Use **bold headings** for each major section
- Write in a narrative, flowing style with complete sentences and paragraphs
- Include detailed clinical findings, assessments, treatment plans, and progress notes
- Use professional medical terminology and clinical language
- Structure the report with the following sections:

**PATIENT DEMOGRAPHICS AND HISTORY**
Provide a comprehensive overview of the patient's demographic information, including age, gender, occupation, and relevant personal history. Include details about the mechanism of injury, date of onset, and any contributing factors.

**CHIEF COMPLAINT AND PRESENTING SYMPTOMS**
Describe in detail the patient's primary complaints, including the nature, location, intensity, and characteristics of pain or symptoms. Include information about onset, duration, frequency, and any aggravating or relieving factors.

**MEDICAL HISTORY REVIEW**
Comprehensive review of the patient's medical history, including relevant past injuries, surgeries, medications, allergies, and family history that may impact current treatment.

**PHYSICAL EXAMINATION FINDINGS**
Detailed documentation of all physical examination findings, including vital signs, range of motion measurements, strength testing, neurological findings, orthopedic test results, and any other relevant clinical observations.

**CLINICAL ASSESSMENT AND DIAGNOSIS**
Professional clinical assessment including differential diagnoses, working diagnoses, and clinical impressions based on examination findings and patient history.

**TREATMENT PLAN AND INTERVENTIONS**
Comprehensive treatment plan including specific interventions, modalities, exercises, frequency of care, and rationale for each treatment approach. Include expected outcomes and treatment goals.

**PROGRESS NOTES AND OUTCOMES**
Detailed documentation of patient progress, response to treatment, functional improvements, and any changes in symptoms or clinical findings over the course of care.

**RECOMMENDATIONS AND FOLLOW-UP**
Specific recommendations for continued care, home exercises, activity modifications, and follow-up scheduling. Include any referrals or additional diagnostic studies if indicated.

Each section should be comprehensive and detailed, providing a complete clinical picture suitable for medical-legal documentation. Write in a professional narrative style that flows naturally from one section to the next.`;

  try {
    const openai = new OpenAI({ apiKey });

    console.log('Attempting to generate comprehensive narrative with OpenAI...');
    console.log('API Key available:', !!apiKey);
    console.log('Patient data received:', !!patient);
    console.log('Visits count:', visits?.length || 0);
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Using GPT-4 for better quality
      messages: [
        {
          role: 'system',
          content: `You are a highly experienced medical documentation specialist who creates comprehensive, detailed medical narratives for chiropractic and physical therapy practices. Your reports should be thorough, professional, and suitable for legal and insurance purposes.

WRITING STYLE REQUIREMENTS:
- Write in a narrative, flowing style with complete sentences and paragraphs
- Use professional medical terminology and clinical language
- Provide detailed descriptions of all clinical findings and interventions
- Include comprehensive assessments and treatment rationales
- Structure information logically with clear transitions between sections
- Write as if documenting for medical-legal purposes with attention to detail
- Use active voice and present tense for current findings
- Include specific measurements, ranges, and clinical observations
- Provide detailed treatment plans with rationale and expected outcomes
- Document progress and response to treatment comprehensively

Your narrative should read like a professional medical report that would be suitable for insurance companies, legal proceedings, and other healthcare providers.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent, professional output
      max_tokens: 4000 // Increased for more detailed reports
    });

    const generatedText = response.choices[0]?.message?.content || "Unable to generate narrative at this time.";
    console.log('Successfully generated comprehensive narrative');
    console.log('Generated text length:', generatedText.length);
    console.log('Generated text preview:', generatedText.substring(0, 200) + '...');
    res.json({ 
      success: true,
      narrative: generatedText 
    });

  } catch (error) {
    console.error('Error generating narrative:', error);
    
    let errorMessage = 'Failed to generate narrative text';
    if (error.status === 401) {
          errorMessage = 'Invalid API key';
    } else if (error.status === 429) {
          errorMessage = 'Too many requests - please try again later';
    } else if (error.status === 500) {
          errorMessage = 'AI service unavailable';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error.message 
    });
  }
});

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default router;
