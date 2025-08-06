import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';

interface Visit {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  visitType: string;
  notes: string;
  __t: string;
  
  // Initial Visit fields
chiefComplaint?: string;
chiropracticAdjustment?: string[];
chiropracticOther?: string;
acupuncture?: string[];
acupunctureOther?: string;
physiotherapy?: string[];
rehabilitationExercises?: string[];
durationFrequency?: {
  timesPerWeek?: number;
  reEvalInWeeks?: number;
};
referrals?: string[];
imaging?: {
  xray?: string[];
  mri?: string[];
  ct?: string[];
};
diagnosticUltrasound?: string;
nerveStudy?: string[];
restrictions?: {
  avoidActivityWeeks?: number;
  liftingLimitLbs?: number;
  avoidProlongedSitting?: boolean;
};
disabilityDuration?: string;
otherNotes?: string;

  // Follow-up Visit fields (comprehensive)
  previousVisit?: string;
  areas?: string;
  areasImproving?: boolean;
  areasExacerbated?: boolean;
  areasSame?: boolean;
  areasResolved?: boolean;
  musclePalpation?: string;
  painRadiating?: string;
  romWnlNoPain?: boolean;
  romWnlWithPain?: boolean;
  romImproved?: boolean;
  romDecreased?: boolean;
  romSame?: boolean;
  orthos?: {
    tests?: string;
    result?: string;
  };
  activitiesCausePain?: string;
  activitiesCausePainOther?: string;
  treatmentPlan?: {
    treatments?: string;
    timesPerWeek?: string;
    chiropractic?: boolean;
    acupuncture?: boolean;
    mechanicalTraction?: boolean;
    myofascialRelease?: boolean;
    ultrasound?: boolean;
    infraredElectricMuscleStimulation?: boolean;
    therapeuticExercise?: boolean;
    neuromuscularReeducation?: boolean;
    other?: string;
    frequency?: {
      timesPerWeek?: {
        '4x'?: boolean;
        '3x'?: boolean;
        '2x'?: boolean;
        '1x'?: boolean;
      };
      duration?: {
        '4 wks'?: boolean;
        '6 wks'?: boolean;
        custom?: string;
      };
      reEval?: {
        '4 wks'?: boolean;
        '6 wks'?: boolean;
        custom?: string;
      };
    };
  };
  overallResponse?: {
    improving?: boolean;
    worse?: boolean;
    same?: boolean;
  };
  diagnosticStudy?: {
    study?: string;
    bodyPart?: string;
    result?: string;
  };
  homeCare?: string[] | {
    coreProgram?: boolean;
    stretches?: boolean;
    icePackHotPack?: boolean;
    ligamentStabilityProgram?: boolean;
    other?: string;
  };
  homeCareSuggestions?: string;

  // Discharge Visit fields (comprehensive)
  treatmentSummary?: string;
  dischargeDiagnosis?: string[];
  medicationsAtDischarge?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  followUpInstructions?: string;
  returnPrecautions?: string[];
  dischargeStatus?: string;
  romPercent?: string;
  prognosis?: string;
  futureMedicalCare?: string[];
  croftCriteria?: string;
  amaDisability?: string;
  referralsNotes?: string;
  
  // Add other missing properties that are used in the component
  assessment?: string;
  progressNotes?: string;
  assessmentUpdate?: string;

  // New fields for Initial Visit
  diagnosis?: string[];
  vitals?: {
    heightFeet?: number;
    heightInches?: number;
    weight?: number;
    temp?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    pulse?: number;
  };
  grip?: {
    right1?: number;
    right2?: number;
    right3?: number;
    left1?: number;
    left2?: number;
    left3?: number;
  };
  appearance?: string[];
  appearanceOther?: string;
  orientation?: {
    timePlacePerson?: string;
    other?: string;
  };
  posture?: string[];
  gait?: string[];
  gaitDevice?: string;
  dtr?: string[];
  dtrOther?: string;
  dermatomes?: {
    [key: string]: {
      left?: { hypo?: boolean; hyper?: boolean };
      right?: { hypo?: boolean; hyper?: boolean };
    };
  };
  muscleStrength?: string[];
  strength?: {
    [key: string]: {
      right?: string;
      left?: string;
    };
  };
  oriented?: boolean;
  coordination?: boolean;
  romberg?: string[];
  rombergNotes?: string;
  pronatorDrift?: string;
  neuroTests?: string[];
  walkTests?: string[];
  painLocation?: string[];
  radiatingTo?: string;
  jointDysfunction?: string[];
  jointOther?: string;
  arom?: {
    [key: string]: {
      exam?: string;
      pain?: boolean;
      left?: boolean;
      right?: boolean;
      bilateral?: boolean;
    };
  };
  ortho?: {
    [key: string]: {
      left?: boolean;
      right?: boolean;
      bilateral?: boolean;
      ligLaxity?: string;
    };
  };
  tenderness?: {
    [key: string]: string | string[];
  };
  spasm?: {
    [key: string]: string | string[];
  };
  lumbarTouchingToesMovement?: {
    pain?: boolean;
    painTS?: boolean;
    painLS?: boolean;
    acceleration?: boolean;
    accelerationTSPain?: boolean;
    accelerationLSPain?: boolean;
    deceleration?: boolean;
    decelerationTSPain?: boolean;
    decelerationLSPain?: boolean;
    gowersSign?: boolean;
    gowersSignTS?: boolean;
    gowersSignLS?: boolean;
    deviatingLumbopelvicRhythm?: boolean;
    deviatingFlexionRotation?: boolean;
    deviatingExtensionRotation?: boolean;
  };
  cervicalAROMCheckmarks?: {
    pain?: boolean;
    poorCoordination?: boolean;
    abnormalJointPlay?: boolean;
    motionNotSmooth?: boolean;
    hypomobilityThoracic?: boolean;
    fatigueHoldingHead?: boolean;
  };

  // Fetched data from modals (for follow-up visits)
  fetchedData?: {
    initialVisitData?: any;
    musclePalpationData?: {
      muscleStrength?: any;
      strength?: any;
      tenderness?: any;
      spasm?: any;
    };
    orthoTestsData?: {
      [region: string]: {
        [testName: string]: {
          left: string;
          right: string;
          ligLaxity: string;
        };
      };
    };
    aromData?: {
      [region: string]: {
        [movementName: string]: {
          left: string;
          right: string;
          ligLaxity: string;
        };
      };
    };
    activitiesPainData?: {
      chiropracticAdjustment: string[];
      chiropracticOther: string;
      acupuncture: string[];
      acupunctureOther: string;
      physiotherapy: string[];
      rehabilitationExercises: string[];
      durationFrequency: {
        timesPerWeek: string;
        reEvalInWeeks: string;
      };
      diagnosticUltrasound: string;
      disabilityDuration: string;
    };
    treatmentListData?: {
      chiropracticAdjustment: string[];
      chiropracticOther: string;
      acupuncture: string[];
      acupunctureOther: string;
      physiotherapy: string[];
      rehabilitationExercises: string[];
      durationFrequency: {
        timesPerWeek: string;
        reEvalInWeeks: string;
      };
      referrals: string[];
      imaging: {
        xray: string[];
        mri: string[];
        ct: string[];
      };
      diagnosticUltrasound: string;
      nerveStudy: string[];
      restrictions: {
        avoidActivityWeeks: string;
        liftingLimitLbs: string;
        avoidProlongedSitting: boolean;
      };
      disabilityDuration: string;
      otherNotes: string;
    };
    imagingData?: {
      physiotherapy: string[];
      rehabilitationExercises: string[];
      durationFrequency: {
        timesPerWeek: string;
        reEvalInWeeks: string;
      };
      referrals: string[];
      imaging: {
        xray: string[];
        mri: string[];
        ct: string[];
      };
    };
  };
}

const VisitDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVisit = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://emr-h.onrender.com/api/patients/visits/${id}`);
        setVisit(response.data);
      } catch (error) {
        console.error('Error fetching visit:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVisit();
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Visit_${visit?.visitType}_${new Date(visit?.date || '').toLocaleDateString()}`,
  });

  const generatePDF = () => {
    if (!visit) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${visit.visitType.charAt(0).toUpperCase() + visit.visitType.slice(1)} Visit`, 105, 15, { align: 'center' });
    
    // Add patient name
    doc.setFontSize(16);
    doc.text(`${visit.patient.firstName} ${visit.patient.lastName}`, 105, 25, { align: 'center' });
    
    // Add visit info
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(visit.date).toLocaleDateString()}`, 20, 40);
    doc.text(`Provider: Dr. ${visit.doctor.firstName} ${visit.doctor.lastName}`, 20, 50);
    
    // Add visit details based on type
    if (visit.__t === 'InitialVisit' && visit.chiefComplaint) {
      doc.text('Chief Complaint:', 20, 65);
      doc.text(visit.chiefComplaint, 30, 75);
      
      if (visit.assessment) {
        doc.text('Assessment:', 20, 90);
        doc.text(visit.assessment, 30, 100);
      }
    } else if (visit.__t === 'FollowupVisit' && visit.progressNotes) {
      doc.text('Progress Notes:', 20, 65);
      doc.text(visit.progressNotes, 30, 75);
      
      if (visit.assessmentUpdate) {
        doc.text('Assessment Update:', 20, 90);
        doc.text(visit.assessmentUpdate, 30, 100);
      }
    } else if (visit.__t === 'DischargeVisit' && visit.treatmentSummary) {
      doc.text('Treatment Summary:', 20, 65);
      doc.text(visit.treatmentSummary, 30, 75);
      
      if (visit.followUpInstructions) {
        doc.text('Follow-up Instructions:', 20, 90);
        doc.text(visit.followUpInstructions, 30, 100);
      }
    }
    
    // Save the PDF
    doc.save(`Visit_${visit.visitType}_${new Date(visit.date).toLocaleDateString()}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">Visit not found</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => navigate(`/patients/${visit.patient._id}`)}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {visit.visitType === 'initial' ? 'Initial Visit' : 
               visit.visitType === 'followup' ? 'Follow-up Visit' : 
               'Discharge Visit'}
            </h1>
            <p className="text-gray-600">
              {visit.patient.firstName} {visit.patient.lastName} • {new Date(visit.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white shadow-md rounded-lg p-6">
        {/* Visit Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Patient</p>
              <p className="font-medium">
                {visit.patient.firstName} {visit.patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="font-medium">
                Dr. {visit.doctor.firstName} {visit.doctor.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(visit.date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

       {/* Initial Visit Content */}
      {visit.visitType === 'initial' && (
  <div className="space-y-6">

    {/* Chief Complaint */}
    {visit.chiefComplaint && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chief Complaint</h3>
        <p className="text-gray-800">{visit.chiefComplaint}</p>
      </div>
    )}

    {/* Diagnosis */}
    {visit.diagnosis?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnosis</h3>
        <ul className="list-disc list-inside text-gray-800">
          {visit.diagnosis.map((diagnosis, index) => (
            <li key={index}>{diagnosis}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Vitals */}
    {visit.vitals && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {visit.vitals.heightFeet && visit.vitals.heightInches && (
            <div>
              <span className="font-medium">Height:</span> {visit.vitals.heightFeet}' {visit.vitals.heightInches}"
            </div>
          )}
          {visit.vitals.weight && (
            <div>
              <span className="font-medium">Weight:</span> {visit.vitals.weight} lbs
            </div>
          )}
          {visit.vitals.temp && (
            <div>
              <span className="font-medium">Temperature:</span> {visit.vitals.temp}°F
            </div>
          )}
          {visit.vitals.bpSystolic && visit.vitals.bpDiastolic && (
            <div>
              <span className="font-medium">Blood Pressure:</span> {visit.vitals.bpSystolic}/{visit.vitals.bpDiastolic}
            </div>
          )}
          {visit.vitals.pulse && (
            <div>
              <span className="font-medium">Pulse:</span> {visit.vitals.pulse}
            </div>
          )}
        </div>
      </div>
    )}

    {/* Grip Strength */}
    {visit.grip && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Grip Strength (kg)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Right Hand:</span> {visit.grip.right1}/{visit.grip.right2}/{visit.grip.right3}
          </div>
          <div>
            <span className="font-medium">Left Hand:</span> {visit.grip.left1}/{visit.grip.left2}/{visit.grip.left3}
          </div>
        </div>
      </div>
    )}

    {/* Appearance */}
    {visit.appearance?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Appearance</h3>
        <p className="text-gray-800">
          {visit.appearance.join(', ')}
          {visit.appearanceOther && ` - ${visit.appearanceOther}`}
        </p>
      </div>
    )}

    {/* Orientation */}
    {visit.orientation && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Orientation</h3>
        <p className="text-gray-800">
          {visit.orientation.timePlacePerson && 'Time, Place, Person'}
          {visit.orientation.other && ` - ${visit.orientation.other}`}
        </p>
      </div>
    )}

    {/* Posture */}
    {visit.posture?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Posture</h3>
        <p className="text-gray-800">{visit.posture.join(', ')}</p>
      </div>
    )}

    {/* Gait */}
    {visit.gait?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Gait</h3>
        <p className="text-gray-800">
          {visit.gait.join(', ')}
          {visit.gaitDevice && ` - Requires: ${visit.gaitDevice}`}
        </p>
      </div>
    )}

    {/* DTR */}
    {visit.dtr?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Deep Tendon Reflexes (DTR)</h3>
        <p className="text-gray-800">
          {visit.dtr.join(', ')}
          {visit.dtrOther && ` - ${visit.dtrOther}`}
        </p>
      </div>
    )}

    {/* Dermatomes */}
    {visit.dermatomes && Object.keys(visit.dermatomes).length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dermatomes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {Object.entries(visit.dermatomes).map(([root, data]: [string, any]) => (
            <div key={root} className="border p-2 rounded">
              <div className="font-medium">{root}</div>
              <div className="text-xs">
                {data.left?.hypo && 'L: Hypo '}
                {data.left?.hyper && 'L: Hyper '}
                {data.right?.hypo && 'R: Hypo '}
                {data.right?.hyper && 'R: Hyper'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Muscle Strength */}
    {visit.muscleStrength?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Muscle Strength</h3>
        <p className="text-gray-800">{visit.muscleStrength.join(', ')}</p>
      </div>
    )}

    {/* Strength Testing */}
    {visit.strength && Object.keys(visit.strength).length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Strength Testing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(visit.strength).map(([muscle, data]: [string, any]) => (
            <div key={muscle} className="border p-2 rounded">
              <div className="font-medium">{muscle}</div>
              <div>R: {data.right || 'N/A'} | L: {data.left || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Neurological */}
    {(visit.oriented !== undefined || visit.coordination !== undefined || visit.romberg?.length > 0 || visit.neuroTests?.length > 0 || visit.walkTests?.length > 0) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Neurological</h3>
        <div className="space-y-2 text-sm">
          {visit.oriented !== undefined && (
            <p><span className="font-medium">Oriented:</span> {visit.oriented ? 'Yes' : 'No'}</p>
          )}
          {visit.neuroNote && (
            <p><span className="font-medium">Note:</span> {visit.neuroNote}</p>
          )}
          {visit.coordination !== undefined && (
            <p><span className="font-medium">Coordination:</span> {visit.coordination ? 'Negative' : 'Positive'}</p>
          )}
          {visit.romberg?.length > 0 && (
            <p><span className="font-medium">Romberg:</span> {visit.romberg.join(', ')}</p>
          )}
          {visit.rombergNotes && (
            <p><span className="font-medium">Romberg Notes:</span> {visit.rombergNotes}</p>
          )}
          {visit.pronatorDrift && (
            <p><span className="font-medium">Pronator Drift:</span> {visit.pronatorDrift}</p>
          )}
          {visit.neuroTests?.length > 0 && (
            <p><span className="font-medium">Neurological Tests:</span> {visit.neuroTests.join(', ')}</p>
          )}
          {visit.walkTests?.length > 0 && (
            <p><span className="font-medium">Walk Tests:</span> {visit.walkTests.join(', ')}</p>
          )}
          {visit.painLocation?.length > 0 && (
            <p><span className="font-medium">Pain Location:</span> {visit.painLocation.join(', ')}</p>
          )}
          {visit.radiatingTo && (
            <p><span className="font-medium">Radiating To:</span> {visit.radiatingTo}</p>
          )}
        </div>
      </div>
    )}

    {/* Joint Dysfunction */}
    {visit.jointDysfunction?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Intersegmental and Joint Dysfunction</h3>
        <p className="text-gray-800">
          {visit.jointDysfunction.join(', ')}
          {visit.jointOther && ` - ${visit.jointOther}`}
        </p>
      </div>
    )}

    {/* AROM Testing */}
    {visit.arom && Object.keys(visit.arom).length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Active Range of Motion (AROM)</h3>
        <div className="space-y-4">
          {Object.entries(visit.arom).map(([region, movements]: [string, any]) => (
            <div key={region} className="border p-3 rounded">
              <h4 className="font-medium mb-2">{region}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(movements).map(([movement, data]: [string, any]) => (
                  <div key={movement} className="flex justify-between">
                    <span>{movement}:</span>
                    <span>
                      {data.exam && `Exam: ${data.exam} `}
                      {data.pain && '(Pain)'}
                      {data.left && '(L)'}
                      {data.right && '(R)'}
                      {data.bilateral && '(Bilateral)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Orthopedic Testing */}
    {visit.ortho && Object.keys(visit.ortho).length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Orthopedic Testing</h3>
        <div className="space-y-2 text-sm">
          {Object.entries(visit.ortho).map(([test, data]: [string, any]) => (
            <div key={test} className="border p-2 rounded">
              <div className="font-medium">{test}</div>
              <div>
                {data.left && 'Left '}
                {data.right && 'Right '}
                {data.bilateral && 'Bilateral'}
                {data.ligLaxity && ` - Ligament Laxity: ${data.ligLaxity}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Tenderness */}
    {visit.tenderness && Object.keys(visit.tenderness).length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tenderness</h3>
        <div className="space-y-2 text-sm">
          {Object.entries(visit.tenderness).map(([region, areas]: [string, any]) => (
            <div key={region} className="border p-2 rounded">
              <div className="font-medium">{region}</div>
              <div>{Array.isArray(areas) ? areas.join(', ') : areas}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Spasm */}
    {visit.spasm && Object.keys(visit.spasm).length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Spasm</h3>
        <div className="space-y-2 text-sm">
          {Object.entries(visit.spasm).map(([region, areas]: [string, any]) => (
            <div key={region} className="border p-2 rounded">
              <div className="font-medium">{region}</div>
              <div>{Array.isArray(areas) ? areas.join(', ') : areas}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Lumbar Touching Toes Movement */}
    {visit.lumbarTouchingToesMovement && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lumbar - Touching Toes Movement</h3>
        <div className="space-y-1 text-sm">
          {visit.lumbarTouchingToesMovement.pain && <p>• Pain {visit.lumbarTouchingToesMovement.painTS && '(T/S)'} {visit.lumbarTouchingToesMovement.painLS && '(L/S)'}</p>}
          {visit.lumbarTouchingToesMovement.acceleration && <p>• Acceleration {visit.lumbarTouchingToesMovement.accelerationTSPain && '(T/S Pain)'} {visit.lumbarTouchingToesMovement.accelerationLSPain && '(L/S Pain)'}</p>}
          {visit.lumbarTouchingToesMovement.deceleration && <p>• Deceleration {visit.lumbarTouchingToesMovement.decelerationTSPain && '(T/S Pain)'} {visit.lumbarTouchingToesMovement.decelerationLSPain && '(L/S Pain)'}</p>}
          {visit.lumbarTouchingToesMovement.gowersSign && <p>• Gower's Sign Present {visit.lumbarTouchingToesMovement.gowersSignTS && '(T/S)'} {visit.lumbarTouchingToesMovement.gowersSignLS && '(L/S)'}</p>}
          {visit.lumbarTouchingToesMovement.deviatingLumbopelvicRhythm && <p>• Deviating Lumbopelvic Rhythm (not smooth)</p>}
          {visit.lumbarTouchingToesMovement.deviatingFlexionRotation && <p>• Deviating Flexion-Lateral/Rotation Movements</p>}
          {visit.lumbarTouchingToesMovement.deviatingExtensionRotation && <p>• Deviating Extension-Lateral/Rotation Movements</p>}
        </div>
      </div>
    )}

    {/* Cervical AROM Checkmarks */}
    {visit.cervicalAROMCheckmarks && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cervical - AROM</h3>
        <div className="space-y-1 text-sm">
          {visit.cervicalAROMCheckmarks.pain && <p>• Pain</p>}
          {visit.cervicalAROMCheckmarks.poorCoordination && <p>• Poor Coordination/Neuromuscular Control</p>}
          {visit.cervicalAROMCheckmarks.abnormalJointPlay && <p>• Abnormal Joint Play, Clunking</p>}
          {visit.cervicalAROMCheckmarks.motionNotSmooth && <p>• Motion that is Not Smooth throughout AROM</p>}
          {visit.cervicalAROMCheckmarks.hypomobilityThoracic && <p>• Hypomobility of Upper Thoracic Spine</p>}
          {visit.cervicalAROMCheckmarks.fatigueHoldingHead && <p>• Fatigue and Inability to Hold Head Up</p>}
        </div>
      </div>
    )}

    {/* Treatment Plan */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Treatment Plan</h3>
      
      {/* Chiropractic Adjustment */}
      {visit.chiropracticAdjustment?.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Chiropractic Adjustment</h4>
          <p className="text-gray-700">
            Chiropractic adjustments were administered to the following areas: {visit.chiropracticAdjustment.join(', ')}.
          </p>
          {visit.chiropracticOther && <p className="text-gray-700">Additional notes: {visit.chiropracticOther}</p>}
        </div>
      )}

      {/* Acupuncture */}
      {visit.acupuncture?.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Acupuncture (Cupping)</h4>
          <p className="text-gray-700">
            Acupuncture was applied to the following regions: {visit.acupuncture.join(', ')}.
          </p>
          {visit.acupunctureOther && <p className="text-gray-700">Additional notes: {visit.acupunctureOther}</p>}
        </div>
      )}

      {/* Physiotherapy */}
      {visit.physiotherapy?.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Physiotherapy</h4>
          <p className="text-gray-700">
            The patient received physiotherapy including: {visit.physiotherapy.join(', ')}.
          </p>
        </div>
      )}

      {/* Rehabilitation Exercises */}
      {visit.rehabilitationExercises?.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Rehabilitation Exercises</h4>
          <p className="text-gray-700">
            Prescribed rehabilitation exercises include: {visit.rehabilitationExercises.join(', ')}.
          </p>
        </div>
      )}

      {/* Duration & Re-evaluation */}
      {(visit.durationFrequency?.timesPerWeek || visit.durationFrequency?.reEvalInWeeks) && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Duration & Re-evaluation</h4>
          <p className="text-gray-700">
          Therapy is scheduled {visit.durationFrequency.timesPerWeek} times per week, with a re-evaluation in {visit.durationFrequency.reEvalInWeeks} week(s).
        </p>
      </div>
    )}

    {/* Referrals */}
    {visit.referrals?.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Referrals</h4>
          <p className="text-gray-700">
            The patient was referred for: {visit.referrals.join(', ')}.
        </p>
      </div>
    )}

    {/* Imaging */}
    {visit.imaging && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Imaging</h4>
        {Object.entries(visit.imaging).map(([modality, parts]) => {
            if (Array.isArray(parts) && parts.length > 0) {
          return (
                <p key={modality} className="text-gray-700">
                  {modality.charAt(0).toUpperCase() + modality.slice(1)} was performed for: {parts.join(', ')}.
            </p>
          );
            }
            return null;
        })}
      </div>
    )}

    {/* Diagnostic Ultrasound */}
    {visit.diagnosticUltrasound && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Diagnostic Ultrasound</h4>
          <p className="text-gray-700">{visit.diagnosticUltrasound}</p>
      </div>
    )}

    {/* Nerve Study */}
    {visit.nerveStudy?.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Nerve Study</h4>
          <p className="text-gray-700">
            Nerve studies revealed: {visit.nerveStudy.join(', ')}.
        </p>
      </div>
    )}

    {/* Restrictions */}
    {visit.restrictions && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Restrictions</h4>
          <p className="text-gray-700">
          The patient is restricted from physical activity for {visit.restrictions.avoidActivityWeeks} week(s) with a lifting limit of {visit.restrictions.liftingLimitLbs} lbs.
          {visit.restrictions.avoidProlongedSitting && ' Prolonged sitting and standing should be avoided.'}
        </p>
      </div>
    )}

    {/* Disability Duration */}
    {visit.disabilityDuration && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Disability Duration</h4>
          <p className="text-gray-700">{visit.disabilityDuration}</p>
      </div>
    )}

    {/* Other Notes */}
    {visit.otherNotes && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">Other Notes</h4>
          <p className="text-gray-700 whitespace-pre-line">{visit.otherNotes}</p>
      </div>
    )}
    </div>

  </div>
)}


       
        {/* Follow-up Visit Details */}
       {visit.visitType === 'followup' && (
  <div className="space-y-6">

    {/* Areas Assessment */}
    {(visit.areasImproving || visit.areasExacerbated || visit.areasSame || visit.areasResolved) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Areas Assessment</h3>
        <div className="space-y-2 text-sm">
          {visit.areasImproving && <p className="text-gray-700">• Some areas are improving</p>}
          {visit.areasExacerbated && <p className="text-gray-700">• Certain areas are exacerbated</p>}
          {visit.areasSame && <p className="text-gray-700">• Some areas remain the same</p>}
          {visit.areasResolved && <p className="text-gray-700">• Some areas have been resolved</p>}
        </div>
      </div>
    )}

    {/* Examination */}
    {(visit.musclePalpation || visit.painRadiating || visit.romWnlNoPain || visit.romWnlWithPain || visit.romImproved || visit.romDecreased || visit.romSame || (visit.orthos?.tests || visit.orthos?.result)) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Examination</h3>
        <div className="space-y-2 text-sm">
        {visit.musclePalpation && (
          <p className="text-gray-700">
              <span className="font-medium">Muscle Palpation:</span> {visit.musclePalpation}
          </p>
        )}

        {visit.painRadiating && (
          <p className="text-gray-700">
              <span className="font-medium">Pain Radiating:</span> {visit.painRadiating}
          </p>
        )}

        {(visit.romWnlNoPain || visit.romWnlWithPain || visit.romImproved || visit.romDecreased || visit.romSame) && (
          <p className="text-gray-700">
              <span className="font-medium">Range of Motion:</span>{" "}
            {[
              visit.romWnlNoPain && "WNL (No Pain)",
              visit.romWnlWithPain && "WNL (With Pain)",
              visit.romImproved && "Improved",
              visit.romDecreased && "Decreased",
              visit.romSame && "Same"
              ].filter(Boolean).join(", ")}
          </p>
        )}

        {(visit.orthos?.tests || visit.orthos?.result) && (
          <p className="text-gray-700">
              <span className="font-medium">Orthopedic Tests:</span> {visit.orthos?.tests || 'N/A'}, Result: {visit.orthos?.result || 'N/A'}
          </p>
        )}
        </div>
      </div>
    )}

    {/* Activities that still cause pain */}
    {(visit.activitiesCausePain || visit.activitiesCausePainOther) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Activities that Still Cause Pain</h3>
        <p className="text-gray-700">
          {visit.activitiesCausePain}
          {visit.activitiesCausePainOther && ` Other: ${visit.activitiesCausePainOther}`}
        </p>
      </div>
    )}

    {/* Treatment Plan */}
    {visit.treatmentPlan && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Treatment Plan</h3>
        <div className="space-y-3">
          {visit.treatmentPlan.treatments && (
            <p className="text-gray-700">
              <span className="font-medium">Treatments:</span> {visit.treatmentPlan.treatments}
            </p>
          )}

          {visit.treatmentPlan.timesPerWeek && (
          <p className="text-gray-700">
              <span className="font-medium">Frequency:</span> {visit.treatmentPlan.timesPerWeek} times per week
            </p>
          )}

          {/* Treatment Modalities */}
          {(visit.treatmentPlan.chiropractic || visit.treatmentPlan.acupuncture || visit.treatmentPlan.mechanicalTraction || visit.treatmentPlan.myofascialRelease || visit.treatmentPlan.ultrasound || visit.treatmentPlan.infraredElectricMuscleStimulation || visit.treatmentPlan.therapeuticExercise || visit.treatmentPlan.neuromuscularReeducation) && (
            <div>
              <p className="font-medium text-gray-700">Treatment Modalities:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                {visit.treatmentPlan.chiropractic && <li>Chiropractic</li>}
                {visit.treatmentPlan.acupuncture && <li>Acupuncture</li>}
                {visit.treatmentPlan.mechanicalTraction && <li>Mechanical Traction</li>}
                {visit.treatmentPlan.myofascialRelease && <li>Myofascial Release</li>}
                {visit.treatmentPlan.ultrasound && <li>Ultrasound</li>}
                {visit.treatmentPlan.infraredElectricMuscleStimulation && <li>Infrared/Electric Muscle Stimulation</li>}
                {visit.treatmentPlan.therapeuticExercise && <li>Therapeutic Exercise</li>}
                {visit.treatmentPlan.neuromuscularReeducation && <li>Neuromuscular Reeducation</li>}
              </ul>
              {visit.treatmentPlan.other && (
                <p className="text-gray-600 text-sm mt-1">Other: {visit.treatmentPlan.other}</p>
              )}
            </div>
          )}

          {/* Frequency Details */}
          {visit.treatmentPlan.frequency && (
            <div>
              <p className="font-medium text-gray-700">Frequency Details:</p>
              <div className="text-sm text-gray-600 ml-4 space-y-1">
                {visit.treatmentPlan.frequency.timesPerWeek && (
                  <p>Times per week: {Object.keys(visit.treatmentPlan.frequency.timesPerWeek).filter(key => visit.treatmentPlan.frequency?.timesPerWeek?.[key as keyof typeof visit.treatmentPlan.frequency.timesPerWeek]).join(', ')}</p>
                )}
                {visit.treatmentPlan.frequency.duration && (
                  <p>Duration: {Object.keys(visit.treatmentPlan.frequency.duration).filter(key => visit.treatmentPlan.frequency?.duration?.[key as keyof typeof visit.treatmentPlan.frequency.duration]).join(', ')}</p>
                )}
                {visit.treatmentPlan.frequency.reEval && (
                  <p>Re-evaluation: {Object.keys(visit.treatmentPlan.frequency.reEval).filter(key => visit.treatmentPlan.frequency?.reEval?.[key as keyof typeof visit.treatmentPlan.frequency.reEval]).join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
        )}

        {/* Overall Response */}
        {(visit.overallResponse?.improving || visit.overallResponse?.worse || visit.overallResponse?.same) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Overall Response to Care</h3>
          <p className="text-gray-700">
            {[
              visit.overallResponse?.improving && "Patient is improving",
              visit.overallResponse?.worse && "Condition is worsening",
              visit.overallResponse?.same && "Condition remains the same"
          ].filter(Boolean).join(", ")}
          </p>
      </div>
        )}

        {/* Referrals */}
        {visit.referrals && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Referrals</h3>
        <p className="text-gray-700">{visit.referrals}</p>
      </div>
        )}

        {/* Diagnostic Study */}
        {(visit.diagnosticStudy?.study || visit.diagnosticStudy?.bodyPart || visit.diagnosticStudy?.result) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnostic Study</h3>
        <div className="space-y-1 text-sm">
          {visit.diagnosticStudy?.study && (
          <p className="text-gray-700">
              <span className="font-medium">Study:</span> {visit.diagnosticStudy.study}
            </p>
          )}
          {visit.diagnosticStudy?.bodyPart && (
            <p className="text-gray-700">
              <span className="font-medium">Body Part:</span> {visit.diagnosticStudy.bodyPart}
            </p>
          )}
          {visit.diagnosticStudy?.result && (
            <p className="text-gray-700">
              <span className="font-medium">Result:</span> {visit.diagnosticStudy.result}
            </p>
          )}
        </div>
      </div>
        )}

        {/* Home Care */}
        {visit.homeCare && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Home Care</h3>
        {Array.isArray(visit.homeCare) ? (
          <p className="text-gray-700">{visit.homeCare.join(', ')}</p>
        ) : (
          <div className="space-y-2">
            {visit.homeCare.coreProgram && <p className="text-gray-700">• Core Program</p>}
            {visit.homeCare.stretches && <p className="text-gray-700">• Stretches</p>}
            {visit.homeCare.icePackHotPack && <p className="text-gray-700">• Ice Pack/Hot Pack</p>}
            {visit.homeCare.ligamentStabilityProgram && <p className="text-gray-700">• Ligament Stability Program</p>}
            {visit.homeCare.other && <p className="text-gray-700">• Other: {visit.homeCare.other}</p>}
          </div>
        )}
      </div>
    )}

    {/* Home Care Suggestions */}
    {visit.homeCareSuggestions && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Home Care Suggestions</h3>
        <p className="text-gray-700 whitespace-pre-line">{visit.homeCareSuggestions}</p>
      </div>
    )}

    {/* Fetched Data from Modals */}
    {visit.fetchedData && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Examination Data</h3>
        
        {/* Muscle Palpation Data */}
        {visit.fetchedData.musclePalpationData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Muscle Palpation</h4>
            <div className="space-y-2 text-sm">
              {visit.fetchedData.musclePalpationData.muscleStrength && (
          <p className="text-gray-700">
                  <span className="font-medium">Muscle Strength:</span> {visit.fetchedData.musclePalpationData.muscleStrength}
                </p>
              )}
              {visit.fetchedData.musclePalpationData.strength && (
                <p className="text-gray-700">
                  <span className="font-medium">Strength Testing:</span> {JSON.stringify(visit.fetchedData.musclePalpationData.strength)}
                </p>
              )}
              {visit.fetchedData.musclePalpationData.tenderness && (
                <p className="text-gray-700">
                  <span className="font-medium">Tenderness:</span> {JSON.stringify(visit.fetchedData.musclePalpationData.tenderness)}
                </p>
              )}
              {visit.fetchedData.musclePalpationData.spasm && (
                <p className="text-gray-700">
                  <span className="font-medium">Spasm:</span> {JSON.stringify(visit.fetchedData.musclePalpationData.spasm)}
          </p>
        )}
            </div>
      </div>
    )}

        {/* Orthopedic Tests Data */}
        {visit.fetchedData.orthoTestsData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Orthopedic Tests</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(visit.fetchedData.orthoTestsData).map(([region, tests]) => (
                <div key={region} className="border p-2 rounded">
                  <p className="font-medium">{region}</p>
                  {Object.entries(tests).map(([testName, data]) => (
                    <p key={testName} className="text-gray-600 ml-2">
                      {testName}: L-{data.left}, R-{data.right}
                      {data.ligLaxity && `, Ligament Laxity: ${data.ligLaxity}`}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AROM Data */}
        {visit.fetchedData.aromData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Active Range of Motion</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(visit.fetchedData.aromData).map(([region, movements]) => (
                <div key={region} className="border p-2 rounded">
                  <p className="font-medium">{region}</p>
                  {Object.entries(movements).map(([movementName, data]) => (
                    <p key={movementName} className="text-gray-600 ml-2">
                      {movementName}: L-{data.left}, R-{data.right}
                      {data.ligLaxity && `, Ligament Laxity: ${data.ligLaxity}`}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities/Pain Data */}
        {visit.fetchedData.activitiesPainData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Activities and Pain Assessment</h4>
            <div className="space-y-2 text-sm">
              {visit.fetchedData.activitiesPainData.chiropracticAdjustment?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Chiropractic Adjustment:</span> {visit.fetchedData.activitiesPainData.chiropracticAdjustment.join(', ')}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.chiropracticOther && (
                <p className="text-gray-700">
                  <span className="font-medium">Chiropractic Other:</span> {visit.fetchedData.activitiesPainData.chiropracticOther}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.acupuncture?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Acupuncture:</span> {visit.fetchedData.activitiesPainData.acupuncture.join(', ')}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.acupunctureOther && (
                <p className="text-gray-700">
                  <span className="font-medium">Acupuncture Other:</span> {visit.fetchedData.activitiesPainData.acupunctureOther}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.physiotherapy?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Physiotherapy:</span> {visit.fetchedData.activitiesPainData.physiotherapy.join(', ')}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.rehabilitationExercises?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Rehabilitation Exercises:</span> {visit.fetchedData.activitiesPainData.rehabilitationExercises.join(', ')}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.durationFrequency && (
                <p className="text-gray-700">
                  <span className="font-medium">Duration & Frequency:</span> {visit.fetchedData.activitiesPainData.durationFrequency.timesPerWeek} times per week, re-evaluation in {visit.fetchedData.activitiesPainData.durationFrequency.reEvalInWeeks} weeks
                </p>
              )}
              {visit.fetchedData.activitiesPainData.diagnosticUltrasound && (
                <p className="text-gray-700">
                  <span className="font-medium">Diagnostic Ultrasound:</span> {visit.fetchedData.activitiesPainData.diagnosticUltrasound}
                </p>
              )}
              {visit.fetchedData.activitiesPainData.disabilityDuration && (
                <p className="text-gray-700">
                  <span className="font-medium">Disability Duration:</span> {visit.fetchedData.activitiesPainData.disabilityDuration}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Treatment List Data */}
        {visit.fetchedData.treatmentListData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Treatment List</h4>
            <div className="space-y-2 text-sm">
              {visit.fetchedData.treatmentListData.chiropracticAdjustment?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Chiropractic Adjustment:</span> {visit.fetchedData.treatmentListData.chiropracticAdjustment.join(', ')}
                </p>
              )}
              {visit.fetchedData.treatmentListData.chiropracticOther && (
                <p className="text-gray-700">
                  <span className="font-medium">Chiropractic Other:</span> {visit.fetchedData.treatmentListData.chiropracticOther}
                </p>
              )}
              {visit.fetchedData.treatmentListData.acupuncture?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Acupuncture:</span> {visit.fetchedData.treatmentListData.acupuncture.join(', ')}
                </p>
              )}
              {visit.fetchedData.treatmentListData.acupunctureOther && (
                <p className="text-gray-700">
                  <span className="font-medium">Acupuncture Other:</span> {visit.fetchedData.treatmentListData.acupunctureOther}
                </p>
              )}
              {visit.fetchedData.treatmentListData.physiotherapy?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Physiotherapy:</span> {visit.fetchedData.treatmentListData.physiotherapy.join(', ')}
                </p>
              )}
              {visit.fetchedData.treatmentListData.rehabilitationExercises?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Rehabilitation Exercises:</span> {visit.fetchedData.treatmentListData.rehabilitationExercises.join(', ')}
                </p>
              )}
              {visit.fetchedData.treatmentListData.durationFrequency && (
                <p className="text-gray-700">
                  <span className="font-medium">Duration & Frequency:</span> {visit.fetchedData.treatmentListData.durationFrequency.timesPerWeek} times per week, re-evaluation in {visit.fetchedData.treatmentListData.durationFrequency.reEvalInWeeks} weeks
                </p>
              )}
              {visit.fetchedData.treatmentListData.referrals?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Referrals:</span> {visit.fetchedData.treatmentListData.referrals.join(', ')}
                </p>
              )}
              {visit.fetchedData.treatmentListData.imaging && (
                <div>
                  <p className="font-medium text-gray-700">Imaging:</p>
                  {visit.fetchedData.treatmentListData.imaging.xray?.length > 0 && (
                    <p className="text-gray-600 ml-2">X-ray: {visit.fetchedData.treatmentListData.imaging.xray.join(', ')}</p>
                  )}
                  {visit.fetchedData.treatmentListData.imaging.mri?.length > 0 && (
                    <p className="text-gray-600 ml-2">MRI: {visit.fetchedData.treatmentListData.imaging.mri.join(', ')}</p>
                  )}
                  {visit.fetchedData.treatmentListData.imaging.ct?.length > 0 && (
                    <p className="text-gray-600 ml-2">CT: {visit.fetchedData.treatmentListData.imaging.ct.join(', ')}</p>
                  )}
                </div>
              )}
              {visit.fetchedData.treatmentListData.diagnosticUltrasound && (
                <p className="text-gray-700">
                  <span className="font-medium">Diagnostic Ultrasound:</span> {visit.fetchedData.treatmentListData.diagnosticUltrasound}
                </p>
              )}
              {visit.fetchedData.treatmentListData.nerveStudy?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Nerve Study:</span> {visit.fetchedData.treatmentListData.nerveStudy.join(', ')}
                </p>
              )}
              {visit.fetchedData.treatmentListData.restrictions && (
                <p className="text-gray-700">
                  <span className="font-medium">Restrictions:</span> Avoid activity for {visit.fetchedData.treatmentListData.restrictions.avoidActivityWeeks} weeks, lifting limit {visit.fetchedData.treatmentListData.restrictions.liftingLimitLbs} lbs
                  {visit.fetchedData.treatmentListData.restrictions.avoidProlongedSitting && ', avoid prolonged sitting'}
                </p>
              )}
              {visit.fetchedData.treatmentListData.disabilityDuration && (
                <p className="text-gray-700">
                  <span className="font-medium">Disability Duration:</span> {visit.fetchedData.treatmentListData.disabilityDuration}
                </p>
              )}
              {visit.fetchedData.treatmentListData.otherNotes && (
                <p className="text-gray-700">
                  <span className="font-medium">Other Notes:</span> {visit.fetchedData.treatmentListData.otherNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Imaging Data */}
        {visit.fetchedData.imagingData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Imaging and Specialist Data</h4>
            <div className="space-y-2 text-sm">
              {visit.fetchedData.imagingData.physiotherapy?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Physiotherapy:</span> {visit.fetchedData.imagingData.physiotherapy.join(', ')}
                </p>
              )}
              {visit.fetchedData.imagingData.rehabilitationExercises?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Rehabilitation Exercises:</span> {visit.fetchedData.imagingData.rehabilitationExercises.join(', ')}
                </p>
              )}
              {visit.fetchedData.imagingData.durationFrequency && (
                <p className="text-gray-700">
                  <span className="font-medium">Duration & Frequency:</span> {visit.fetchedData.imagingData.durationFrequency.timesPerWeek} times per week, re-evaluation in {visit.fetchedData.imagingData.durationFrequency.reEvalInWeeks} weeks
                </p>
              )}
              {visit.fetchedData.imagingData.referrals?.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Referrals:</span> {visit.fetchedData.imagingData.referrals.join(', ')}
                </p>
              )}
              {visit.fetchedData.imagingData.imaging && (
                <div>
                  <p className="font-medium text-gray-700">Imaging:</p>
                  {visit.fetchedData.imagingData.imaging.xray?.length > 0 && (
                    <p className="text-gray-600 ml-2">X-ray: {visit.fetchedData.imagingData.imaging.xray.join(', ')}</p>
                  )}
                  {visit.fetchedData.imagingData.imaging.mri?.length > 0 && (
                    <p className="text-gray-600 ml-2">MRI: {visit.fetchedData.imagingData.imaging.mri.join(', ')}</p>
                  )}
                  {visit.fetchedData.imagingData.imaging.ct?.length > 0 && (
                    <p className="text-gray-600 ml-2">CT: {visit.fetchedData.imagingData.imaging.ct.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

  </div>
)}


        {/* Discharge Visit Content */}
      {visit.visitType === 'discharge' && (
  <div className="space-y-6">

    {/* Treatment Summary */}
    {visit.treatmentSummary && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Treatment Summary</h3>
        <p className="text-gray-700 whitespace-pre-line">{visit.treatmentSummary}</p>
      </div>
    )}

    {/* Discharge Diagnosis */}
    {visit.dischargeDiagnosis?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Discharge Diagnosis</h3>
        <ul className="list-disc list-inside text-gray-700">
          {visit.dischargeDiagnosis.map((diagnosis, index) => (
            <li key={index}>{diagnosis}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Medications at Discharge */}
    {visit.medicationsAtDischarge?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Medications at Discharge</h3>
        <div className="space-y-2">
          {visit.medicationsAtDischarge.map((medication, index) => (
            <div key={index} className="border p-3 rounded">
              <p className="font-medium text-gray-800">{medication.name}</p>
              <p className="text-sm text-gray-600">
                Dosage: {medication.dosage} | Frequency: {medication.frequency} | Duration: {medication.duration}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Follow-up Instructions */}
    {visit.followUpInstructions && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Follow-up Instructions</h3>
        <p className="text-gray-700 whitespace-pre-line">{visit.followUpInstructions}</p>
      </div>
    )}

    {/* Return Precautions */}
    {visit.returnPrecautions?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Return Precautions</h3>
        <ul className="list-disc list-inside text-gray-700">
          {visit.returnPrecautions.map((precaution, index) => (
            <li key={index}>{precaution}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Discharge Status */}
    {visit.dischargeStatus && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Discharge Status</h3>
        <p className="text-gray-700">{visit.dischargeStatus}</p>
      </div>
    )}

    {/* Examination Findings */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Examination Findings</h3>
      <div className="space-y-3">
        {/* Areas Assessment */}
        {(visit.areasImproving || visit.areasExacerbated || visit.areasSame || visit.areasResolved) && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Areas Assessment</h4>
            <div className="space-y-1 text-sm">
              {visit.areasImproving && <p className="text-gray-700">• Some areas are improving</p>}
              {visit.areasExacerbated && <p className="text-gray-700">• Certain areas are exacerbated</p>}
              {visit.areasSame && <p className="text-gray-700">• Some areas remain the same</p>}
              {visit.areasResolved && <p className="text-gray-700">• Some areas have been resolved</p>}
            </div>
          </div>
        )}

        {/* Muscle Palpation */}
    {visit.musclePalpation && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Muscle Palpation</h4>
            <p className="text-gray-700 text-sm">{visit.musclePalpation}</p>
          </div>
    )}

        {/* Pain Radiating */}
    {visit.painRadiating && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Pain Radiating</h4>
            <p className="text-gray-700 text-sm">{visit.painRadiating}</p>
          </div>
    )}

        {/* Range of Motion */}
        {(visit.romPercent || visit.romWnlNoPain || visit.romWnlWithPain || visit.romImproved || visit.romDecreased || visit.romSame) && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Range of Motion</h4>
            <div className="space-y-1 text-sm">
    {visit.romPercent && (
                <p className="text-gray-700">• The patient has regained approximately {visit.romPercent}% of pre-injury ROM</p>
              )}
              {(visit.romWnlNoPain || visit.romWnlWithPain || visit.romImproved || visit.romDecreased || visit.romSame) && (
                <p className="text-gray-700">
                  • ROM Status: {[
                    visit.romWnlNoPain && "WNL (No Pain)",
                    visit.romWnlWithPain && "WNL (With Pain)",
                    visit.romImproved && "Improved",
                    visit.romDecreased && "Decreased",
                    visit.romSame && "Same"
                  ].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Orthopedic Tests */}
    {(visit.orthos?.tests || visit.orthos?.result) && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Orthopedic Tests</h4>
            <p className="text-gray-700 text-sm">
              {visit.orthos?.tests || 'N/A'}, with the result: {visit.orthos?.result || 'N/A'}
            </p>
          </div>
        )}

        {/* Activities Causing Pain */}
    {visit.activitiesCausePain && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Activities Causing Pain</h4>
            <p className="text-gray-700 text-sm">{visit.activitiesCausePain}</p>
          </div>
    )}

        {/* Other Notes */}
    {visit.otherNotes && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Other Notes</h4>
            <p className="text-gray-700 text-sm">{visit.otherNotes}</p>
          </div>
        )}
      </div>
    </div>

    {/* Assessment and Plan */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment and Plan</h3>
      <div className="space-y-3">
        {/* Prognosis */}
    {visit.prognosis && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Prognosis</h4>
            <p className="text-gray-700 text-sm">{visit.prognosis}</p>
          </div>
    )}

        {/* Diagnostic Study */}
    {(visit.diagnosticStudy?.study || visit.diagnosticStudy?.bodyPart || visit.diagnosticStudy?.result) && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Diagnostic Study</h4>
            <div className="space-y-1 text-sm">
              {visit.diagnosticStudy?.study && (
                <p className="text-gray-700">Study: {visit.diagnosticStudy.study}</p>
              )}
              {visit.diagnosticStudy?.bodyPart && (
                <p className="text-gray-700">Body Part: {visit.diagnosticStudy.bodyPart}</p>
              )}
              {visit.diagnosticStudy?.result && (
                <p className="text-gray-700">Result: {visit.diagnosticStudy.result}</p>
              )}
            </div>
          </div>
        )}

        {/* Future Medical Care */}
    {visit.futureMedicalCare?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Recommended Future Medical Care</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm">
              {visit.futureMedicalCare.map((care, index) => (
                <li key={index}>{care}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Croft Criteria */}
    {visit.croftCriteria && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Croft Criteria</h4>
            <p className="text-gray-700 text-sm">This case aligns with Croft Grade {visit.croftCriteria}</p>
          </div>
    )}

        {/* AMA Disability */}
    {visit.amaDisability && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">AMA Disability</h4>
            <p className="text-gray-700 text-sm">Rated as Grade {visit.amaDisability}</p>
          </div>
    )}

        {/* Home Care Instructions */}
    {visit.homeCare?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Home Care Instructions</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm">
              {visit.homeCare.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Referrals and Notes */}
    {visit.referralsNotes && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Referrals / Notes</h4>
            <p className="text-gray-700 text-sm">{visit.referralsNotes}</p>
          </div>
        )}
      </div>
    </div>

    {/* Additional Examination Data (if available from follow-up data) */}
    {(visit.muscleStrength?.length > 0 || visit.tenderness || visit.spasm || visit.ortho || visit.arom) && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Examination Data</h3>
        <div className="space-y-3">
          {/* Muscle Strength */}
          {visit.muscleStrength?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Muscle Strength</h4>
              <p className="text-gray-700 text-sm">{visit.muscleStrength.join(', ')}</p>
  </div>
)}

          {/* Tenderness */}
          {visit.tenderness && Object.keys(visit.tenderness).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Tenderness</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(visit.tenderness).map(([region, areas]) => (
                  <div key={region} className="border p-2 rounded">
                    <div className="font-medium">{region}</div>
                    <div>{Array.isArray(areas) ? areas.join(', ') : areas}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spasm */}
          {visit.spasm && Object.keys(visit.spasm).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Spasm</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(visit.spasm).map(([region, areas]) => (
                  <div key={region} className="border p-2 rounded">
                    <div className="font-medium">{region}</div>
                    <div>{Array.isArray(areas) ? areas.join(', ') : areas}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orthopedic Testing */}
          {visit.ortho && Object.keys(visit.ortho).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Orthopedic Testing</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(visit.ortho).map(([test, data]) => (
                  <div key={test} className="border p-2 rounded">
                    <div className="font-medium">{test}</div>
                    <div>
                      {data.left && 'Left '}
                      {data.right && 'Right '}
                      {data.bilateral && 'Bilateral'}
                      {data.ligLaxity && ` - Ligament Laxity: ${data.ligLaxity}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AROM Testing */}
          {visit.arom && Object.keys(visit.arom).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Active Range of Motion (AROM)</h4>
              <div className="space-y-2">
                {Object.entries(visit.arom).map(([region, movements]) => (
                  <div key={region} className="border p-2 rounded">
                    <h5 className="font-medium">{region}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                      {Object.entries(movements).map(([movement, data]) => (
                        <div key={movement} className="flex justify-between">
                          <span>{movement}:</span>
                          <span>
                            {data.exam && `Exam: ${data.exam} `}
                            {data.pain && '(Pain)'}
                            {data.left && '(L)'}
                            {data.right && '(R)'}
                            {data.bilateral && '(Bilateral)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

  </div>
)}



        {/* Additional Notes */}
        {visit.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Notes</h3>
            <p className="text-gray-800 whitespace-pre-line">{visit.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitDetails;