import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST endpoint to generate narrative text from form data using OpenAI
router.post('/generate-narrative', async (req, res) => {
  console.log('AI Narrative Generation Request:', {
    hasPatient: !!req.body.patient,
    hasVisits: !!req.body.visits,
    patientKeys: req.body.patient ? Object.keys(req.body.patient) : [],
    visitsCount: req.body.visits ? req.body.visits.length : 0
  });
  
  const { patient, visits } = req.body;
  if (!patient) {
    console.error('Missing patient data in request');
    return res.status(400).json({ success: false, error: "Missing patient data" });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OpenAI API key not found in environment variables');
    return res.status(500).json({ success: false, error: "OpenAI API key not configured" });
  }

  // Build patient data for JSON-based medical narrative generation
  let prompt = `PATIENT DATA:\n\n`;

  // Medical History - Detailed
  prompt += `PAST MEDICAL HISTORY:\n`;
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
    prompt += `CHIEF COMPLAINT:\n`;
    prompt += `- Primary Complaint: ${patient.subjective.fullName || 'N/A'}\n`;
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
    
    prompt += `HISTORY OF PRESENT ILLNESS:\n`;
    prompt += `- Mechanism of Injury: ${patient.accidentType || 'N/A'}\n`;
    prompt += `- Date of Injury: ${patient.accidentDate || patient.injuryDate || 'N/A'}\n`;
    prompt += `- Initial Symptoms: ${patient.subjective.symptoms?.join(', ') || 'N/A'}\n`;
    prompt += `- Progression of Symptoms: ${patient.subjective.timing || 'N/A'}\n`;
    prompt += `- Aggravating Factors: ${patient.subjective.exacerbatedBy?.join(', ') || 'N/A'}\n`;
    prompt += `- Relieving Factors: ${patient.subjective.context || 'N/A'}\n`;
    prompt += `- Impact on Daily Activities: ${patient.subjective.notes || 'N/A'}\n`;
    prompt += `\n`;
  }

  // Process visits in chronological order
  if (visits && visits.length > 0) {
    const sortedVisits = visits.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedVisits.forEach((visit, idx) => {
      const visitType = visit.visitType || 'Visit';
      const visitDate = new Date(visit.date).toLocaleDateString();
      const provider = `Dr. ${visit.doctor?.firstName || ''} ${visit.doctor?.lastName || ''}`;
      
      prompt += `${visitType.toUpperCase()} #${idx + 1} - ${visitDate}:\n`;
      prompt += `Provider: ${provider}\n`;
      
      // Initial Visit Details
      if (visit.visitType === 'initial' || visit.__t === 'InitialVisit') {
        prompt += `PHYSICAL EXAMINATION:\n`;
        prompt += `- Chief Complaint: ${visit.chiefComplaint || 'N/A'}\n`;
        prompt += `- Assessment: ${visit.assessment || 'N/A'}\n`;
        prompt += `- Diagnosis: ${visit.diagnosis?.join(', ') || 'N/A'}\n`;
        
        // Vitals
        if (visit.vitals) {
          prompt += `- Vital Signs:\n`;
          if (visit.vitals.heightFeet || visit.vitals.heightInches) {
            prompt += `  * Height: ${visit.vitals.heightFeet || 0}'${visit.vitals.heightInches || 0}"\n`;
          }
          if (visit.vitals.weight) prompt += `  * Weight: ${visit.vitals.weight} lbs\n`;
          if (visit.vitals.temp) prompt += `  * Temperature: ${visit.vitals.temp}°F\n`;
          if (visit.vitals.bpSystolic || visit.vitals.bpDiastolic) {
            prompt += `  * Blood Pressure: ${visit.vitals.bpSystolic || 0}/${visit.vitals.bpDiastolic || 0} mmHg\n`;
          }
          if (visit.vitals.pulse) prompt += `  * Pulse: ${visit.vitals.pulse} bpm\n`;
        }
        
        // Physical Examination
        if (visit.appearance || visit.orientation || visit.posture || visit.gait) {
          prompt += `- General Appearance: ${visit.appearance?.length > 0 ? visit.appearance.join(', ') : 'Normal'}\n`;
          if (visit.appearanceOther) prompt += `  * Additional Notes: ${visit.appearanceOther}\n`;
          prompt += `- Mental Status: ${visit.orientation?.timePlacePerson || 'Alert and oriented'}\n`;
          if (visit.orientation?.other) prompt += `  * Orientation Notes: ${visit.orientation.other}\n`;
          prompt += `- Posture: ${visit.posture?.length > 0 ? visit.posture.join(', ') : 'Normal'}\n`;
          prompt += `- Gait: ${visit.gait?.length > 0 ? visit.gait.join(', ') : 'Normal'}\n`;
          if (visit.gaitDevice) prompt += `  * Gait Device: ${visit.gaitDevice}\n`;
        }
        
        // Neurological Examination
        if (visit.dtr || visit.neuroTests || visit.romberg || visit.pronatorDrift) {
          prompt += `- Neurological Examination:\n`;
          if (visit.dtr?.length > 0) prompt += `  * Deep Tendon Reflexes: ${visit.dtr.join(', ')}\n`;
          if (visit.dtrOther) prompt += `  * DTR Notes: ${visit.dtrOther}\n`;
          if (visit.neuroTests?.length > 0) prompt += `  * Neurological Tests: ${visit.neuroTests.join(', ')}\n`;
          if (visit.walkTests?.length > 0) prompt += `  * Walk Tests: ${visit.walkTests.join(', ')}\n`;
          if (visit.romberg?.length > 0) prompt += `  * Romberg Test: ${visit.romberg.join(', ')}\n`;
          if (visit.rombergNotes) prompt += `  * Romberg Notes: ${visit.rombergNotes}\n`;
          if (visit.pronatorDrift) prompt += `  * Pronator Drift: ${visit.pronatorDrift}\n`;
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
        prompt += `- Chiropractic Care:\n`;
        if (visit.chiropracticAdjustment?.length > 0) prompt += `  * Adjustments: ${visit.chiropracticAdjustment.join(', ')}\n`;
        if (visit.chiropracticOther) prompt += `  * Additional Notes: ${visit.chiropracticOther}\n`;
        prompt += `- Therapeutic Modalities:\n`;
        if (visit.acupuncture?.length > 0) prompt += `  * Acupuncture: ${visit.acupuncture.join(', ')}\n`;
        if (visit.acupunctureOther) prompt += `  * Acupuncture Notes: ${visit.acupunctureOther}\n`;
        if (visit.physiotherapy?.length > 0) prompt += `  * Physiotherapy: ${visit.physiotherapy.join(', ')}\n`;
        if (visit.rehabilitationExercises?.length > 0) prompt += `  * Rehabilitation Exercises: ${visit.rehabilitationExercises.join(', ')}\n`;
        prompt += `- Treatment Schedule:\n`;
        if (visit.durationFrequency) {
          prompt += `  * Frequency: ${visit.durationFrequency.timesPerWeek || 0} times per week\n`;
          prompt += `  * Duration: ${visit.durationFrequency.reEvalInWeeks || 0} weeks\n`;
          prompt += `  * Re-evaluation: Every ${visit.durationFrequency.reEvalInWeeks || 0} weeks\n`;
        }
        prompt += `- Diagnostic Studies:\n`;
        if (visit.referrals?.length > 0) prompt += `  * Referrals: ${visit.referrals.join(', ')}\n`;
        if (visit.imaging) {
          const imagingTypes = [];
          if (visit.imaging.xray?.length > 0) imagingTypes.push(`X-ray: ${visit.imaging.xray.join(', ')}`);
          if (visit.imaging.mri?.length > 0) imagingTypes.push(`MRI: ${visit.imaging.mri.join(', ')}`);
          if (visit.imaging.ct?.length > 0) imagingTypes.push(`CT: ${visit.imaging.ct.join(', ')}`);
          if (imagingTypes.length > 0) prompt += `  * Imaging: ${imagingTypes.join('; ')}\n`;
        }
        if (visit.diagnosticUltrasound) prompt += `  * Diagnostic Ultrasound: ${visit.diagnosticUltrasound}\n`;
        if (visit.nerveStudy?.length > 0) prompt += `  * Nerve Studies: ${visit.nerveStudy.join(', ')}\n`;
        prompt += `- Activity Restrictions:\n`;
        if (visit.restrictions) {
          prompt += `  * Avoid Activity: ${visit.restrictions.avoidActivityWeeks || 0} weeks\n`;
          prompt += `  * Lifting Limit: ${visit.restrictions.liftingLimitLbs || 0} lbs\n`;
          if (visit.restrictions.avoidProlongedSitting) prompt += `  * Avoid Prolonged Sitting: Yes\n`;
        }
        if (visit.disabilityDuration) prompt += `  * Disability Duration: ${visit.disabilityDuration}\n`;
        if (visit.otherNotes) prompt += `- Additional Treatment Notes: ${visit.otherNotes}\n`;
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
  }

  prompt += `\n\nGENERATE MEDICAL NARRATIVE AS JSON:

Based on the patient data above, create a comprehensive medical narrative. Each content item should be a detailed paragraph of 4-5 sentences with comprehensive medical information. DO NOT include patient demographics or personal information. Return ONLY valid JSON in this exact format:

{
  "title": "",
  "sections": [
    {
      "heading": "CHIEF COMPLAINT",
      "icon": "🩺",
      "content": [
        "The patient presents with [detailed description of primary complaint from patient data]. The onset of symptoms occurred on [specific date] under the following circumstances: [detailed mechanism and context]. The patient describes the pain/discomfort as [quality, severity, location] which significantly impacts their daily functioning. Current symptom severity is rated as [pain level] on a 0-10 scale, with symptoms being [constant/intermittent] and [progressive/stable/improving]. The chief complaint has resulted in [specific functional limitations] affecting the patient's ability to perform activities of daily living, work responsibilities, and recreational activities."
      ]
    },
    {
      "heading": "HISTORY OF PRESENT ILLNESS",
      "icon": "📋", 
      "content": [
        "The mechanism of injury involved [detailed description of accident/incident from patient data] which occurred on [specific date]. Following the initial injury, the patient experienced [immediate symptoms and their progression]. Over the course of [time period], symptoms have [evolved/worsened/improved] with the patient noting [specific changes in pain patterns, functional capacity, and symptom distribution]. Previous treatment attempts have included [list any prior treatments, medications, or interventions] with [outcomes and patient response]. The patient reports that symptoms are [aggravated by specific activities/positions] and [relieved by certain measures/positions], indicating [clinical significance of these patterns]."
      ]
    },
    {
      "heading": "PAST MEDICAL HISTORY",
      "icon": "📖",
      "content": [
        "The patient's medical history reveals [comprehensive list of allergies or 'no known allergies']. Current medications include [detailed list with dosages and frequencies, or 'no current medications']. Past medical conditions encompass [list of chronic conditions, previous injuries, or 'no significant past medical history']. Surgical history includes [previous surgeries with dates and outcomes, or 'no previous surgeries']. Family medical history is significant for [relevant hereditary conditions or 'non-contributory']. Social history indicates [occupation, lifestyle factors, smoking/alcohol use] which may impact recovery and treatment planning."
      ]
    },
    {
      "heading": "PHYSICAL EXAMINATION",
      "icon": "🔍",
      "content": [
        "Physical examination reveals vital signs within normal limits with [specific measurements when available]. General appearance shows [patient's overall condition, posture, and demeanor]. Neurological examination demonstrates [specific findings including reflexes, sensation, motor function]. Range of motion testing indicates [specific limitations, measurements, and pain responses]. Orthopedic testing reveals [positive/negative findings for specific tests]. Palpation findings include [areas of tenderness, muscle spasm, or other abnormalities]. Strength testing demonstrates [specific deficits or normal findings with grades]. Overall examination findings are consistent with [clinical impression based on objective findings]."
      ]
    },
    {
      "heading": "ASSESSMENT",
      "icon": "⚕️",
      "content": [
        "Based on the comprehensive evaluation, the primary diagnosis is [specific diagnosis from visit data]. The clinical presentation is consistent with [pathophysiology and mechanism of injury]. Differential diagnoses considered include [other possible conditions ruled out]. The severity of the condition is assessed as [mild/moderate/severe] based on [specific clinical criteria]. Contributing factors include [biomechanical, occupational, or lifestyle factors]. The patient's functional capacity is currently limited by [specific restrictions] which impacts their [work, daily activities, quality of life]. Prognosis is [favorable/guarded/poor] based on [specific prognostic indicators and patient factors]."
      ]
    },
    {
      "heading": "TREATMENT PLAN",
      "icon": "💊",
      "content": [
        "The comprehensive treatment plan includes chiropractic adjustments utilizing [specific techniques and regions treated]. Therapeutic modalities will consist of [detailed list of modalities with parameters, frequency, and duration]. Rehabilitation exercises will focus on [specific muscle groups, movement patterns, and functional goals]. Treatment frequency is recommended at [specific schedule] for an initial period of [duration] with re-evaluation planned. Additional interventions may include [diagnostic studies, referrals, or specialized treatments]. Patient education will address [posture, ergonomics, activity modification] to optimize recovery. Home care instructions include [specific exercises, self-care measures, and precautions]. Activity restrictions include [specific limitations and timeline for modification]."
      ]
    },
    {
      "heading": "PROGNOSIS",
      "icon": "📈",
      "content": [
        "The prognosis for recovery is [favorable/guarded/poor] based on [specific patient factors and condition characteristics]. Expected timeline for significant improvement is [specific timeframe] with full recovery anticipated within [timeframe]. Factors that may positively influence recovery include [patient compliance, age, overall health]. Potential complications or factors that may delay recovery include [specific risk factors]. Functional goals include [return to work, activities of daily living, recreational activities] with expected timeline of [specific milestones]. Long-term maintenance care may be necessary to [prevent recurrence, maintain improvements]. Success will be measured by [specific objective and subjective outcome measures]. Patient education regarding [lifestyle modifications, ergonomics] will be crucial for long-term success."
      ]
    },
    {
      "heading": "RECOMMENDATIONS",
      "icon": "✅",
      "content": [
        "Follow-up appointments are recommended [specific frequency and duration] to monitor progress and adjust treatment as needed. Home care recommendations include [detailed exercise program, self-care measures, and activity modifications]. The patient should avoid [specific activities, positions, or movements] for [timeframe] to prevent exacerbation. Return precautions include [warning signs that would necessitate immediate medical attention]. Work modifications may include [ergonomic adjustments, lifting restrictions, or schedule modifications]. Long-term recommendations encompass [ongoing exercise, lifestyle modifications, and preventive measures]. The patient should contact the clinic if [specific symptoms or concerns arise]. Coordination with other healthcare providers may be necessary for [specific aspects of care or if complications arise]."
      ]
    }
  ],
  "summary": "This comprehensive medical narrative documents the patient's condition, examination findings, and treatment plan. The structured approach ensures thorough documentation suitable for legal, insurance, and clinical purposes while providing clear guidance for ongoing care and expected outcomes.",
  "generatedAt": "${new Date().toISOString()}"
}

CRITICAL INSTRUCTIONS:
- Return ONLY the JSON object above - no other text
- Your response must start with { and end with }
- Each content item must be a detailed paragraph of 4-5 sentences
- Use actual patient data to fill in all bracketed placeholders
- Make each paragraph comprehensive and professionally written
- DO NOT include any "PATIENT INFORMATION" section or demographics
- Focus only on medical findings, not personal information

RESPOND WITH ONLY THE JSON OBJECT NOW:`;

  console.log('Generated prompt length:', prompt.length);
  console.log('Prompt preview (first 500 chars):', prompt.substring(0, 500));

  try {
    const openai = new OpenAI({ apiKey });

    console.log('Attempting to generate comprehensive narrative with OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better performance
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI that MUST return ONLY valid JSON. Your response must start with { and end with }. No explanations, no markdown, no extra text. Use the exact JSON structure shown in the user prompt. Each content array item should be a detailed medical paragraph of 4-5 sentences. Do NOT include patient demographics. Focus on clinical findings, assessments, and treatments using the provided patient data.'
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
    console.log('Raw AI response (first 500 chars):', generatedText.substring(0, 500));
    console.log('Raw AI response (last 500 chars):', generatedText.substring(Math.max(0, generatedText.length - 500)));
    console.log('Full AI response length:', generatedText.length);
    
    // Check if response starts with JSON
    const startsWithJson = generatedText.trim().startsWith('{');
    const endsWithJson = generatedText.trim().endsWith('}');
    console.log('Response starts with {:', startsWithJson);
    console.log('Response ends with }:', endsWithJson);
    
    // Try to parse as JSON, fall back to plain text if parsing fails
    let narrativeData;
    try {
      // Clean the response - remove any potential markdown formatting
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      narrativeData = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON response');
      console.log('Parsed sections count:', narrativeData.sections?.length || 0);
    } catch (parseError) {
      console.log('Failed to parse JSON:', parseError.message);
      console.log('Failed text:', generatedText);
      narrativeData = {
        title: "Medical Narrative Report",
        sections: [{
          heading: "NARRATIVE",
          icon: "📋",
          content: [generatedText]
        }],
        summary: "AI-generated medical narrative",
        generatedAt: new Date().toISOString(),
        isPlainText: true
      };
    }
    
    res.json({ 
      success: true,
      narrative: narrativeData 
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

// POST endpoint to generate full medical report using the provided template
router.post('/generate-full-report', async (req, res) => {
  console.log('AI Full Report Generation Request:', {
    hasPatient: !!req.body.patient,
    hasVisits: !!req.body.visits,
    hasTemplate: !!req.body.template,
    patientKeys: req.body.patient ? Object.keys(req.body.patient) : [],
    visitsCount: req.body.visits ? req.body.visits.length : 0
  });
  
  const { patient, visits, template } = req.body;
  if (!patient) {
    console.error('Missing patient data in request');
    return res.status(400).json({ success: false, error: "Missing patient data" });
  }
  
  if (!template) {
    console.error('Missing template in request');
    return res.status(400).json({ success: false, error: "Missing template" });
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OpenAI API key not found in environment variables');
    return res.status(500).json({ success: false, error: "OpenAI API key not configured" });
  }

  // Build comprehensive patient data for the full report
  let prompt = `PATIENT DATA FOR FULL MEDICAL REPORT:\n\n`;

  // Patient Demographics
  prompt += `PATIENT DEMOGRAPHICS:\n`;
  prompt += `- Name: ${patient.firstName} ${patient.lastName}\n`;
  prompt += `- Date of Birth: ${patient.dateOfBirth}\n`;
  prompt += `- Gender: ${patient.gender}\n`;
  prompt += `- Age: ${calculateAge(patient.dateOfBirth)}\n`;
  prompt += `- Phone: ${patient.phone}\n`;
  prompt += `- Email: ${patient.email}\n`;
  prompt += `- Date of Accident: ${patient.accidentDate || 'N/A'}\n`;
  prompt += `- Type of Accident: ${patient.accidentType || 'N/A'}\n\n`;

  // Attorney Information
  if (patient.attorney) {
    prompt += `ATTORNEY INFORMATION:\n`;
    prompt += `- Attorney Name: ${patient.attorney.name || 'N/A'}\n`;
    prompt += `- Firm: ${patient.attorney.firm || 'N/A'}\n`;
    prompt += `- Phone: ${patient.attorney.phone || 'N/A'}\n`;
    prompt += `- Email: ${patient.attorney.email || 'N/A'}\n`;
    prompt += `- Case Number: ${patient.attorney.caseNumber || 'N/A'}\n`;
    if (patient.attorney.address) {
      prompt += `- Address: ${patient.attorney.address.street || ''}, ${patient.attorney.address.city || ''}, ${patient.attorney.address.state || ''} ${patient.attorney.address.zipCode || ''}\n`;
    }
    prompt += `\n`;
  }

  // Medical History
  prompt += `MEDICAL HISTORY:\n`;
  prompt += `- Allergies: ${patient.medicalHistory?.allergies?.length > 0 ? patient.medicalHistory.allergies.join(', ') : 'None reported'}\n`;
  prompt += `- Current Medications: ${patient.medicalHistory?.medications?.length > 0 ? patient.medicalHistory.medications.join(', ') : 'None reported'}\n`;
  prompt += `- Medical Conditions: ${patient.medicalHistory?.conditions?.length > 0 ? patient.medicalHistory.conditions.join(', ') : 'None reported'}\n`;
  prompt += `- Surgical History: ${patient.medicalHistory?.surgeries?.length > 0 ? patient.medicalHistory.surgeries.join(', ') : 'None reported'}\n`;
  prompt += `- Family History: ${patient.medicalHistory?.familyHistory?.length > 0 ? patient.medicalHistory.familyHistory.join(', ') : 'None reported'}\n\n`;

  // Subjective Intake Data
  if (patient.subjective && patient.subjective.intakes) {
    prompt += `SUBJECTIVE INTAKE DATA:\n`;
    patient.subjective.intakes.forEach((intake, index) => {
      prompt += `Body Part ${index + 1}: ${intake.bodyPart} - ${intake.side}\n`;
      prompt += `- Severity: ${intake.severity}\n`;
      prompt += `- Quality: ${intake.quality?.join(', ') || 'N/A'}\n`;
      prompt += `- Timing: ${intake.timing}\n`;
      prompt += `- Context: ${intake.context}\n`;
      prompt += `- Exacerbated By: ${intake.exacerbatedBy?.join(', ') || 'N/A'}\n`;
      prompt += `- Symptoms: ${intake.symptoms?.join(', ') || 'N/A'}\n`;
      prompt += `- Notes: ${intake.notes || 'N/A'}\n\n`;
    });
  }

  // Visit Data
  if (visits && visits.length > 0) {
    prompt += `VISIT DATA:\n`;
    visits.forEach((visit, index) => {
      prompt += `VISIT ${index + 1} (${visit.visitType?.toUpperCase()}):\n`;
      prompt += `- Date: ${visit.date}\n`;
      prompt += `- Chief Complaint: ${visit.chiefComplaint || 'N/A'}\n`;
      prompt += `- Diagnosis: ${Array.isArray(visit.diagnosis) ? visit.diagnosis.join(', ') : visit.diagnosis || 'N/A'}\n`;
      
      // Vitals
      if (visit.vitals) {
        prompt += `- Vitals: Height ${visit.vitals.heightFeet || 'N/A'}'${visit.vitals.heightInches || 'N/A'}", Weight ${visit.vitals.weight || 'N/A'} lbs, BP ${visit.vitals.bpSystolic || 'N/A'}/${visit.vitals.bpDiastolic || 'N/A'}, Temp ${visit.vitals.temp || 'N/A'}°F, Pulse ${visit.vitals.pulse || 'N/A'}\n`;
      }
      
      // Examination findings
      if (visit.painLocation) {
        prompt += `- Pain Locations: ${Array.isArray(visit.painLocation) ? visit.painLocation.join(', ') : visit.painLocation}\n`;
      }
      if (visit.ortho) {
        prompt += `- Orthopedic Tests: ${JSON.stringify(visit.ortho)}\n`;
      }
      if (visit.arom) {
        prompt += `- Range of Motion: ${JSON.stringify(visit.arom)}\n`;
      }
      if (visit.tenderness) {
        prompt += `- Tenderness: ${JSON.stringify(visit.tenderness)}\n`;
      }
      if (visit.spasm) {
        prompt += `- Spasm: ${JSON.stringify(visit.spasm)}\n`;
      }
      
      // Treatment plans
      if (visit.chiropracticAdjustment) {
        prompt += `- Chiropractic Adjustments: ${Array.isArray(visit.chiropracticAdjustment) ? visit.chiropracticAdjustment.join(', ') : visit.chiropracticAdjustment}\n`;
      }
      if (visit.acupuncture) {
        prompt += `- Acupuncture: ${Array.isArray(visit.acupuncture) ? visit.acupuncture.join(', ') : visit.acupuncture}\n`;
      }
      if (visit.physiotherapy) {
        prompt += `- Physiotherapy: ${Array.isArray(visit.physiotherapy) ? visit.physiotherapy.join(', ') : visit.physiotherapy}\n`;
      }
      if (visit.rehabilitationExercises) {
        prompt += `- Rehabilitation Exercises: ${Array.isArray(visit.rehabilitationExercises) ? visit.rehabilitationExercises.join(', ') : visit.rehabilitationExercises}\n`;
      }
      if (visit.referrals) {
        prompt += `- Referrals: ${Array.isArray(visit.referrals) ? visit.referrals.join(', ') : visit.referrals}\n`;
      }
      if (visit.imaging) {
        prompt += `- Imaging: ${JSON.stringify(visit.imaging)}\n`;
      }
      
      // Follow-up specific data
      if (visit.visitType === 'followup') {
        prompt += `- Areas Status: Improving: ${visit.areasImproving || false}, Exacerbated: ${visit.areasExacerbated || false}, Same: ${visit.areasSame || false}, Resolved: ${visit.areasResolved || false}\n`;
        prompt += `- Activities Causing Pain: ${visit.activitiesCausePain || 'N/A'}\n`;
        prompt += `- Overall Response: ${JSON.stringify(visit.overallResponse || {})}\n`;
      }
      
      // Discharge specific data
      if (visit.visitType === 'discharge') {
        prompt += `- Prognosis: ${visit.prognosis || 'N/A'}\n`;
        prompt += `- ROM Percentage: ${visit.romPercent || 'N/A'}%\n`;
        prompt += `- Future Medical Care: ${Array.isArray(visit.futureMedicalCare) ? visit.futureMedicalCare.join(', ') : visit.futureMedicalCare || 'N/A'}\n`;
        prompt += `- Croft Criteria: ${visit.croftCriteria || 'N/A'}\n`;
      }
      
      prompt += `\n`;
    });
  }

  // Create the structured template with proper formatting markers
  const structuredTemplate = `
***SUBJECTIVE*** 
***Chief Complaint*** 

•	The patient complained of pain in the lumbar spine. 
•	The patient complained of pain in the knee. 
•	The patient complained of pain in the wrist. 
•	The patient complained of experiencing headaches. 
•	The patient complained of experiencing difficulty sleeping. 
 
***History of Present Illness*** 
 
•	Pain. Location - the lumbar spine. Quality – Pain: sharp with radiation to left leg, and estimated intensity level 7/10.   Reports soreness and stiffness.  Severity – with activity. Associated symptoms - Patient's statement of functional capacity indicates pain when: bending, lifting, standing and walking. 
•	Pain. Location – bilateral knees.. Quality - Pain: sharp, and estimated intensity level 5/10 for the right knee and 7/10 for the left knee. Reports soreness and stiffness. Severity – constant. Associated symptoms - Patient's statement of functional capacity indicates pain when: bending, lifting, standing, and walking. 
•	Pain. Location - the left wrist. Quality - Pain: sharp, and estimated intensity level 6/10. Reports soreness and stiffness. Severity – with activity. Associated symptoms - Patient's statement of functional capacity indicates pain when: gripping and grasping. 
 
 
***Past, Family, and Social History*** 
**Social History** 
•	Family status: Mrs. Rodriguez is a 65-year-old, Female. 
•	Substance usage: None reported 

**Family History**
• None Reported 

**Past History**
•	Injuries. Prior Motor vehicle accident 9 years ago, No injuries, non-contributory. 
•	Illnesses. None reported. 
•	Surgeries. None reported. 
•	Medicines. None reported. 
•	Allergies. None reported. 

**Smoking Status**
•	Smoking status: None reported. 

***Accident***
•	Patient was injured during a fall at a retail store. 
***OBJECTIVE*** 
***Examination***

**Neurological**
• Testing, palpation, and inspection of the neurological system, unless otherwise noted, revealed the following: Sensation is normal in all areas tested. Deep tendon reflexes are brisk and symmetrical. Oriented to time, place and person. Coordination and fine motor skills are within normal range. 

**Constitutional**
•	Height. Height 60 inches. 
•	Weight. Weight 210 pounds. 
•	First Reading. BP 154/107 mmHg was taken sitting and using the left arm. 
•	Temperature. Temperature 97.6 degrees. 
•	Regular Pulse. Pulse (regular) 80 beats per minute. 
•	General Appearance. The patient's general appearance is well developed and is well nourished. 

**Musculoskeletal**
•	Gait / Station. Lumbar spine postural position hypolordotic in appearance. The gait was assessed as follows: Antalgic gait. Patient came in wearing a knee brace on left knee. 
•	Muscle Strength Test. Estimate of general muscular strength - (+5/5 - 100% - normal) Left L4 and L5 +4/5, All other lower extremities +5/5.  
•	Orthopedic Tests. Kemp's test for L5 to S1 root compression – positive bilaterally with localized pain in the thoracic spine and the lumbar spine. Phalen's test – positive for pain in the left wrist. Tinel's test – positive for pain in the left wrist. Valgus/Varus stress test – positive bilateral with instability noted on left knee. McMurray test – positive bilateral.  
•	Palpations. Moderate to severe spasm of the the lumbar paravertebral muscles and lower leg muscles. Moderate to severe stiffness of the lumbare spine, and the knee. Moderate stiffness in the wrist. Subluxation of the wrist, the knee, and the lumbar spine. 
•	Range of Motions. Lumbar spine ROM. Active flexion (normal 60 degrees): measured at 55 degrees with pain. Active extension (normal 25 degrees): measured at 15 degrees with pain. Active left lateral bending (normal 25 degrees): measured at 20 degrees with pain. Active right lateral bending (normal 25 degrees): measured at 20 degrees with pain.  Left knee ROM. Active flexion (normal 110 deg) measured at 90 deg with pain. Active extension (normal 0 deg) measured at 0 deg with pain. Right knee ROM.  Active flexion (normal 110 deg) measured at 100 deg with pain. Active extension (normal 0 deg) measured at 0 deg with pain. Left wrist ROM. Active plantar flexion (normal 40 deg) measured at 35 deg with pain. Active flexion (normal 60 deg) measured at 55 deg with pain. Active extension (normal 60 deg) measured at 50 deg with pain. Active ulnar deviation (normal 30 deg) measured at 25 deg with pain. Active radial deviation (normal 20 deg) 
measured at 20 deg with pain. 
•	Lumbar Motion. Causes pain with acceleration, deceleration, gower sign present, deviating lumbopelvic rhythm (not smooth), and flexion lateral movements. 

***Dx Codes***
•	M24.28  	Ligament laxity lumbar spine 
•	M53.2X6 	Ligament instability lumbar region 
•	S60.212A 	Left wrist contusion 
•	M25.532 	Pain in the left wrist 
•	S80.01XA 	Right knee contusion 
•	S80.02XA 	Left knee contusion 
•	M25.561 	Right knee pain 
•	M25.562 	Left knee pain 
•	G89.21  	Acute pain due to trauma 
•	W01.10XA   	Fall from same level slipping, tripping, and stumbling with subsequent striking against unspecified object 
•	M46.06  	Lumbar enthesopathy 
•	M99.06   	Segmental & somatic dysfunction of lower extremity 
•	M99.07   	Segmental & somatic dysfunction of upper extremity 
•	M99.03  	Segmental & somatic dysfunction of lumbar region 
•	M79.1   	Myalgia 
•	G47.9 	 	Loss of sleep 
•	G89.21  	Chronic pain due to trauma 

***ASSESSMENT AND PLAN***
***Treatment Plans/Rationale*** 
•	See diagnosis for assessment. 
•	The patient's overall condition: remains status post injury. 
•	Rationale for exam: Rule out contraindications for manipulation to the lumbar spine, the wrist and the knee. Rule out contraindications for physical modalities and procedures to the the lumbar spine, the wrist, and the knee. 
•	Rationale for treatment and treatment objectives: The short-term goals are to decrease level of acute pain, decrease the inflammation, decrease the swelling, and improve the patient P.R.O.M. The long-term goals are to decrease the likelihood of further joint damage, decrease the level of chronic pain, and educate the patient in techniques to prevent further re-injury, improve overall function of the affected areas, and improve the joint mobilization of the affected areas. 
•	Schedule of care: The patient will be treated with chiropractic specific manipulative and acupuncture procedures to the lumbar spine, the wrist, the knee. The patient will receive physical modalities to the lumbar spine, the wrist, and the knee. The patient will be treated with rehabilitative measures to the lumbar spine: Stretching exercises. 
Schedule of physical modality: Electrical muscle stimulation, Mechanical traction and Therapeutic exercise were applied to: muscles of the posterior neck and the Lumbar spine, the wrist, the knee.  
•	Reevaluation: A re-evaluation will be performed and consist of the following: a reexamination of the positive objective findings and reevaluation will be in approximately 4 weeks. 
•	Return 3 times per week. 
•	Referral. For flexion extension x-ray of lumbar spine, and MRI of left knee. 
•	Restrictions: The patient is restricted from heavy physical activity for two weeks; heavy lifting with a limit of 5 pounds. 


**Narrative Encounter  – Exam – Progress**                                                                                                                                                   Rodriguez, Maria 
 
Wednesday, January 27, 2021 
 	 
***Chief Complaint*** 
•	The patient complained of pain in the lumbar spine. (Improving) 
•	The patient complained of pain in the knee. (worse for left knee, right knee improving) 
•	The patient complained of pain in the wrist.  (Improving) 
•	The patient complained of experiencing headaches. (Improving) 
•	The patient complained of experiencing difficulty sleeping. (Same) 

***Examination***
**Musculoskeletal** 
•	Orthopedic Tests. Kemps test – positive in lumbar spine. Straight leg raise – positive on left side. P to A spring test – positive for pain in the lumbar spine. McMurray's – positive bilateral.  
•	Palpations. Moderate to severe spasm of the paralumbar muscles. 
•	Range of Motions. thoracolumbar spine ROM. Increased ROM noted.  Left knee ROM. Same ROM noted. Right knee ROM. Increased ROM noted 

***ASSESSMENT AND PLAN***
***Treatment***
**Chiropractic and Acupuncture** 
•	Specific adjustive procedures and acupuncture administered to: the lumbar spine, the knee, and wrist. 

**Physical Modalities**
The following modalities were utilized in the treatment of this patient and applied to:  
muscles of the posterior neck and the lumbar spine, wrist, and knees.  
•	Hot and cold packs 
•	Mechanical traction 
•	Myofascial release  
•	Ultrasound 
•	Infrared  
•	Electrical muscle stimulation 
•	Therapeutic exercise  
 
 ***Treatment Plans/Rationale*** 
•	See diagnosis for assessment. 
•	Schedule of care: The patient will be treated with acupuncture and chiropractic specific manipulative procedures to the lumbar spine, wrists, and knee.  
•	The patient will receive physical modalities to the muscles of the posterior neck and the muscles of the lumbar spine, wrists, and knee.  
•	Patient states that therapy is helping to decrease pain. However, she states that prolonged sitting, and bending exacerbates pain in the lumbar spine. Prolonged weight bearing activity and walking exacerbate pain in the knees. 
•	Reevaluation: A re-evaluation will be performed and consist of the following: a reexamination of the positive objective findings and reevaluation will be in approximately 4 weeks. 
•	Return 3 times per week for 4 weeks. 
•	Home care recommendation: Ice and Stretches. 
 
 
 
**Narrative Encounter – Final Exam**                                                                                                                                               Rodriguez, Maria 
 
   Monday, March 08, 2021 
 
***SUBJECTIVE***
***Chief Complaint*** 
 
•	The patient complained of pain in the lumbar spine. (Improving) 
•	The patient complained of pain in the knee. (improving for left knee, right knee improving) 
•	The patient complained of pain in the wrist.  (Resolved) 
•	The patient complained of experiencing headaches. (Resolved) 
•	The patient complained of experiencing difficulty sleeping. (Improving) 
 Harold Iseke, D.C.
***OBJECTIVE***
***Examination***
**Musculoskeletal** 
•	Orthopedic Tests. Kemps test – positive lumbar spine. P to A spring test – positive in lumbar spine. McMurray's – positive in the left knee.  
•	Palpations. Spasm of paralumbar muscles, and the quadratus lumborum. 
•	Range of Motions. Lumbar spine ROM. 80% pre-injury status. Left knee ROM. 85% pre-injury status. 

***ASSESSMENT AND PLAN***
***Treatment Plans/Rationale*** 
•	See diagnosis for assessment. 
•	Prognosis: Guarded. 
•	The patient has reached a plateau in her recovery. She remains symptomatic due to the extensive injuries sustained. Prolonged twisting, and bending exacerbate pain in the lumbar spine. Prolonged bending and walking exacerbates pain in the left knee 
•	Computerized Radiographic Mensuration Analysis (CRMA). I have gone over the results with my patient. The results show lumbar spine instability.  
•	Provided home ligament strengthening program. 
•	Patient will be discharged from our care. 
 
 
 	 
***Frequency of Treatment Guideline Placement*** 
For our patient who experienced an auto collision as their mechanism of injury, we will follow the croft treatment guidelines, as indicated in the Croft Treatment Guidelines, ICA Best Practices and the California Whiplash Guidelines IV. Motor Vehicle Accidents (MVAs) ICA decided to use the long-established Croft Cervical 
Acceleration/Deceleration (CAD) Guidelines for its basic Frequency and Duration Programs of Care for MVA victims. When developing her guidelines, Croft incorporated the stages of tissue repair. The stages of injury repair are defined in Table 14, Chapter 11 of the original guideline document. In MVAs, Croft originated 5 grades of injury during CAD and these Grades have been universally accepted in the literature.  
This patient most closely falls into a Grade 2: As they show: Limitation of range of motion and some ligamentous injury.  This allocates a treatment duration of up to 56 weeks and a treatment total number up to 76 sessions. 
 
 
***AMA Guidelines 5th Edition for Impairment*** 
             **Lumbar** 
Table 15-5 Criteria for Rating Impairment Due to Cervical Spine Injury: (Page 392) 
With disc pathology and ligament instability findings this injury is rated at a Category II yielding an impairment estimate based on physical examination findings and film forensics at  8% whole person impairment 
 
 
 
***Miscellaneous Notes***
**Future Medical Care** 
•	In view of Mrs. Rodriguezs' history of injury and mechanism of injury as well as present complaints and clinical findings, it is my opinion that the patient's symptoms are the result of the motor vehicular accident that occurred on October 03, 2020.  Following a thorough examination, she was placed on a conservative treatment program as mentioned above. In light of her level of initial subjective complaints, her complaints were consistent with her objective findings and this remained consistent with each office visit thereafter. Over the course of treatment, there was a gradual reduction of subjective complaints and improved objective factors. Mrs. Rodriguez states the treatments were helpful. 
 
It is my opinion that the patient may need future medical care on a PRN basis for control of the pain syndrome. Such medical care may include, but is not limited to, the following: Chiropractic manipulative therapy, acupuncture, physiotherapy modalities and analgesics for relief of the pain syndrome. It is estimated that 12-36 visits per year may be necessary at a cost of $100-$120 per visit. 
 
The following requested cost estimates are based upon those published in the 2003 Medical Fees in the United States, using the GAF for Anaheim/Santa Ana, published by PMIC, ISBN 1-57066-264-9. 
 
•	The above report is for assessment of the possible injuries the patient might have incurred and is not to be construed as a complete physical examination for general health purposes. 
 
 
 
                           `;

  prompt += `\n\nTEMPLATE STRUCTURE:\n${structuredTemplate}\n\n`;
  prompt += `Using the patient data provided above, generate a comprehensive medical report that follows the EXACT template structure provided. Replace all placeholder text with actual patient data from the database. Maintain the exact formatting, bullet points, and structure of the template. Use professional medical terminology and ensure all sections are properly populated with relevant information from the patient data.\n\n`;
  prompt += `IMPORTANT FORMATTING RULES:\n`;
  prompt += `- Use ***TEXT*** for Bold and Italic headings (main sections like SUBJECTIVE, OBJECTIVE, ASSESSMENT AND PLAN)\n`;
  prompt += `- Use ***TEXT*** for Bold and Underlined headings (subsections like Chief Complaint, History of Present Illness, etc.)\n`;
  prompt += `- Use **TEXT** for Bold only headings (subsections like Social History, Family History, Past History, etc.)\n`;
  prompt += `- Use • for bullet points\n`;
  prompt += `- Replace "Rodriguez, Maria" with actual patient name: ${patient.firstName} ${patient.lastName}\n`;
  prompt += `- Replace dates with actual visit dates from the database\n`;
  prompt += `- Replace all placeholder medical data with actual patient data\n`;
  prompt += `- Maintain the exact structure and formatting of the template\n\n`;
  prompt += `Return ONLY the completed medical report text - no additional formatting, no JSON, no explanations. The response should be ready to be inserted directly into a PDF document.`;

  console.log('Generated full report prompt length:', prompt.length);
  console.log('Prompt preview (first 500 chars):', prompt.substring(0, 500));

  try {
    const openai = new OpenAI({ apiKey });

    console.log('Attempting to generate full medical report with OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI that generates comprehensive medical reports. You must follow the EXACT template structure provided and replace all placeholder text with actual patient data. Use professional medical terminology and maintain the exact formatting of the template. Follow the formatting rules: ***TEXT*** for Bold and Italic/Underlined headings, **TEXT** for Bold only headings, • for bullet points. Return only the completed medical report text - no additional formatting, no JSON, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Very low temperature for consistent, professional output
      max_tokens: 4000 // Increased for comprehensive reports
    });

    const generatedReport = response.choices[0]?.message?.content || "Unable to generate full report at this time.";
    console.log('Successfully generated full medical report');
    console.log('Report preview (first 500 chars):', generatedReport.substring(0, 500));

    res.json({
      success: true,
      report: generatedReport
    });

  } catch (error) {
    console.error('Error generating full report:', error);
    
    let errorMessage = 'Failed to generate full report';
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

export default router;
