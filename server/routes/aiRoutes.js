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

export default router;
