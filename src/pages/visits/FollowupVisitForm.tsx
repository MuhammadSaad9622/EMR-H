import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Save, X } from 'lucide-react';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

interface Visit {
  _id: string;
  date: string;
  visitType: string;
  __t: string;
}

// Define the interface for the form data
interface FollowupVisitFormData {
  previousVisit: string;
  areas: string;
  areasImproving: boolean;
  areasExacerbated: boolean;
  areasSame: boolean;
  areasResolved: boolean;
  orthos: {
    tests: string;
    result: string;
  };
  activitiesCausePain: string;
  activitiesCausePainOther: string;
  treatmentPlan: {
    treatments: string;
    chiropractic: boolean;
    acupuncture: boolean;
    mechanicalTraction: boolean;
    myofascialRelease: boolean;
    ultrasound: boolean;
    infraredElectricMuscleStimulation: boolean;
    therapeuticExercise: boolean;
    neuromuscularReeducation: boolean;
    other: string;
    frequency: {
      timesPerWeek: {
        '4x': boolean;
        '3x': boolean;
        '2x': boolean;
        '1x': boolean;
      };
      duration: {
        '4 wks': boolean;
        '6 wks': boolean;
        custom: string;
      };
      reEval: {
        '4 wks': boolean;
        '6 wks': boolean;
        custom: string;
      };
    };
  };
  overallResponse: {
    improving: boolean;
    worse: boolean;
    same: boolean;
  };
  referrals: string;
  diagnosticStudy: {
    study: string;
    bodyPart: string;
    result: string;
  };
  homeCare: {
    coreProgram: boolean;
    stretches: boolean;
    icePackHotPack: boolean;
    ligamentStabilityProgram: boolean;
    other: string;
  };
  homeCareSuggestions?: string;
  notes: string;
  additionalDiagnosisAreas?: string;
  palpationSeveritySelections?: {[region: string]: {[areaId: string]: string[]}};
  palpationType?: string;
  subjective?: {
    tempBodyPart?: string;
    tempSide?: string;
  };

  // ✅ ADD THIS to store modal-fetched auto data
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
          bilateral: string;
        };
      };
    };

    aromData?: {
      [region: string]: {
        [movementName: string]: {
          left: string;
          right: string;
          bilateral: string;
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

    homeCareSuggestions?: string;
    areasData?: {
      areasImproving: boolean;
      areasExacerbated: boolean;
      areasSame: boolean;
      areasResolved: boolean;
      subjectiveIntakeData?: Array<{
        bodyPart: string;
        side: string;
        severity: string;
        quality: string[];
        timing: string;
        context: string;
        exacerbatedBy: string[];
        symptoms: string[];
        notes: string;
        sciaticaRight: boolean;
        sciaticaLeft: boolean;
      }>;
      individualAreaStatus?: {
        [areaType: string]: {
          [areaId: string]: {
            improving: boolean;
            exacerbated: boolean;
            same: boolean;
            resolved: boolean;
          };
        };
      };
      muscleTenderness?: {
        [region: string]: {
          [anatomicalPart: string]: string[];
        };
      };
      muscleSpasm?: {
        [region: string]: {
          [anatomicalPart: string]: string[];
        };
      };
    };
  };
}


const FollowupVisitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth(); // Prefix with _ to indicate intentionally unused
  const [musclePalpationData, setMusclePalpationData] = useState<any>(null); // State for storing fetched muscle palpation data
const [isMuscleModalOpen, setIsMuscleModalOpen] = useState(false); // State for controlling modal visibility
const [isOrthoModalOpen, setIsOrthoModalOpen] = useState(false);
  const [orthoTestsData, setOrthoTestsData] = useState<any>({});
  const [aromData, setAromData] = useState<any>({});
  const [activitiesPainData, setActivitiesPainData] = useState<any>({});
  const [treatmentListData, setTreatmentListData] = useState<{
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
  }>({
    chiropracticAdjustment: [],
    chiropracticOther: '',
    acupuncture: [],
    acupunctureOther: '',
    physiotherapy: [],
    rehabilitationExercises: [],
    durationFrequency: {
      timesPerWeek: '',
      reEvalInWeeks: ''
    },
    referrals: [],
    imaging: {
      xray: [],
      mri: [],
      ct: []
    },
    diagnosticUltrasound: '',
    nerveStudy: [],
    restrictions: {
      avoidActivityWeeks: '',
      liftingLimitLbs: '',
      avoidProlongedSitting: false
    },
    disabilityDuration: '',
    otherNotes: ''
  });
const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
const [imagingData, setImagingData] = useState<any>(null);
const [isImagingModalOpen, setIsImagingModalOpen] = useState(false);

  // State for Muscle Palpation modal interactive selections
  const [muscleTendernessSelections, setMuscleTendernessSelections] = useState<{[region: string]: {[anatomicalPart: string]: string[]}}>({});
  const [muscleSpasmSelections, setMuscleSpasmSelections] = useState<{[region: string]: {[anatomicalPart: string]: string[]}}>({});

  // State for editable muscle strength data
  const [editableMuscleStrength, setEditableMuscleStrength] = useState<{
    muscleStrength: string[];
    strength: {
      [key: string]: {
        right?: string;
        left?: string;
      } | string;
    };
  }>({
    muscleStrength: [],
    strength: {}
  });

  // State for editable activities pain data
  const [editableActivitiesPainData, setEditableActivitiesPainData] = useState<{
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
  }>({
    chiropracticAdjustment: [],
    chiropracticOther: '',
    acupuncture: [],
    acupunctureOther: '',
    physiotherapy: [],
    rehabilitationExercises: [],
    durationFrequency: {
      timesPerWeek: '',
      reEvalInWeeks: ''
    },
    diagnosticUltrasound: '',
    disabilityDuration: ''
  });

  // State for Orthopedic Tests modal interactive selections
  const [orthoTestSelections, setOrthoTestSelections] = useState<{[region: string]: {[testName: string]: {left: boolean; right: boolean; bilateral: boolean}}}>({});
  
  // State for Imaging and Referrals modal interactive data
  const [imagingInputData, setImagingInputData] = useState<{
    referrals: string[];
    physiotherapy: string[];
    rehabilitationExercises: string[];
    durationFrequency: {
      timesPerWeek: string;
      reEvalInWeeks: string;
    };
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
  }>({
    referrals: [],
    physiotherapy: [],
    rehabilitationExercises: [],
    durationFrequency: {
      timesPerWeek: '',
      reEvalInWeeks: ''
    },
    imaging: {
      xray: [],
      mri: [],
      ct: []
    },
    diagnosticUltrasound: '',
    nerveStudy: [],
    restrictions: {
      avoidActivityWeeks: '',
      liftingLimitLbs: '',
      avoidProlongedSitting: false
    },
    disabilityDuration: '',
    otherNotes: ''
  });
  
  // State for individual area status tracking
  const [individualAreaStatus, setIndividualAreaStatus] = useState<{
    [areaType: string]: {
      [areaId: string]: {
        improving: boolean;
        exacerbated: boolean;
        same: boolean;
        resolved: boolean;
      };
    };
  }>({});

  const [patient, setPatient] = useState<Patient | null>(null);
  const [previousVisits, setPreviousVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialVisitData, setInitialVisitData] = useState<any>(null);
  const [hasLoadedVisits, setHasLoadedVisits] = useState(false);
  const [homeCareSuggestions, setHomeCareSuggestions] = useState('');
  const [isHomeCareModalOpen, setIsHomeCareModalOpen] = useState(false);
  const [isAreasModalOpen, setIsAreasModalOpen] = useState(false);
  const [isPalpationsModalOpen, setIsPalpationsModalOpen] = useState(false);
  const [selectedPalpationType, setSelectedPalpationType] = useState<string>('');
  const [selectedPalpationData, setSelectedPalpationData] = useState<any>(null);
  const [palpationSeveritySelections, setPalpationSeveritySelections] = useState<{[region: string]: {[areaId: string]: string[]}}>({});
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [activitiesData, setActivitiesData] = useState<string>('');

  // Use the defined interface for the state type
  const [formData, setFormData] = useState<FollowupVisitFormData>({
    previousVisit: '',
    areas: '',
    areasImproving: false,
    areasExacerbated: false,
    areasSame: false,
    areasResolved: false,
    orthos: {
      tests: '',
      result: ''
    },
    activitiesCausePain: '',
    activitiesCausePainOther: '',
    treatmentPlan: {
      treatments: '',
      chiropractic: false,
      acupuncture: false,
      mechanicalTraction: false,
      myofascialRelease: false,
      ultrasound: false,
      infraredElectricMuscleStimulation: false,
      therapeuticExercise: false,
      neuromuscularReeducation: false,
      other: '',
      frequency: {
        timesPerWeek: {
          '4x': false,
          '3x': false,
          '2x': false,
          '1x': false,
        },
        duration: {
          '4 wks': false,
          '6 wks': false,
          custom: '',
        },
        reEval: {
          '4 wks': false,
          '6 wks': false,
          custom: '',
        },
      },
    },
    overallResponse: {
      improving: false,
      worse: false,
      same: false
    },
    referrals: '',
    diagnosticStudy: {
      study: '',
      bodyPart: '',
      result: ''
    },
    homeCare: {
      coreProgram: false,
      stretches: false,
      icePackHotPack: false,
      ligamentStabilityProgram: false,
      other: ''
    },
    notes: '',
    subjective: {
      tempBodyPart: '',
      tempSide: ''
    }
  });
  
  // Auto-save timer
  // Update the type to include NodeJS.Timeout for compatibility
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | number | null>(null);
  const [localFormData, setLocalFormData] = useState<string | null>(null);



  // Handler for frequency checkbox changes
  const handleFrequencyChange = (category: 'timesPerWeek' | 'duration' | 'reEval', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      treatmentPlan: {
        ...prev.treatmentPlan,
        frequency: {
          ...prev.treatmentPlan.frequency,
          [category]: {
            ...prev.treatmentPlan.frequency[category],
            [value]: checked
          }
        }
      }
    }));
  };

  // Handler for frequency custom input changes
  const handleFrequencyCustomChange = (category: 'duration' | 'reEval', value: string) => {
    setFormData(prev => ({
      ...prev,
      treatmentPlan: {
        ...prev.treatmentPlan,
        frequency: {
          ...prev.treatmentPlan.frequency,
          [category]: {
            ...prev.treatmentPlan.frequency[category],
            custom: value
          }
        }
      }
    }));
  };

  // Handlers for Muscle Palpation modal interactive checkboxes
  const handleMuscleTendernessChange = (region: string, anatomicalPart: string, severity: string, checked: boolean) => {
    setMuscleTendernessSelections(prev => {
      const currentRegion = prev[region] || {};
      const currentAnatomicalPart = currentRegion[anatomicalPart] || [];
      let newSelections: string[];
      
      if (checked) {
        newSelections = [...currentAnatomicalPart, severity];
      } else {
        newSelections = currentAnatomicalPart.filter(s => s !== severity);
      }
      
      return {
        ...prev,
        [region]: {
          ...currentRegion,
          [anatomicalPart]: newSelections
        }
      };
    });
  };

  const handleMuscleSpasmChange = (region: string, anatomicalPart: string, severity: string, checked: boolean) => {
    setMuscleSpasmSelections(prev => {
      const currentRegion = prev[region] || {};
      const currentAnatomicalPart = currentRegion[anatomicalPart] || [];
      let newSelections: string[];
      
      if (checked) {
        newSelections = [...currentAnatomicalPart, severity];
      } else {
        newSelections = currentAnatomicalPart.filter(s => s !== severity);
      }
      
      return {
        ...prev,
        [region]: {
          ...currentRegion,
          [anatomicalPart]: newSelections
        }
      };
    });
  };

  // Handler for orthopedic test checkbox changes
  const handleOrthoTestChange = (region: string, testName: string, field: 'left' | 'right' | 'bilateral', checked: boolean) => {
    setOrthoTestSelections(prev => {
      const currentRegion = prev[region] || {};
      const currentTest = currentRegion[testName] || { left: false, right: false, bilateral: false };
      
      return {
        ...prev,
        [region]: {
          ...currentRegion,
          [testName]: {
            ...currentTest,
            [field]: checked
          }
        }
      };
    });
  };

  // Handler for imaging and referrals input changes
  const handleImagingInputChange = (field: string, value: string | string[], subField?: string) => {
    setImagingInputData(prev => {
      if (subField) {
        // Handle nested fields like imaging.xray, imaging.mri, etc.
        return {
          ...prev,
          [field]: {
            ...(prev[field as keyof typeof prev] as object || {}),
            [subField]: value
          }
        };
      } else if (field === 'durationFrequency') {
        // Handle duration frequency fields
        return {
          ...prev,
          durationFrequency: {
            ...prev.durationFrequency,
            [value as string]: value
          }
        };
      } else {
        // Handle simple array fields
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  // Handler for adding items to arrays (referrals, physiotherapy, etc.)
  const handleAddItem = (field: 'referrals' | 'physiotherapy' | 'rehabilitationExercises' | 'xray' | 'mri' | 'ct', value: string) => {
    if (!value.trim()) return;
    
    setImagingInputData(prev => {
      if (field === 'xray' || field === 'mri' || field === 'ct') {
        return {
          ...prev,
          imaging: {
            ...prev.imaging,
            [field]: [...prev.imaging[field], value.trim()]
          }
        };
      } else {
        return {
          ...prev,
          [field]: [...prev[field], value.trim()]
        };
      }
    });
  };

  // Handler for removing items from arrays
  const handleRemoveItem = (field: 'referrals' | 'physiotherapy' | 'rehabilitationExercises' | 'xray' | 'mri' | 'ct', index: number) => {
    setImagingInputData(prev => {
      if (field === 'xray' || field === 'mri' || field === 'ct') {
        const newArray = [...prev.imaging[field]];
        newArray.splice(index, 1);
        return {
          ...prev,
          imaging: {
            ...prev.imaging,
            [field]: newArray
          }
        };
      } else {
        const newArray = [...prev[field]];
        newArray.splice(index, 1);
        return {
          ...prev,
          [field]: newArray
        };
      }
    });
  };

  // Handler for individual area status changes
  const handleIndividualAreaStatusChange = (areaType: string, areaId: string, status: 'improving' | 'exacerbated' | 'same' | 'resolved', checked: boolean) => {
    setIndividualAreaStatus(prev => {
      const currentAreaType = prev[areaType] || {};
      const currentArea = currentAreaType[areaId] || {
        improving: false,
        exacerbated: false,
        same: false,
        resolved: false
      };

      return {
        ...prev,
        [areaType]: {
          ...currentAreaType,
          [areaId]: {
            ...currentArea,
            [status]: checked
          }
        }
      };
    });
  };

  const handlePalpationSelection = (type: 'tenderness' | 'spasm') => {
    const data = formData.fetchedData?.initialVisitData?.[type];
    if (data && Object.keys(data).length > 0) {
      setSelectedPalpationType(type);
      setSelectedPalpationData(data);
      setIsPalpationsModalOpen(true);
    } else {
      alert(`No ${type} data found in the initial visit.`);
    }
  };

  const handleActivitiesModalOpen = async () => {
    if (!formData.previousVisit) {
      alert("Please select a previous visit first.");
      return;
    }
    
    try {
      // Fetch initial visit data if not already loaded
      if (!formData.fetchedData?.initialVisitData) {
        await fetchInitialVisitData(formData.previousVisit);
      }
      
      // Set the current activities data from form
      setActivitiesData(formData.activitiesCausePain || '');
      setIsActivitiesModalOpen(true);
    } catch (error) {
      console.error('Error opening activities modal:', error);
      alert('Failed to load initial visit data.');
    }
  };

  const handlePalpationSeverityChange = (region: string, areaId: string, severity: string, checked: boolean) => {
    setPalpationSeveritySelections(prev => {
      const currentRegion = prev[region] || {};
      const currentArea = currentRegion[areaId] || [];
      let newSelections: string[];
      
      if (checked) {
        newSelections = [...currentArea, severity];
      } else {
        newSelections = currentArea.filter(s => s !== severity);
      }
      
      return {
        ...prev,
        [region]: {
          ...currentRegion,
          [areaId]: newSelections
        }
      };
    });
  };

  // Handler for editing muscle strength array items
  const handleMuscleStrengthChange = (index: number, value: string) => {
    setEditableMuscleStrength(prev => {
      const newMuscleStrength = [...prev.muscleStrength];
      newMuscleStrength[index] = value;
      return {
        ...prev,
        muscleStrength: newMuscleStrength
      };
    });
  };

  // Handler for adding new muscle strength item
  const handleAddMuscleStrength = () => {
    setEditableMuscleStrength(prev => ({
      ...prev,
      muscleStrength: [...prev.muscleStrength, '']
    }));
  };

  // Handler for removing muscle strength item
  const handleRemoveMuscleStrength = (index: number) => {
    setEditableMuscleStrength(prev => {
      const newMuscleStrength = [...prev.muscleStrength];
      newMuscleStrength.splice(index, 1);
      return {
        ...prev,
        muscleStrength: newMuscleStrength
      };
    });
  };

  // Handler for editing strength values (right/left)
  const handleStrengthChange = (key: string, side: 'right' | 'left', value: string) => {
    setEditableMuscleStrength(prev => {
      const currentStrength = prev.strength[key];
      let updatedStrength;
      
      if (typeof currentStrength === 'object' && currentStrength !== null) {
        // If it's an object with right/left properties
        updatedStrength = {
          ...currentStrength,
          [side]: value
        };
      } else {
        // If it's a string, convert to object
        updatedStrength = {
          right: side === 'right' ? value : '',
          left: side === 'left' ? value : ''
        };
      }
      
      return {
        ...prev,
        strength: {
          ...prev.strength,
          [key]: updatedStrength
        }
      };
    });
  };

  // Handler for adding new strength key
  const handleAddStrengthKey = () => {
    const newKey = prompt('Enter the strength key (e.g., C5, L2-L3):');
    if (newKey && newKey.trim()) {
      setEditableMuscleStrength(prev => ({
        ...prev,
        strength: {
          ...prev.strength,
          [newKey.trim()]: { right: '', left: '' }
        }
      }));
    }
  };

  // Handler for removing strength key
  const handleRemoveStrengthKey = (key: string) => {
    setEditableMuscleStrength(prev => {
      const newStrength = { ...prev.strength };
      delete newStrength[key];
      return {
        ...prev,
        strength: newStrength
      };
    });
  };

  // Handler for editing activities pain data
  const handleActivitiesPainChange = (field: string, value: string | string[], subField?: string) => {
    setEditableActivitiesPainData(prev => {
      if (subField) {
        // Handle nested fields like durationFrequency.timesPerWeek
        const currentField = prev[field as keyof typeof prev];
        if (typeof currentField === 'object' && currentField !== null && !Array.isArray(currentField)) {
          return {
            ...prev,
            [field]: {
              ...(currentField as Record<string, any>),
              [subField]: value
            }
          };
        } else {
          // If field is not an object, create a new object
          return {
            ...prev,
            [field]: {
              [subField]: value
            }
          };
        }
      } else {
        // Handle simple fields
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  // Handler for adding items to arrays in activities pain data
  const handleAddActivitiesPainItem = (field: 'chiropracticAdjustment' | 'acupuncture' | 'physiotherapy' | 'rehabilitationExercises', value: string) => {
    if (!value.trim()) return;
    
    setEditableActivitiesPainData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
  };

  // Handler for removing items from arrays in activities pain data
  const handleRemoveActivitiesPainItem = (field: 'chiropracticAdjustment' | 'acupuncture' | 'physiotherapy' | 'rehabilitationExercises', index: number) => {
    setEditableActivitiesPainData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  // Handler for saving muscle palpation modal selections
  const handleSaveMusclePalpation = () => {
    // Update the muscle palpation data with the selections and editable muscle strength
    const updatedMusclePalpationData = {
      ...musclePalpationData,
      muscleStrength: editableMuscleStrength.muscleStrength,
      strength: editableMuscleStrength.strength,
      tenderness: muscleTendernessSelections,
      spasm: muscleSpasmSelections,
    };

    // Update the form data (local state only - no backend save)
    setFormData((prev) => ({
      ...prev,
      fetchedData: {
        ...prev.fetchedData,
        musclePalpationData: updatedMusclePalpationData,
      },
    }));

    // Also update the muscle palpation state for immediate use
    setMusclePalpationData(updatedMusclePalpationData);

    alert('Muscle palpation data updated! Click "Save Visit" at the bottom to save all changes.');
    setIsMuscleModalOpen(false);
  };

  // Handler for saving orthopedic test modal selections
  const handleSaveOrthoTests = () => {
    // Update the orthopedic tests data with the selections
    const updatedOrthoTestsData = { ...orthoTestsData };
    
    Object.keys(orthoTestSelections).forEach(region => {
      if (!updatedOrthoTestsData[region]) {
        updatedOrthoTestsData[region] = {};
      }
      
      Object.keys(orthoTestSelections[region]).forEach(testName => {
        const selections = orthoTestSelections[region][testName];
        const existingTest = updatedOrthoTestsData[region][testName] || { left: '', right: '', ligLaxity: '' };
        
        updatedOrthoTestsData[region][testName] = {
          left: selections.left ? 'true' : existingTest.left,
          right: selections.right ? 'true' : existingTest.right,
          bilateral: selections.bilateral ? 'true' : existingTest.bilateral
        };
      });
    });

    // Update the form data (local state only - no backend save)
    setFormData((prev) => ({
      ...prev,
      fetchedData: {
        ...prev.fetchedData,
        orthoTestsData: updatedOrthoTestsData,
      },
    }));

    // Also update the orthopedic tests state for immediate use
    setOrthoTestsData(updatedOrthoTestsData);

    alert('Orthopedic tests data updated! Click "Save Visit" at the bottom to save all changes.');
    setIsOrthoModalOpen(false);
  };

  // Handler for saving imaging and referrals modal data
  const handleSaveImagingData = () => {
    // Update the imaging data with the input data
    const updatedImagingData = {
      referrals: imagingInputData.referrals,
      physiotherapy: imagingInputData.physiotherapy,
      rehabilitationExercises: imagingInputData.rehabilitationExercises,
      durationFrequency: imagingInputData.durationFrequency,
      imaging: imagingInputData.imaging,
      diagnosticUltrasound: imagingInputData.diagnosticUltrasound,
      nerveStudy: imagingInputData.nerveStudy,
      restrictions: imagingInputData.restrictions,
      disabilityDuration: imagingInputData.disabilityDuration,
      otherNotes: imagingInputData.otherNotes,
    };

    // Update the form data (local state only - no backend save)
    setFormData((prev) => ({
      ...prev,
      fetchedData: {
        ...prev.fetchedData,
        imagingData: updatedImagingData,
      },
    }));

    // Also update the imaging data state for immediate use
    setImagingData(updatedImagingData);

    alert('Imaging and referrals data updated! Click "Save Visit" at the bottom to save all changes.');
    setIsImagingModalOpen(false);
  };

  const handleSaveAreasData = () => {
    // Update the form data with the areas checkboxes, individual area status, and muscle severity data
    setFormData((prev) => ({
      ...prev,
      fetchedData: {
        ...prev.fetchedData,
        areasData: {
          areasImproving: prev.areasImproving,
          areasExacerbated: prev.areasExacerbated,
          areasSame: prev.areasSame,
          areasResolved: prev.areasResolved,
          individualAreaStatus: individualAreaStatus,
          muscleTenderness: muscleTendernessSelections,
          muscleSpasm: muscleSpasmSelections,
        },
      },
    }));

    // Also update the main form state to ensure the data is available for immediate use
    setFormData((prev) => ({
      ...prev,
      individualAreaStatus: individualAreaStatus,
      muscleTenderness: muscleTendernessSelections,
      muscleSpasm: muscleSpasmSelections,
    }));

    alert('Areas data updated! Click "Save Visit" at the bottom to save all changes.');
    setIsAreasModalOpen(false);
  };

  // Handler for saving activities pain modal data
  const handleSaveActivitiesPain = async () => {
    try {
      // Update the activities pain data with the editable data
      const updatedActivitiesPainData = {
        ...editableActivitiesPainData
      };

      // Save to database if we have a previous visit
      if (formData.previousVisit) {
        await saveActivitiesPainData(formData.previousVisit, updatedActivitiesPainData);
      }

      // Update the form data (local state only - no backend save)
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          activitiesPainData: updatedActivitiesPainData,
        },
      }));

      // Also update the activities pain state for immediate use
      setActivitiesPainData(updatedActivitiesPainData);

      alert('Activities pain data saved successfully!');
      setIsActivitiesModalOpen(false);
    } catch (error) {
      console.error('Error saving activities pain data:', error);
      alert('Failed to save activities pain data. Please try again.');
    }
  };



  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch patient data
        const [patientResponse, visitsResponse] = await Promise.all([
          axios.get(`https://emr-h.onrender.com/api/patients/${id}`),
          axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`)
        ]);
        
        if (isMounted) {
          setPatient(patientResponse.data);
          
          // Debug: Log the raw visits data
          console.log('Raw visits data:', visitsResponse.data);
          

       // Include all visits and sort by date ascending
const sortedVisits = visitsResponse.data
.filter((visit: any) => !!visit.date) // Ensure each visit has a date
.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

console.log('All sorted visits:', sortedVisits);

setPreviousVisits(sortedVisits);

          
          console.log('Filtered initial visits:', sortedVisits);
          setPreviousVisits(sortedVisits);
          setHasLoadedVisits(true);
          
          // Check for locally saved form data
          const savedData = localStorage.getItem(`followupVisit_${id}`);
          if (savedData) {
            setLocalFormData(savedData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          setHasLoadedVisits(true); // Ensure we don't get stuck in loading state
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Clean up
    return () => {
      isMounted = false;
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer as any);
      }
    };
  }, [id]);


  const saveMusclePalpationData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        muscleStrength: data.muscleStrength,
        strength: data.strength,
        tenderness: data.tenderness,
        spasm: data.spasm,
      });
      console.log("✅ Muscle data saved");
    } catch (error) {
      console.error("❌ Failed to save muscle data", error);
    }
  };
  
  const saveOrthoTestsData = async (visitId: string, data: any, arom: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        ortho: data,
        arom: arom,
      });
      console.log("✅ Ortho tests data saved");
    } catch (error) {
      console.error("❌ Failed to save ortho tests data", error);
    }
  };
  
  const saveActivitiesPainData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        chiropracticAdjustment: data.chiropracticAdjustment,
        chiropracticOther: data.chiropracticOther,
        acupuncture: data.acupuncture,
        acupunctureOther: data.acupunctureOther,
        physiotherapy: data.physiotherapy,
        rehabilitationExercises: data.rehabilitationExercises,
        durationFrequency: data.durationFrequency,
        diagnosticUltrasound: data.diagnosticUltrasound,
        disabilityDuration: data.disabilityDuration,
      });
      console.log("✅ Activities pain data saved");
    } catch (error) {
      console.error("❌ Failed to save activities pain data", error);
      throw error;
    }
  };

  const saveTreatmentPlanData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        chiropracticAdjustment: data.chiropracticAdjustment,
        chiropracticOther: data.chiropracticOther,
        acupuncture: data.acupuncture,
        acupunctureOther: data.acupunctureOther,
        physiotherapy: data.physiotherapy,
        rehabilitationExercises: data.rehabilitationExercises,
        durationFrequency: data.durationFrequency,
        diagnosticUltrasound: data.diagnosticUltrasound,
        disabilityDuration: data.disabilityDuration,
      });
      console.log("✅ Treatment plan data saved");
    } catch (error) {
      console.error("❌ Failed to save treatment plan data", error);
    }
  };
  
  const saveTreatmentListData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        chiropracticAdjustment: data.chiropracticAdjustment,
        chiropracticOther: data.chiropracticOther,
        acupuncture: data.acupuncture,
        acupunctureOther: data.acupunctureOther,
        physiotherapy: data.physiotherapy,
        rehabilitationExercises: data.rehabilitationExercises,
        durationFrequency: data.durationFrequency,
        referrals: data.referrals,
        imaging: data.imaging,
        diagnosticUltrasound: data.diagnosticUltrasound,
        nerveStudy: data.nerveStudy,
        restrictions: data.restrictions,
        disabilityDuration: data.disabilityDuration,
        otherNotes: data.otherNotes,
      });
      console.log("✅ Treatment list data saved");
    } catch (error) {
      console.error("❌ Failed to save treatment list data", error);
    }
  };
  
  const saveImagingAndSpecialistData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        physiotherapy: data.physiotherapy,
        rehabilitationExercises: data.rehabilitationExercises,
        durationFrequency: data.durationFrequency,
        referrals: data.referrals,
        imaging: data.imaging,
      });
      console.log("✅ Imaging and specialist data saved");
    } catch (error) {
      console.error("❌ Failed to save imaging and specialist data", error);
    }
  };

  const savePalpationData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`https://emr-h.onrender.com/api/visits/${visitId}`, {
        palpationSeveritySelections: data.palpationSeveritySelections,
        palpationType: data.palpationType
      });
      console.log("✅ Palpation data saved");
    } catch (error) {
      console.error("❌ Failed to save palpation data", error);
    }
  };

  const handleSavePalpationData = async () => {
    try {
      const palpationData = {
        palpationSeveritySelections: palpationSeveritySelections,
        palpationType: selectedPalpationType
      };
      
      await savePalpationData(formData.previousVisit, palpationData);
      
      // Update the form data with the palpation data
      setFormData(prev => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          palpationData: palpationData
        }
      }));
      
      alert('Palpation data saved successfully!');
      setIsPalpationsModalOpen(false);
    } catch (error) {
      console.error('Error saving palpation data:', error);
      alert('Failed to save palpation data.');
    }
  };

  const handleSaveActivitiesData = async () => {
    try {
      // Update form data with the activities data
      setFormData(prev => ({
        ...prev,
        activitiesCausePain: activitiesData
      }));
      
      // Save to database
      await axios.put(`https://emr-h.onrender.com/api/visits/${formData.previousVisit}`, {
        activitiesCausePain: activitiesData
      });
      
      alert('Activities data saved successfully!');
      setIsActivitiesModalOpen(false);
    } catch (error) {
      console.error('Error saving activities data:', error);
      alert('Failed to save activities data.');
    }
  };

  const handleSaveTreatmentListData = async () => {
    try {
      // Save treatment list data to database
      await saveTreatmentListData(formData.previousVisit, treatmentListData);
      
      // Update form data with the treatment list data
      setFormData(prev => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          treatmentListData: treatmentListData
        }
      }));
      
      alert('Treatment plan data saved successfully!');
      setIsTreatmentModalOpen(false);
    } catch (error) {
      console.error('Error saving treatment plan data:', error);
      alert('Failed to save treatment plan data.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveData = {
        ...formData,
        ...(formData.fetchedData || {}), // ⬅️ this line spreads fetched modal data into the main save body
      };
  
      if (formData.previousVisit) {
        // PUT to update
        await axios.put(`https://emr-h.onrender.com/api/visits/${formData.previousVisit}`, saveData);
      } else {
        // POST to create
        const createData = {
          ...saveData,
          visitType: 'followup',
          patient: id,
        };
        await axios.post('https://emr-h.onrender.com/api/visits', createData);
      }
  
      alert('Visit saved successfully!');
      navigate(-1);
    } catch (error) {
      console.error('Error saving visit:', error);
      alert('Failed to save visit.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const fetchMusclePalpationData = async (visitId: string) => {
    if (!visitId) {
      alert("Please select a valid previous visit.");
      return;
    }
  
    try {
      const res = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visit = res.data;
  
      // Check if data exists for followup or initial
      const musclePalpationData = {
        muscleStrength: visit.muscleStrength || [],
        strength: visit.strength || {},
        tenderness: visit.tenderness || {},
        spasm: visit.spasm || {},
      };
  
      setMusclePalpationData(musclePalpationData);
      
      // Initialize editable muscle strength data with fetched data
      setEditableMuscleStrength({
        muscleStrength: visit.muscleStrength || [],
        strength: visit.strength || {}
      });
      
      setIsMuscleModalOpen(true);
  
      // Initialize selections for interactive checkboxes
      setMuscleTendernessSelections({});
      setMuscleSpasmSelections({});
  
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          musclePalpationData,
        },
      }));
    } catch (error) {
      console.error("Error fetching muscle palpation data:", error);
      alert("Failed to load data.");
    }
  };
  
  const fetchOrthoTestsData = async (visitId: string) => {
    if (!visitId) {
      alert("Please select a valid previous visit.");
      return;
    }
  
        try {
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visitData = response.data;

      if (!visitData) {
        console.error("Visit data is missing.");
        alert("Failed to load visit data.");
        return;
      }
  
      // Extract and structure ortho tests data
      const orthoTestsData: {
        [region: string]: {
          [testName: string]: { left: string; right: string; bilateral: string };
        };
      } = visitData.ortho || {};
      
      console.log('Loaded orthopedic tests data from visit:', orthoTestsData);
  
      // Extract and structure AROM data
      const aromData: {
        [region: string]: {
          [movementName: string]: { left: string; right: string; bilateral: string };
        };
      } = visitData.arom
        ? Object.entries(visitData.arom as Record<string, any>).reduce((acc: any, [region, movements]) => {
            acc[region] = Object.entries(movements as Record<string, any>).reduce((movementAcc: any, [movementName, movementData]) => {
              const { left, right, bilateral } = movementData as {
                left: string;
                right: string;
                bilateral: string;
              };
  
              movementAcc[movementName] = {
                left: left || "N/A",
                right: right || "N/A",
                bilateral: bilateral || "N/A",
              };
              return movementAcc;
            }, {});
            return acc;
          }, {})
        : {};
  
      // Update state for modal display
      setOrthoTestsData(orthoTestsData);
      setAromData(aromData);
      setIsOrthoModalOpen(true);

        // Initialize selections for interactive checkboxes based on existing data
        const initialSelections: {[region: string]: {[testName: string]: {left: boolean; right: boolean; bilateral: boolean}}} = {};
        
        Object.keys(orthoTestsData).forEach(region => {
          initialSelections[region] = {};
          Object.keys(orthoTestsData[region]).forEach(testName => {
            const testData = orthoTestsData[region][testName];
            initialSelections[region][testName] = {
              left: testData.left === 'true',
              right: testData.right === 'true',
              bilateral: testData.bilateral === 'true'
            };
          });
        });
        
        setOrthoTestSelections(initialSelections);
  
      // ✅ Save in formData.fetchedData for backend persistence
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          orthoTestsData,
          aromData,
        },
      }));

      // Also update the state for immediate use
      setOrthoTestsData(orthoTestsData);
      setAromData(aromData);
    } catch (error) {
      console.error("Error fetching orthopedic tests data:", error);
      alert("Failed to load orthopedic tests data.");
    }
  };  

  const fetchTreatmentPlanData = async (visitId: string) => {
    if (!visitId) {
      alert("Please select a valid previous visit.");
      return;
    }
  
    try {
      // First, get the selected visit data
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visitData = response.data;

      console.log('Loading activities pain data from selected visit:', visitData);

      // Also try to get data from all previous visits to find the most recent data
      const allVisitsResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`);
      const allVisits = allVisitsResponse.data;
      
      // Find the most recent visit with activities pain data
      let mostRecentActivitiesData = null;
      for (const visit of allVisits) {
        if (visit._id === visitId) continue; // Skip the current selected visit
        
        // Check for data in various possible locations
        const hasActivitiesData = visit.chiropracticAdjustment || visit.acupuncture || visit.physiotherapy || 
                                 visit.rehabilitationExercises || visit.diagnosticUltrasound || visit.disabilityDuration ||
                                 visit.fetchedData?.activitiesPainData || visit.activitiesCausePain;
        
        if (hasActivitiesData) {
          mostRecentActivitiesData = visit;
          console.log('Found activities pain data in previous visit:', visit);
          break;
        }
      }

      // Use the most recent data found, or fall back to selected visit data
      const dataSource = mostRecentActivitiesData || visitData;
      
      console.log('Data source being used for activities pain:', dataSource);
      
      // Helper function to parse data that might be stored as strings
      const parseData = (data: any) => {
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return data.split(',').map(item => item.trim()).filter(item => item);
          }
        }
        return data || [];
      };

      // Filter only treatment plan data - check both direct fields and fetchedData
      const treatmentData = {
        chiropracticAdjustment: parseData(dataSource.chiropracticAdjustment) || parseData(dataSource.fetchedData?.activitiesPainData?.chiropracticAdjustment) || [],
        chiropracticOther: dataSource.chiropracticOther || dataSource.fetchedData?.activitiesPainData?.chiropracticOther || '',
        acupuncture: parseData(dataSource.acupuncture) || parseData(dataSource.fetchedData?.activitiesPainData?.acupuncture) || [],
        acupunctureOther: dataSource.acupunctureOther || dataSource.fetchedData?.activitiesPainData?.acupunctureOther || '',
        physiotherapy: parseData(dataSource.physiotherapy) || parseData(dataSource.fetchedData?.activitiesPainData?.physiotherapy) || [],
        rehabilitationExercises: parseData(dataSource.rehabilitationExercises) || parseData(dataSource.fetchedData?.activitiesPainData?.rehabilitationExercises) || [],
        durationFrequency: dataSource.durationFrequency || dataSource.fetchedData?.activitiesPainData?.durationFrequency || {
          timesPerWeek: '',
          reEvalInWeeks: '',
        },
        diagnosticUltrasound: dataSource.diagnosticUltrasound || dataSource.fetchedData?.activitiesPainData?.diagnosticUltrasound || '',
        disabilityDuration: dataSource.disabilityDuration || dataSource.fetchedData?.activitiesPainData?.disabilityDuration || '',
      };

      console.log('Processed activities pain data:', treatmentData);
  
      // Show in modal
      setActivitiesPainData(treatmentData);
      
      // Initialize editable activities pain data with fetched data
      setEditableActivitiesPainData(treatmentData);
      
      setIsActivitiesModalOpen(true);
  
      // ✅ Save to formData.fetchedData for backend submission
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          activitiesPainData: treatmentData,
        },
      }));

      // Also update the state for immediate use
      setActivitiesPainData(treatmentData);
    } catch (error) {
      console.error("Error fetching treatment plan data:", error);
      alert("Failed to load treatment plan data.");
    }
  };
  
  const fetchTreatmentListData = async (visitId: string) => {
    if (!visitId) {
      alert("Please select a valid previous visit.");
      return;
    }
  
        try {
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visitData = response.data;

      console.log('Loading treatment list data from selected visit:', visitData);

      const parseData = (data: any) => {
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return data.split(',').map(item => item.trim()).filter(item => item);
          }
        }
        return data;
      };

      const treatmentList = {
        chiropracticAdjustment: parseData(visitData.chiropracticAdjustment) || [],
        chiropracticOther: visitData.chiropracticOther || '',
        acupuncture: parseData(visitData.acupuncture) || [],
        acupunctureOther: visitData.acupunctureOther || '',
        physiotherapy: parseData(visitData.physiotherapy) || [],
        rehabilitationExercises: parseData(visitData.rehabilitationExercises) || [],
        durationFrequency: visitData.durationFrequency || { timesPerWeek: '', reEvalInWeeks: '' },
        referrals: parseData(visitData.referrals) || [],
        imaging: visitData.imaging || { xray: [], mri: [], ct: [] },
        diagnosticUltrasound: visitData.diagnosticUltrasound || '',
        nerveStudy: parseData(visitData.nerveStudy) || [],
        restrictions: visitData.restrictions || {
          avoidActivityWeeks: '',
          liftingLimitLbs: '',
          avoidProlongedSitting: false,
        },
        disabilityDuration: visitData.disabilityDuration || '',
        otherNotes: visitData.otherNotes || '',
      };

      console.log('Processed treatment list data:', treatmentList);
  
      // Set for modal display
      setTreatmentListData(treatmentList);
      setIsTreatmentModalOpen(true);
  
      // ✅ Save in formData.fetchedData for backend persistence
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          treatmentListData: treatmentList,
        },
      }));
    } catch (error) {
      console.error("Error fetching treatment list:", error);
      alert("Failed to load treatment plan.");
    }
  };
  
  const fetchImagingAndSpecialistData = async (visitId: string) => {
    if (!visitId) {
      alert("Please select a valid previous visit.");
      return;
    }
  
        try {
      // First, get the selected visit data
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visitData = response.data;

      console.log('Loading imaging data from selected visit:', visitData);

      // Also try to get data from all previous visits to find the most recent data
      const allVisitsResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`);
      const allVisits = allVisitsResponse.data;
      
      // Find the most recent visit with imaging data
      let mostRecentImagingData = null;
      for (const visit of allVisits) {
        if (visit._id === visitId) continue; // Skip the current selected visit
        
        // Check for data in various possible locations
        const hasImagingData = visit.referrals || visit.physiotherapy || visit.rehabilitationExercises || visit.imaging ||
                              visit.diagnosticUltrasound || visit.nerveStudy || visit.restrictions || visit.disabilityDuration || visit.otherNotes ||
                              visit.fetchedData?.imagingData || visit.fetchedData?.referrals || visit.fetchedData?.physiotherapy;
        
        if (hasImagingData) {
          mostRecentImagingData = visit;
          console.log('Found imaging data in previous visit:', visit);
          console.log('Visit fetchedData:', visit.fetchedData);
          break;
        }
      }

      // Use the most recent data found, or fall back to selected visit data
      const dataSource = mostRecentImagingData || visitData;
      
      console.log('Data source being used:', dataSource);
      console.log('Data source keys:', Object.keys(dataSource));
      
      // Helper function to parse data that might be stored as strings
      const parseData = (data: any) => {
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return data.split(',').map(item => item.trim()).filter(item => item);
          }
        }
        return data;
      };

      // Check for data in different possible locations
      const imagingAndSpecialistData = {
        physiotherapy: parseData(dataSource.physiotherapy) || parseData(dataSource.physiotherapyData) || parseData(dataSource.fetchedData?.imagingData?.physiotherapy) || [],
        rehabilitationExercises: parseData(dataSource.rehabilitationExercises) || parseData(dataSource.rehabilitationExercisesData) || parseData(dataSource.fetchedData?.imagingData?.rehabilitationExercises) || [],
        durationFrequency: dataSource.durationFrequency || dataSource.durationFrequencyData || dataSource.fetchedData?.imagingData?.durationFrequency || {
          timesPerWeek: '',
          reEvalInWeeks: '',
        },
        referrals: parseData(dataSource.referrals) || parseData(dataSource.referralsData) || parseData(dataSource.fetchedData?.imagingData?.referrals) || [],
        imaging: dataSource.imaging || dataSource.imagingData || dataSource.fetchedData?.imagingData?.imaging || {
          xray: [],
          mri: [],
          ct: [],
        },
        diagnosticUltrasound: dataSource.diagnosticUltrasound || dataSource.fetchedData?.imagingData?.diagnosticUltrasound || '',
        nerveStudy: parseData(dataSource.nerveStudy) || parseData(dataSource.fetchedData?.imagingData?.nerveStudy) || [],
        restrictions: dataSource.restrictions || dataSource.fetchedData?.imagingData?.restrictions || {
          avoidActivityWeeks: '',
          liftingLimitLbs: '',
          avoidProlongedSitting: false,
        },
        disabilityDuration: dataSource.disabilityDuration || dataSource.fetchedData?.imagingData?.disabilityDuration || '',
        otherNotes: dataSource.otherNotes || dataSource.fetchedData?.imagingData?.otherNotes || '',
      };

      console.log('Processed imaging data:', imagingAndSpecialistData);
      console.log('Referrals found:', imagingAndSpecialistData.referrals);
      console.log('Physiotherapy found:', imagingAndSpecialistData.physiotherapy);
      console.log('Rehabilitation exercises found:', imagingAndSpecialistData.rehabilitationExercises);
      console.log('Imaging found:', imagingAndSpecialistData.imaging);

      // If no data found, show a message
      const hasAnyData = imagingAndSpecialistData.referrals.length > 0 || 
                        imagingAndSpecialistData.physiotherapy.length > 0 || 
                        imagingAndSpecialistData.rehabilitationExercises.length > 0 ||
                        imagingAndSpecialistData.imaging.xray.length > 0 ||
                        imagingAndSpecialistData.imaging.mri.length > 0 ||
                        imagingAndSpecialistData.imaging.ct.length > 0 ||
                        imagingAndSpecialistData.durationFrequency.timesPerWeek ||
                        imagingAndSpecialistData.durationFrequency.reEvalInWeeks ||
                        imagingAndSpecialistData.diagnosticUltrasound ||
                        imagingAndSpecialistData.nerveStudy.length > 0 ||
                        imagingAndSpecialistData.restrictions?.avoidActivityWeeks ||
                        imagingAndSpecialistData.restrictions?.liftingLimitLbs ||
                        imagingAndSpecialistData.restrictions?.avoidProlongedSitting ||
                        imagingAndSpecialistData.disabilityDuration ||
                        imagingAndSpecialistData.otherNotes;

      if (!hasAnyData) {
        console.log('No previous imaging data found - starting with empty form');
      } else {
        console.log('Previous imaging data found and will be displayed');
      }
  
      // Set modal data
      setImagingData(imagingAndSpecialistData);
      setIsImagingModalOpen(true);

      // Initialize input data with existing values
      const initialInputData = {
        referrals: Array.isArray(imagingAndSpecialistData.referrals) ? imagingAndSpecialistData.referrals : [],
        physiotherapy: Array.isArray(imagingAndSpecialistData.physiotherapy) ? imagingAndSpecialistData.physiotherapy : [],
        rehabilitationExercises: Array.isArray(imagingAndSpecialistData.rehabilitationExercises) ? imagingAndSpecialistData.rehabilitationExercises : [],
        durationFrequency: {
          timesPerWeek: imagingAndSpecialistData.durationFrequency?.timesPerWeek || '',
          reEvalInWeeks: imagingAndSpecialistData.durationFrequency?.reEvalInWeeks || ''
        },
        imaging: {
          xray: Array.isArray(imagingAndSpecialistData.imaging?.xray) ? imagingAndSpecialistData.imaging.xray : [],
          mri: Array.isArray(imagingAndSpecialistData.imaging?.mri) ? imagingAndSpecialistData.imaging.mri : [],
          ct: Array.isArray(imagingAndSpecialistData.imaging?.ct) ? imagingAndSpecialistData.imaging.ct : []
        },
        diagnosticUltrasound: imagingAndSpecialistData.diagnosticUltrasound || '',
        nerveStudy: Array.isArray(imagingAndSpecialistData.nerveStudy) ? imagingAndSpecialistData.nerveStudy : [],
        restrictions: {
          avoidActivityWeeks: imagingAndSpecialistData.restrictions?.avoidActivityWeeks || '',
          liftingLimitLbs: imagingAndSpecialistData.restrictions?.liftingLimitLbs || '',
          avoidProlongedSitting: imagingAndSpecialistData.restrictions?.avoidProlongedSitting || false
        },
        disabilityDuration: imagingAndSpecialistData.disabilityDuration || '',
        otherNotes: imagingAndSpecialistData.otherNotes || ''
      };

      console.log('Setting initial input data:', initialInputData);
      setImagingInputData(initialInputData);
  
      // ✅ Store in formData.fetchedData for backend submission
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          imagingData: imagingAndSpecialistData,
        },
      }));

      // Also update the state for immediate use
      setImagingData(imagingAndSpecialistData);
    } catch (error) {
      console.error("Error fetching imaging and specialist data:", error);
      alert("Failed to load data.");
    }
  };
  
  const handleHomeCareAI = async () => {
    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-b2f10ae71f37484c83093c51b49d29bc", // 🔐 Replace for production
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.2,
          max_tokens: 800, // Increased for more detailed home care instructions
          messages: [
            {
              role: "system",
              content: `
You are a highly experienced clinical therapist AI specializing in chiropractic and physical therapy home care programs.

Based on the patient's clinical data, generate comprehensive, detailed home care instructions in raw HTML format. The instructions should be specific to the patient's condition, treatment plan, and clinical findings.

Format with detailed sections:

<h2 class='text-lg font-bold text-blue-600 mb-3'>Home Exercise Program</h2>
<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Strengthening Exercises</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li><strong>Exercise Name</strong> – Detailed description, sets/reps, frequency, and specific instructions</li>
  <li>Include progression guidelines and modifications based on patient's condition</li>
</ul>

<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Stretching & Flexibility</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li>Specific stretches with duration, frequency, and technique instructions</li>
  <li>Include modifications for pain levels and mobility restrictions</li>
</ul>

<h2 class='text-lg font-bold text-blue-600 mb-3'>Pain Management</h2>
<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Modalities</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li>Ice/heat application with specific timing and technique</li>
  <li>Other pain relief methods based on patient's condition</li>
</ul>

<h2 class='text-lg font-bold text-blue-600 mb-3'>Ergonomic & Lifestyle Modifications</h2>
<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Posture & Body Mechanics</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li>Specific posture corrections for patient's condition</li>
  <li>Workstation and daily activity modifications</li>
</ul>

<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Activity Modifications</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li>Specific activities to avoid or modify</li>
  <li>Safe alternatives and gradual return to activities</li>
</ul>

<h2 class='text-lg font-bold text-blue-600 mb-3'>Safety & Follow-up</h2>
<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Precautions</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li>Warning signs to watch for</li>
  <li>When to stop exercises or contact provider</li>
</ul>

<h3 class='text-md font-semibold mt-4 mb-2 text-gray-700'>Progress Tracking</h3>
<ul class='list-disc list-inside text-gray-800 space-y-1'>
  <li>How to monitor progress and symptoms</li>
  <li>When to advance or modify the program</li>
</ul>

Guidelines:
- Base recommendations on the patient's specific diagnosis, pain patterns, and treatment plan
- Include specific exercises with detailed instructions (sets, reps, frequency, technique)
- Address the patient's specific areas of concern and treatment modalities
- Provide clear progression guidelines and safety precautions
- Use professional medical terminology while remaining patient-friendly
- Include modifications for different pain levels and mobility restrictions
- Reference specific body parts and conditions mentioned in the patient data
- Provide comprehensive but practical instructions suitable for home use

Generate detailed, personalized home care instructions based on the provided patient data:
`.trim(),

            },
            {
              role: "user",
              content: JSON.stringify(formData, null, 2)
            }
          ]
        }),
      });
  
      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content || "No suggestions returned by AI.";
  
      setHomeCareSuggestions(aiText);
      setIsHomeCareModalOpen(true);
  
      setFormData((prev) => ({
        ...prev,
        homeCare: aiText,
        fetchedData: {
          ...prev.fetchedData,
          homeCareSuggestions: aiText,
        }
      }));

      // Also update the state for immediate use
      setHomeCareSuggestions(aiText);
  
    } catch (error) {
      console.error("Error calling DeepSeek:", error);
      alert("Failed to fetch AI suggestions.");
    }
  };  

  const fetchInitialVisitData = async (visitId: string) => {
    try {
      // Get the visit details using the correct endpoint
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      
      // Check if it's an initial visit (check both __t and visitType for compatibility)
      const isInitialVisit = response.data.__t === 'InitialVisit' || response.data.visitType === 'initial';
  
      if (!isInitialVisit) {
        console.error('Visit data:', response.data);
        throw new Error(`Selected visit is not an initial visit. Visit type: ${response.data.visitType}, __t: ${response.data.__t}`);
      }
  
      // Set modal display data
      setInitialVisitData(response.data);
      setIsModalOpen(true);
  
      // Save to formData.fetchedData for DB persistence
      setFormData((prev) => ({
        ...prev,
        fetchedData: {
          ...prev.fetchedData,
          initialVisitData: response.data,
        },
      }));

      // Also update the state for immediate use
      setInitialVisitData(response.data);
    } catch (err: any) {
      console.error('Error fetching initial visit data:', err);
      if (err.response?.status === 404) {
        alert('Visit not found. The selected visit may have been deleted.');
      } else {
        alert(`Failed to load initial visit data: ${err.message}. Please ensure the selected visit is an initial visit.`);
      }
    }
  };

  const fetchAreasData = async (visitId: string) => {
    if (!visitId) {
      alert("Please select a valid previous visit.");
      return;
    }
  
    try {
      // Get the selected visit data
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visitData = response.data;

      console.log('Loading areas data from selected visit:', visitData);

      // Check if the selected visit is an initial visit
      const isInitialVisit = visitData.__t === 'InitialVisit' || visitData.visitType === 'initial';
      
      if (!isInitialVisit) {
        alert("Please select an initial visit to load areas data.");
        return;
      }

      // Get patient data to access subjective intake information
      const patientResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}`);
      const patientData = patientResponse.data;

      console.log('Patient data for subjective intake:', patientData);

      // Extract subjective intake data (chief complaint data)
      let subjectiveIntakeData = [];
      if (patientData.subjective && patientData.subjective.bodyPart && Array.isArray(patientData.subjective.bodyPart)) {
        subjectiveIntakeData = patientData.subjective.bodyPart.map((intake: any) => ({
          bodyPart: intake.part || '',
          side: intake.side || '',
          severity: intake.severity || '',
          quality: Array.isArray(intake.quality) ? intake.quality : [],
          timing: intake.timing || '',
          context: intake.context || '',
          exacerbatedBy: Array.isArray(intake.exacerbatedBy) ? intake.exacerbatedBy : [],
          symptoms: Array.isArray(intake.symptoms) ? intake.symptoms : [],
          notes: intake.notes || '',
          sciaticaRight: intake.sciaticaRight || false,
          sciaticaLeft: intake.sciaticaLeft || false
        }));
      }

      console.log('Extracted subjective intake data:', subjectiveIntakeData);

      // Check if the selected visit has areas data
      let areasData = {
        areasImproving: visitData.areasImproving || false,
        areasExacerbated: visitData.areasExacerbated || false,
        areasSame: visitData.areasSame || false,
        areasResolved: visitData.areasResolved || false,
        subjectiveIntakeData: subjectiveIntakeData // Add subjective intake data
      };

      // If the selected visit doesn't have areas data, look for it in previous visits
      if (!visitData.areasImproving && !visitData.areasExacerbated && 
          !visitData.areasSame && !visitData.areasResolved) {
        
        const allVisitsResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`);
        const allVisits = allVisitsResponse.data;
        
        // Find the most recent visit with areas data (excluding the current selected visit)
        for (const visit of allVisits) {
          if (visit._id === visitId) continue; // Skip the current selected visit
          
          if (visit.areasImproving || visit.areasExacerbated || 
              visit.areasSame || visit.areasResolved) {
            console.log('Found areas data in previous visit:', visit);
            
            areasData = {
              areasImproving: visit.areasImproving || false,
              areasExacerbated: visit.areasExacerbated || false,
              areasSame: visit.areasSame || false,
              areasResolved: visit.areasResolved || false,
              subjectiveIntakeData: subjectiveIntakeData // Keep subjective intake data
            };
            break;
          }
        }
      }

      console.log('Processed areas data:', areasData);
      console.log('Initial visit data for areas:', {
        painLocation: visitData.painLocation,
        diagnosis: visitData.diagnosis,
        jointDysfunction: visitData.jointDysfunction,
        tenderness: visitData.tenderness,
        spasm: visitData.spasm
      });
  
      // Update form data with the found areas data
      setFormData((prev) => ({
        ...prev,
        areasImproving: areasData.areasImproving,
        areasExacerbated: areasData.areasExacerbated,
        areasSame: areasData.areasSame,
        areasResolved: areasData.areasResolved,
        fetchedData: {
          ...prev.fetchedData,
          areasData: areasData,
          initialVisitData: visitData, // Store the initial visit data to display areas information
        },
      }));

      // Load individual area status from previous visit if available
      if (visitData.fetchedData?.areasData?.individualAreaStatus) {
        setIndividualAreaStatus(visitData.fetchedData.areasData.individualAreaStatus);
      }

      // Open the areas modal
      setIsAreasModalOpen(true);
    } catch (error) {
      console.error("Error fetching areas data:", error);
      alert("Failed to load areas data.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      let updatedValue: any = value;

      if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
        updatedValue = e.target.checked;
      }

      // Handle nested objects using type assertion
      if (name.includes('.')) {
        const [parent, child] = name.split('.') as [keyof FollowupVisitFormData, string];
        const currentParent = prev[parent];

        // Ensure the parent is an object before updating
        if (typeof currentParent === 'object' && currentParent !== null) {
           return {
            ...prev,
            [parent]: {
              ...currentParent as any,
              [child]: updatedValue
            }
          };
        }
        // If parent is not an object, return previous state
        return prev;

      } else {
        return { ...prev, [name as keyof FollowupVisitFormData]: updatedValue };
      }
    });
    
    // Set up auto-save
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer as any); // Cast to any for compatibility
    }
    
    const timer = setTimeout(() => {
      localStorage.setItem(`followupVisit_${id}`, JSON.stringify(formData));
      setAutoSaveStatus('Form auto-saved');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    }, 2000);
    
    setAutoSaveTimer(timer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.previousVisit) {
      alert('Please select a previous visit');
      return;
    }

    // Validate that required fields are present
    if (!id || !_user?._id) {
      alert('Missing required patient or doctor information');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 1. Save the visit data
      const {
        musclePalpationData,
        orthoTestsData,
        aromData,
        activitiesPainData,
        treatmentListData,
        imagingData,
        homeCareSuggestions
      } = formData.fetchedData || {};
      
      // Structure the data according to FollowupVisit schema
      const visitData = {
        // Required fields
        previousVisit: formData.previousVisit,
        patient: id,
        doctor: _user?._id,
        visitType: 'followup',
        
        // Basic form fields
        areas: formData.areas || 'Auto-generated from initial visit',
        areasImproving: formData.areasImproving || false,
        areasExacerbated: formData.areasExacerbated || false,
        areasSame: formData.areasSame || false,
        areasResolved: formData.areasResolved || false,
        
        // Areas data from modal
        areasData: formData.fetchedData?.areasData || {
          areasImproving: formData.areasImproving || false,
          areasExacerbated: formData.areasExacerbated || false,
          areasSame: formData.areasSame || false,
          areasResolved: formData.areasResolved || false,
          individualAreaStatus: individualAreaStatus || {},
          muscleTenderness: (formData.fetchedData?.areasData as any)?.muscleTenderness || {},
          muscleSpasm: (formData.fetchedData?.areasData as any)?.muscleSpasm || {}
        },

        
        // ROM data - now handled through AROM modal for each body part
        
        // Orthos data
        orthos: {
          tests: formData.orthos.tests || '',
          result: formData.orthos.result || ''
        },
        activitiesCausePain: formData.activitiesCausePain || '',
        activitiesCausePainOther: formData.activitiesCausePainOther || '',
        treatmentPlan: {
          treatments: formData.treatmentPlan.treatments || '',
          timesPerWeek: Object.keys(formData.treatmentPlan.frequency.timesPerWeek)
            .filter(key => formData.treatmentPlan.frequency.timesPerWeek[key as keyof typeof formData.treatmentPlan.frequency.timesPerWeek])
            .join(', ') || '',
          chiropractic: formData.treatmentPlan.chiropractic || false,
          acupuncture: formData.treatmentPlan.acupuncture || false,
          mechanicalTraction: formData.treatmentPlan.mechanicalTraction || false,
          myofascialRelease: formData.treatmentPlan.myofascialRelease || false,
          ultrasound: formData.treatmentPlan.ultrasound || false,
          infraredElectricMuscleStimulation: formData.treatmentPlan.infraredElectricMuscleStimulation || false,
          therapeuticExercise: formData.treatmentPlan.therapeuticExercise || false,
          neuromuscularReeducation: formData.treatmentPlan.neuromuscularReeducation || false,
          other: formData.treatmentPlan.other || ''
        },
        overallResponse: {
          improving: formData.overallResponse.improving || false,
          worse: formData.overallResponse.worse || false,
          same: formData.overallResponse.same || false
        },
        // referrals: Array.isArray(formData.referrals) ? formData.referrals.join(', ') : (formData.referrals || ''),
        diagnosticStudy: {
          study: formData.diagnosticStudy.study || '',
          bodyPart: formData.diagnosticStudy.bodyPart || '',
          result: formData.diagnosticStudy.result || ''
        },
        homeCare: {
          coreProgram: formData.homeCare.coreProgram || false,
          stretches: formData.homeCare.stretches || false,
          icePackHotPack: formData.homeCare.icePackHotPack || false,
          ligamentStabilityProgram: formData.homeCare.ligamentStabilityProgram || false,
          other: formData.homeCare.other || ''
        },
        notes: formData.notes || '',
        
        // Muscle Palpation Modal Data
        muscleStrength: Array.isArray(musclePalpationData?.muscleStrength) ? musclePalpationData.muscleStrength.join(', ') : (musclePalpationData?.muscleStrength || ''),
        strength: musclePalpationData?.strength || {},
        tenderness: musclePalpationData?.tenderness || {},
        spasm: musclePalpationData?.spasm || {},
        
        // Ortho Tests Modal Data
        ortho: orthoTestsData || {},
        arom: aromData || {},
        
        // Activities/Treatment Plan Modal Data
        chiropracticAdjustment: Array.isArray(activitiesPainData?.chiropracticAdjustment) ? activitiesPainData.chiropracticAdjustment.join(', ') : (activitiesPainData?.chiropracticAdjustment || ''),
        chiropracticOther: activitiesPainData?.chiropracticOther || '',
        acupuncture: Array.isArray(activitiesPainData?.acupuncture) ? activitiesPainData.acupuncture.join(', ') : (activitiesPainData?.acupuncture || ''),
        acupunctureOther: activitiesPainData?.acupunctureOther || '',
        physiotherapy: Array.isArray(activitiesPainData?.physiotherapy || imagingData?.physiotherapy) ? (activitiesPainData?.physiotherapy || imagingData?.physiotherapy || []).join(', ') : (activitiesPainData?.physiotherapy || imagingData?.physiotherapy || ''),
        rehabilitationExercises: Array.isArray(activitiesPainData?.rehabilitationExercises || imagingData?.rehabilitationExercises) ? (activitiesPainData?.rehabilitationExercises || imagingData?.rehabilitationExercises || []).join(', ') : (activitiesPainData?.rehabilitationExercises || imagingData?.rehabilitationExercises || ''),
        durationFrequency: activitiesPainData?.durationFrequency || imagingData?.durationFrequency || { timesPerWeek: '', reEvalInWeeks: '' },
        diagnosticUltrasound: activitiesPainData?.diagnosticUltrasound || '',
        disabilityDuration: activitiesPainData?.disabilityDuration || '',
        
        // Treatment List Modal Data
        nerveStudy: Array.isArray(treatmentListData?.nerveStudy) ? treatmentListData.nerveStudy.join(', ') : (treatmentListData?.nerveStudy || ''),
        restrictions: treatmentListData?.restrictions || { avoidActivityWeeks: '', liftingLimitLbs: '', avoidProlongedSitting: false },
        otherNotes: treatmentListData?.otherNotes || '',
        
        // Imaging and Referrals Modal Data
        referrals: Array.isArray(imagingData?.referrals) ? imagingData.referrals.join(', ') : (imagingData?.referrals || ''),
        imaging: {
          xray: Array.isArray(imagingData?.imaging?.xray) ? imagingData.imaging.xray.join(', ') : (imagingData?.imaging?.xray || ''),
          mri: Array.isArray(imagingData?.imaging?.mri) ? imagingData.imaging.mri.join(', ') : (imagingData?.imaging?.mri || ''),
          ct: Array.isArray(imagingData?.imaging?.ct) ? imagingData.imaging.ct.join(', ') : (imagingData?.imaging?.ct || '')
        },
        
        // Home Care AI Suggestions
        homeCareSuggestions: homeCareSuggestions || '',
        
        // Individual Area Status Data
        individualAreaStatus: individualAreaStatus || {},
        
        // Muscle Tenderness and Spasm from Areas Modal
        muscleTenderness: (formData.fetchedData?.areasData as any)?.muscleTenderness || {},
        muscleSpasm: (formData.fetchedData?.areasData as any)?.muscleSpasm || {},
      };
      
      // Final validation
      if (!visitData.previousVisit || !visitData.patient || !visitData.doctor) {
        alert('Missing required fields: previousVisit, patient, or doctor');
        return;
      }

      // Helper function to convert arrays to strings for database compatibility
      const convertArrayToString = (value: any) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      };

      console.log('Sending visit data:', visitData);
      console.log('Modal data summary:');
      console.log('- Muscle palpation data:', !!musclePalpationData);
      console.log('- Ortho tests data:', !!orthoTestsData);
      console.log('- AROM data:', !!aromData);
      console.log('- Activities pain data:', !!activitiesPainData);
      console.log('- Treatment list data:', !!treatmentListData);
      console.log('- Imaging data:', !!imagingData);
      console.log('- Home care suggestions:', !!homeCareSuggestions);
      
      // Debug activities pain data specifically
      if (activitiesPainData) {
        console.log('Activities pain data being saved:', activitiesPainData);
      }
      
      // Debug imaging data specifically
      if (imagingData) {
        console.log('Imaging data being saved:', imagingData);
      }
      
      // Debug orthopedic tests data specifically
      if (orthoTestsData) {
        console.log('Orthopedic tests data being saved:', orthoTestsData);
      }
      
      // Debug areas data specifically
      if (formData.fetchedData?.areasData) {
        console.log('Areas data being saved:', formData.fetchedData.areasData);
        console.log('- Individual area status:', formData.fetchedData.areasData.individualAreaStatus);
        console.log('- Muscle tenderness:', formData.fetchedData.areasData.muscleTenderness);
        console.log('- Muscle spasm:', formData.fetchedData.areasData.muscleSpasm);
      }
      
      const response = await axios.post(`https://emr-h.onrender.com/api/visits`, visitData);
      
      const savedVisitId = response.data.visit._id;

              // 2. Generate AI narrative
        try {
          // Get patient data
          const patientResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}`);
          const patient = patientResponse.data;
          
          // Get all visits for this patient
          const visitsResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`);
          const visits = visitsResponse.data;
          
          const aiResponse = await axios.post(`https://emr-h.onrender.com/api/ai/generate-narrative`, {
            patient,
            visits
        });

        if (aiResponse.data.success) {
          // 3. Update the visit with the AI narrative
          await axios.patch(`https://emr-h.onrender.com/api/visits/${savedVisitId}`, {
            aiNarrative: aiResponse.data.narrative
          });
        }
      } catch (aiError) {
        console.error('Error generating AI narrative:', aiError);
        // Continue with the form submission even if AI generation fails
      }

      // Clear local storage after successful submission
      localStorage.removeItem(`followupVisit_${id}`);
      
      // Show success message with data summary
      const dataSummary = [];
      if (formData.fetchedData?.areasData?.individualAreaStatus && Object.keys(formData.fetchedData.areasData.individualAreaStatus).length > 0) dataSummary.push('Areas individual status data');
      if (formData.fetchedData?.areasData?.muscleTenderness && Object.keys(formData.fetchedData.areasData.muscleTenderness).length > 0) dataSummary.push('Areas muscle tenderness data');
      if (formData.fetchedData?.areasData?.muscleSpasm && Object.keys(formData.fetchedData.areasData.muscleSpasm).length > 0) dataSummary.push('Areas muscle spasm data');
      if (formData.areasImproving || formData.areasExacerbated || formData.areasSame || formData.areasResolved) dataSummary.push('Areas status data');
      if (musclePalpationData) dataSummary.push('Muscle palpation data');
      if (orthoTestsData) dataSummary.push('Ortho tests data');
      if (aromData) dataSummary.push('AROM data');
      if (activitiesPainData) dataSummary.push('Activities pain data');
      if (treatmentListData) dataSummary.push('Treatment list data');
      if (imagingData) dataSummary.push('Imaging data');
      if (homeCareSuggestions) dataSummary.push('Home care suggestions');
      
      alert(`Visit saved successfully!\n\nModal data saved: ${dataSummary.length > 0 ? dataSummary.join(', ') : 'None'}`);
      
      navigate(`/patients/${id}`);
    } catch (error: any) {
      console.error('Error saving visit:', error);
      
      // Show more specific error messages
      if (error.response?.data?.errors) {
        const errorMessages = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.join('\n')
          : error.response.data.errors;
        alert(`Validation errors:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
      alert('Failed to save visit. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">Patient not found</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </button>
      </div>
    );
  }

  // Show loading state while fetching data
  if (isLoading || !hasLoadedVisits) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/patients/${id}`)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">EXAM FORM---REEVALUATION</h1>
          <p className="text-gray-600">
            Patient: {patient.firstName} {patient.lastName}
          </p>
          <p className="text-gray-600">
            Date: {new Date().toLocaleDateString()}
          </p>
        </div>
        {formData.previousVisit && (
          <button
            type="button"
            onClick={() => fetchInitialVisitData(formData.previousVisit)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md ml-4"
          >
            View Initial Visit Data
          </button>
        )}
      </div>
{/* Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    {/* Modal */}
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-2xl font-semibold text-gray-800">Initial Visit Data</h3>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Displaying Initial Visit Data */}
      <div className="space-y-6">

        {/* Displaying Chief Complaint */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Chief Complaint:</h4>
          <p className="text-gray-700">{initialVisitData?.chiefComplaint || 'N/A'}</p>
        </div>

        {/* Displaying Vitals */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Vitals:</h4>
          <div className="grid grid-cols-2 gap-4">
            <p><span className="font-medium">Height:</span> {initialVisitData?.vitals?.height || 'N/A'}</p>
            <p><span className="font-medium">Weight:</span> {initialVisitData?.vitals?.weight || 'N/A'}</p>
            <p><span className="font-medium">Temperature:</span> {initialVisitData?.vitals?.temp || 'N/A'}</p>
            <p><span className="font-medium">Blood Pressure:</span> {initialVisitData?.vitals?.bp || 'N/A'}</p>
            <p><span className="font-medium">Pulse:</span> {initialVisitData?.vitals?.pulse || 'N/A'}</p>
          </div>
        </div>

        {/* Displaying Grip Strength */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Grip Strength:</h4>
          <div className="grid grid-cols-2 gap-4">
            {['right1', 'right2', 'right3', 'left1', 'left2', 'left3'].map((key, idx) => (
              <p key={idx}><span className="font-medium">{key.replace('right', 'Right Hand').replace('left', 'Left Hand')}:</span> {initialVisitData?.grip?.[key] || 'N/A'}</p>
            ))}
          </div>
        </div>

        {/* Displaying Appearance */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Appearance:</h4>
          <p className="text-gray-700">{initialVisitData?.appearance?.length > 0 ? initialVisitData.appearance.join(', ') : 'N/A'}</p>
        </div>

        {/* Displaying Posture */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Posture:</h4>
          <p className="text-gray-700">{initialVisitData?.posture?.length > 0 ? initialVisitData.posture.join(', ') : 'N/A'}</p>
        </div>

        {/* Displaying Gait */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Gait:</h4>
          <p className="text-gray-700">{initialVisitData?.gait?.length > 0 ? initialVisitData.gait.join(', ') : 'N/A'}</p>
        </div>

        {/* Displaying Strength */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Strength:</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(initialVisitData?.strength || {}).map((key) => {
              const strengthValue = initialVisitData?.strength?.[key];
              if (typeof strengthValue === 'object' && strengthValue !== null) {
                return (
                  <div key={key} className="col-span-2">
                    <p><span className="font-medium">{key}:</span></p>
                    <div className="ml-4">
                      <p><span className="font-medium">Right:</span> {strengthValue.right || 'N/A'}</p>
                      <p><span className="font-medium">Left:</span> {strengthValue.left || 'N/A'}</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <p key={key}><span className="font-medium">{key}:</span> {strengthValue || 'N/A'}</p>
                );
              }
            })}
          </div>
        </div>

        {/* Displaying Range of Motion (ROM) */}
        <div className="section">
  <h4 className="font-semibold text-lg text-gray-800 mb-2">Range of Motion (ROM):</h4>
  {initialVisitData?.arom ? (
    Object.keys(initialVisitData.arom).map((region) => (
      <div key={region} className="mb-6">
        <h5 className="font-semibold text-md text-gray-700 mb-4">{region}</h5>
        
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2 text-left text-sm font-medium text-gray-700">Movement</th>
              <th className="border-b p-2 text-left text-sm font-medium text-gray-700">Left</th>
              <th className="border-b p-2 text-left text-sm font-medium text-gray-700">Right</th>
              <th className="border-b p-2 text-left text-sm font-medium text-gray-700">Ligament Laxity</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(initialVisitData.arom[region]).map(([movement, movementData]) => {
              const data = movementData as { left?: string; right?: string; ligLaxity?: string };
              return (
              <tr key={movement}>
                <td className="border-b p-2 text-sm text-gray-600">{movement}</td>
                  <td className="border-b p-2 text-sm text-gray-600">{data.left || 'N/A'}</td>
                  <td className="border-b p-2 text-sm text-gray-600">{data.right || 'N/A'}</td>
                  <td className="border-b p-2 text-sm text-gray-600">{data.ligLaxity || 'N/A'}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ))
  ) : (
    <p className="text-gray-700">N/A</p>
  )}
</div>


        {/* Displaying Orthopedic Tests */}
        <div className="section">
  <h4 className="font-semibold text-lg text-gray-800 mb-4">Orthopedic Tests:</h4>
  {initialVisitData?.ortho ? (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border-b p-4 text-left text-sm font-medium text-gray-700">Test</th>
            <th className="border-b p-4 text-left text-sm font-medium text-gray-700">Left</th>
            <th className="border-b p-4 text-left text-sm font-medium text-gray-700">Right</th>
            <th className="border-b p-4 text-left text-sm font-medium text-gray-700">Ligament Laxity</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(initialVisitData.ortho).map((test) => (
            <tr key={test}>
              <td className="border-b p-4 text-sm text-gray-600">{test} (Left)</td>
              <td className="border-b p-4 text-sm text-gray-600">{initialVisitData.ortho[test].left || 'N/A'}</td>
              <td className="border-b p-4 text-sm text-gray-600">{initialVisitData.ortho[test].right || 'N/A'}</td>
              <td className="border-b p-4 text-sm text-gray-600">{initialVisitData.ortho[test].ligLaxity || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>N/A</p>
  )}
</div>



        {/* Displaying Tenderness */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-3">Tenderness:</h4>
          {initialVisitData?.tenderness ? (
            <div className="space-y-3">
              {Object.entries(initialVisitData.tenderness).map(([region, labels]) => {
                const displayLabels = Array.isArray(labels) ? labels : [labels];
                
                return (
                  <div key={region} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h5 className="font-semibold text-gray-800 text-base mr-3">{region}:</h5>
                          <span className="text-sm text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                            {Array.isArray(displayLabels) ? displayLabels.join(', ') : displayLabels}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">N/A</p>
          )}
        </div>

        {/* Displaying Spasm */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-3">Spasm:</h4>
          {initialVisitData?.spasm ? (
            <div className="space-y-3">
              {Object.entries(initialVisitData.spasm).map(([region, labels]) => {
                const displayLabels = Array.isArray(labels) ? labels : [labels];
                
                return (
                  <div key={region} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h5 className="font-semibold text-gray-800 text-base mr-3">{region}:</h5>
                          <span className="text-sm text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                            {Array.isArray(displayLabels) ? displayLabels.join(', ') : displayLabels}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">N/A</p>
          )}

        </div>

        {/* Displaying Lumbar Touching Toes Movement */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Lumbar Touching Toes Movement:</h4>
          {initialVisitData?.lumbarTouchingToesMovement ? (
            Object.keys(initialVisitData.lumbarTouchingToesMovement).map((movement) => (
              <p key={movement}>
                <span className="font-medium">{movement}:</span> {initialVisitData.lumbarTouchingToesMovement[movement] ? 'Yes' : 'No'}
              </p>
            ))
          ) : (
            <p>N/A</p>
          )}
        </div>

        {/* Displaying Cervical AROM Checkmarks */}
        <div className="section">
          <h4 className="font-semibold text-lg text-gray-800 mb-2">Cervical AROM Checkmarks:</h4>
          {initialVisitData?.cervicalAROMCheckmarks ? (
            Object.keys(initialVisitData.cervicalAROMCheckmarks).map((checkmark) => (
              <p key={checkmark}>
                <span className="font-medium">{checkmark}:</span> {initialVisitData.cervicalAROMCheckmarks[checkmark] ? 'Yes' : 'No'}
              </p>
            ))
          ) : (
            <p>N/A</p>
          )}
        </div>

      </div>

      {/* Close Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setIsModalOpen(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}




      {localFormData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have an unsaved form. Would you like to continue where you left off?
              </p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    setFormData(JSON.parse(localFormData));
                    setLocalFormData(null);
                  }}
                  className="mr-2 text-sm font-medium text-yellow-700 hover:text-yellow-600"
                >
                  Load saved form
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(`followupVisit_${id}`);
                    setLocalFormData(null);
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {autoSaveStatus && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-md shadow-md">
          {autoSaveStatus}
        </div>
      )}

      {/* Data Summary */}
      {(musclePalpationData || orthoTestsData || activitiesPainData || treatmentListData || imagingData || homeCareSuggestions || formData.areasImproving || formData.areasExacerbated || formData.areasSame || formData.areasResolved) && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700 font-medium">Loaded Data Summary:</p>
              <div className="mt-2 text-xs text-blue-600">
                {(formData.areasImproving || formData.areasExacerbated || formData.areasSame || formData.areasResolved) && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Areas Status ✓</span>}
                {musclePalpationData && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Muscle Palpation ✓</span>}
                {orthoTestsData && Object.keys(orthoTestsData).length > 0 && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Ortho Tests ✓</span>}
                {activitiesPainData && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Activities Pain ✓</span>}
                {treatmentListData && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Treatment List ✓</span>}
                {imagingData && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Imaging ✓</span>}
                {homeCareSuggestions && <span className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">Home Care ✓</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 relative">
        <div className="space-y-6">
          {/* Previous Visit Selection */}
<div className="mb-6">
  <label htmlFor="previousVisit" className="block text-sm font-medium text-gray-700 mb-1">
    Previous Visit
  </label>
  <select
    id="previousVisit"
    name="previousVisit"
    value={formData.previousVisit}
    onChange={handleChange}
    required
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    disabled={previousVisits.length === 0}
  >
    <option value="">
      {previousVisits.length > 0 
        ? "Select previous visit" 
        : "No visits found"}
    </option>

    {/* Dynamically render all visit types */}
    {previousVisits.map((visit) => (
      <option key={visit._id} value={visit._id}>
        {visit.__t || visit.visitType || 'Visit'} - {new Date(visit.date).toLocaleDateString()}
      </option>
    ))}
  </select>

  {/* If no visits, show CTA to create initial visit */}
  {previousVisits.length === 0 && (
    <div className="mt-4 flex items-center">
      <p className="text-sm text-gray-600 mr-4">
        Please create an initial visit first.
      </p>
      <button
        onClick={() => navigate(`/patients/${id}/visits/initial`)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create Initial Visit
      </button>
    </div>
  )}
</div>


          {/* Areas */}
          <div>
            <button
              type="button"
              onClick={() => fetchAreasData(formData.previousVisit)}
              className={`bg-white font-medium underline focus:outline-none mb-4 ${
                (formData.fetchedData?.areasData?.individualAreaStatus && Object.keys(formData.fetchedData.areasData.individualAreaStatus).length > 0) ||
                (formData.fetchedData?.areasData?.muscleTenderness && Object.keys(formData.fetchedData.areasData.muscleTenderness).length > 0) ||
                (formData.fetchedData?.areasData?.muscleSpasm && Object.keys(formData.fetchedData.areasData.muscleSpasm).length > 0) ||
                formData.areasImproving || formData.areasExacerbated || formData.areasSame || formData.areasResolved ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Areas: Auto generated from Initial {((formData.fetchedData?.areasData?.individualAreaStatus && Object.keys(formData.fetchedData.areasData.individualAreaStatus).length > 0) ||
                (formData.fetchedData?.areasData?.muscleTenderness && Object.keys(formData.fetchedData.areasData.muscleTenderness).length > 0) ||
                (formData.fetchedData?.areasData?.muscleSpasm && Object.keys(formData.fetchedData.areasData.muscleSpasm).length > 0) ||
                formData.areasImproving || formData.areasExacerbated || formData.areasSame || formData.areasResolved) && '✓'}
            </button>


          </div>


{isMuscleModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Muscle Palpation Data</h3>
        <button
          onClick={() => setIsMuscleModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Displaying muscle palpation data */}
      <div className="bg-gray-50 p-4 rounded-md space-y-6">
        {/* Muscle Strength */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-lg text-gray-800">Muscle Strength:</h4>
            <button
              type="button"
              onClick={handleAddMuscleStrength}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
          {editableMuscleStrength.muscleStrength.length > 0 ? (
            <div className="space-y-2">
              {editableMuscleStrength.muscleStrength.map((strength: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => handleMuscleStrengthChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter muscle strength description..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMuscleStrength(index)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No muscle strength items. Click "Add Item" to add one.</p>
          )}
        </div>

        {/* Strength */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-lg text-gray-800">Strength:</h4>
            <button
              type="button"
              onClick={handleAddStrengthKey}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Strength Key
            </button>
          </div>
          {Object.keys(editableMuscleStrength.strength).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(editableMuscleStrength.strength).map(([key, value]) => {
                const strengthValue = typeof value === 'object' && value !== null ? value : { right: '', left: '' };
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">{key}:</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStrengthKey(key)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Right:</label>
                        <input
                          type="text"
                          value={strengthValue.right || ''}
                          onChange={(e) => handleStrengthChange(key, 'right', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5/5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Left:</label>
                        <input
                          type="text"
                          value={strengthValue.left || ''}
                          onChange={(e) => handleStrengthChange(key, 'left', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5/5"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">No strength keys. Click "Add Strength Key" to add one.</p>
          )}
        </div>

        {/* Tenderness */}
        <div>
          <h4 className="font-bold text-lg text-gray-800 mb-3">Tenderness:</h4>
          <div className="space-y-4">
            {/* Cervical Region */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-800 text-base mb-3">Cervical:</h5>
              <div className="space-y-4">
                {/* Sub Occipital */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Sub Occipital:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-cervical-suboccipital-${severity}`}
                          checked={muscleTendernessSelections.cervical?.subOccipital?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('cervical', 'subOccipital', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-cervical-suboccipital-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scalene */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Scalene:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-cervical-scalene-${severity}`}
                          checked={muscleTendernessSelections.cervical?.scalene?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('cervical', 'scalene', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-cervical-scalene-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SCM */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">SCM:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-cervical-scm-${severity}`}
                          checked={muscleTendernessSelections.cervical?.scm?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('cervical', 'scm', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-cervical-scm-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Thoracic Region */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-800 text-base mb-3">Thoracic:</h5>
              <div className="space-y-4">
                {/* Facets */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Facets:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-thoracic-facets-${severity}`}
                          checked={muscleTendernessSelections.thoracic?.facets?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('thoracic', 'facets', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-thoracic-facets-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trapezius */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Trapezius:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-thoracic-trapezius-${severity}`}
                          checked={muscleTendernessSelections.thoracic?.trapezius?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('thoracic', 'trapezius', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-thoracic-trapezius-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lumbar Region */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-800 text-base mb-3">Lumbar:</h5>
              <div className="space-y-4">
                {/* Facets */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Facets:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-lumbar-facets-${severity}`}
                          checked={muscleTendernessSelections.lumbar?.facets?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('lumbar', 'facets', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-lumbar-facets-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QL */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">QL:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tenderness-lumbar-ql-${severity}`}
                          checked={muscleTendernessSelections.lumbar?.ql?.includes(severity) || false}
                          onChange={(e) => handleMuscleTendernessChange('lumbar', 'ql', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`tenderness-lumbar-ql-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spasm */}
        <div>
          <h4 className="font-bold text-lg text-gray-800 mb-3">Spasm:</h4>
          <div className="space-y-4">
            {/* Cervical Region */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-800 text-base mb-3">Cervical:</h5>
              <div className="space-y-4">
                {/* Sub Occipital */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Sub Occipital:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-cervical-suboccipital-${severity}`}
                          checked={muscleSpasmSelections.cervical?.subOccipital?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('cervical', 'subOccipital', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-cervical-suboccipital-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scalene */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Scalene:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-cervical-scalene-${severity}`}
                          checked={muscleSpasmSelections.cervical?.scalene?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('cervical', 'scalene', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-cervical-scalene-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SCM */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">SCM:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-cervical-scm-${severity}`}
                          checked={muscleSpasmSelections.cervical?.scm?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('cervical', 'scm', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-cervical-scm-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Thoracic Region */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-800 text-base mb-3">Thoracic:</h5>
              <div className="space-y-4">
                {/* Facets */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Facets:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-thoracic-facets-${severity}`}
                          checked={muscleSpasmSelections.thoracic?.facets?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('thoracic', 'facets', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-thoracic-facets-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trapezius */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Trapezius:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-thoracic-trapezius-${severity}`}
                          checked={muscleSpasmSelections.thoracic?.trapezius?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('thoracic', 'trapezius', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-thoracic-trapezius-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lumbar Region */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-800 text-base mb-3">Lumbar:</h5>
              <div className="space-y-4">
                {/* Facets */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Facets:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-lumbar-facets-${severity}`}
                          checked={muscleSpasmSelections.lumbar?.facets?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('lumbar', 'facets', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-lumbar-facets-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QL */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">QL:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Mild to moderate', 'Moderate', 'Moderate to severe', 'Severe', 'Resolved'].map((severity) => (
                      <div key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spasm-lumbar-ql-${severity}`}
                          checked={muscleSpasmSelections.lumbar?.ql?.includes(severity) || false}
                          onChange={(e) => handleMuscleSpasmChange('lumbar', 'ql', severity, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`spasm-lumbar-ql-${severity}`} className="ml-2 text-xs text-gray-600">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleSaveMusclePalpation}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
        >
          Save
        </button>
        <button
          onClick={() => setIsMuscleModalOpen(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}






          {/* Orthos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orthos:</label>
            <button
  type="button"
  onClick={() => fetchOrthoTestsData(formData.previousVisit)}
  className={`bg-white font-medium underline focus:outline-none ${
    orthoTestsData && Object.keys(orthoTestsData).length > 0 ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
  }`}
>
List of tests specific for body part {orthoTestsData && Object.keys(orthoTestsData).length > 0 && '✓'}
</button>
{isOrthoModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Orthopedic Tests Data</h3>
        <button
          onClick={() => setIsOrthoModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Displaying Orthopedic Test Data */}
      <div className="bg-gray-50 p-4 rounded-md space-y-6">
        {/* Orthopedic Tests */}
        <div>
          <h4 className="font-bold text-lg text-gray-800 mb-2">Orthopedic Tests:</h4>
          {Object.entries(orthoTestsData as Record<string, any>).length > 0 ? (
            Object.entries(orthoTestsData as Record<string, any>).map(([region, tests]) => (
              <div key={region} className="mb-6">
                <h5 className="font-semibold text-lg text-gray-800 mb-4">{region}</h5>
                
                {/* Column Headers */}
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="font-semibold text-sm text-gray-700"></div>
                  <div className="font-semibold text-sm text-gray-700 text-center">Left</div>
                  <div className="font-semibold text-sm text-gray-700 text-center">Right</div>
                  <div className="font-semibold text-sm text-gray-700 text-center">Bilateral</div>
                </div>
                
                {/* Test Results */}
                {Object.entries(tests as Record<string, any>).map(([testName, testResult]) => (
                  <div key={testName} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-gray-200">
                      {/* Test Name */}
                    <div className="font-medium text-gray-600">{testName}</div>
                      
                    {/* Left Result */}
                    <div className="flex items-center justify-center space-x-2">
                        <input
                          type="text"
                        value={(testResult as any).left === 'N/A' || (testResult as any).left === null || (testResult as any).left === undefined ? '' : (testResult as any).left || ''}
                          readOnly
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none text-center bg-gray-100"
                        placeholder=""
                      />
                      <input
                        type="checkbox"
                        checked={orthoTestSelections[region]?.[testName]?.left || false}
                        onChange={(e) => handleOrthoTestChange(region, testName, 'left', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Right Result */}
                    <div className="flex items-center justify-center space-x-2">
                        <input
                          type="text"
                        value={(testResult as any).right === 'N/A' || (testResult as any).right === null || (testResult as any).right === undefined ? '' : (testResult as any).right || ''}
                          readOnly
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none text-center bg-gray-100"
                        placeholder=""
                      />
                      <input
                        type="checkbox"
                        checked={orthoTestSelections[region]?.[testName]?.right || false}
                        onChange={(e) => handleOrthoTestChange(region, testName, 'right', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Bilateral Result */}
                    <div className="flex items-center justify-center space-x-2">
                        <input
                          type="text"
                        value={(testResult as any).bilateral === 'N/A' || (testResult as any).bilateral === null || (testResult as any).bilateral === undefined ? '' : (testResult as any).bilateral || ''}
                          readOnly
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none text-center bg-gray-100"
                        placeholder=""
                      />
                      <input
                        type="checkbox"
                        checked={orthoTestSelections[region]?.[testName]?.bilateral || false}
                        onChange={(e) => handleOrthoTestChange(region, testName, 'bilateral', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-gray-600">No orthopedic test data available.</p>
          )}
        </div>
      </div>

      {/* Close Button */}
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleSaveOrthoTests}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
        >
          Save
        </button>
        <button
          onClick={() => setIsOrthoModalOpen(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
              <div>
                 <label htmlFor="orthos.result" className="block text-xs text-gray-500 mb-1">Result</label>
                 <input
                  type="text"
                  id="orthos.result"
                  name="orthos.result"
                  value={formData.orthos.result}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Activities that still cause pain */}
          <div>
          <button
  type="button"
              onClick={handleActivitiesModalOpen}
  className={`bg-white font-medium underline focus:outline-none mt-2 ${
                formData.activitiesCausePain ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              List of activities that still cause pain: {formData.activitiesCausePain && '✓'}
        </button>
      </div>


      {/* Data Summary */}
      {activitiesPainData && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-blue-800 mb-2">Loaded Data Summary:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {editableActivitiesPainData.chiropracticAdjustment.length > 0 && (
              <div>• Chiropractic Adjustments: {editableActivitiesPainData.chiropracticAdjustment.length} items</div>
            )}
            {editableActivitiesPainData.acupuncture.length > 0 && (
              <div>• Acupuncture: {editableActivitiesPainData.acupuncture.length} items</div>
            )}
            {editableActivitiesPainData.physiotherapy.length > 0 && (
              <div>• Physiotherapy: {editableActivitiesPainData.physiotherapy.length} items</div>
            )}
            {editableActivitiesPainData.rehabilitationExercises.length > 0 && (
              <div>• Rehabilitation Exercises: {editableActivitiesPainData.rehabilitationExercises.length} items</div>
            )}
            {editableActivitiesPainData.chiropracticOther && (
              <div>• Chiropractic Other: {editableActivitiesPainData.chiropracticOther}</div>
            )}
            {editableActivitiesPainData.acupunctureOther && (
              <div>• Acupuncture Other: {editableActivitiesPainData.acupunctureOther}</div>
            )}
            {editableActivitiesPainData.diagnosticUltrasound && (
              <div>• Diagnostic Ultrasound: {editableActivitiesPainData.diagnosticUltrasound}</div>
            )}
            {editableActivitiesPainData.disabilityDuration && (
              <div>• Disability Duration: {editableActivitiesPainData.disabilityDuration}</div>
            )}
            {(!editableActivitiesPainData.chiropracticAdjustment.length && 
              !editableActivitiesPainData.acupuncture.length && 
              !editableActivitiesPainData.physiotherapy.length && 
              !editableActivitiesPainData.rehabilitationExercises.length && 
              !editableActivitiesPainData.chiropracticOther && 
              !editableActivitiesPainData.acupunctureOther && 
              !editableActivitiesPainData.diagnosticUltrasound && 
              !editableActivitiesPainData.disabilityDuration) && (
              <div className="text-yellow-700">• No previous data found - starting with empty form</div>
            )}
          </div>
        </div>
      )}



                 <div>
                    <label htmlFor="activitiesCausePainOther" className="block text-xs text-gray-500 mb-1">Other:</label>
                    <input
                      type="text"
                      id="activitiesCausePainOther"
                      name="activitiesCausePainOther"
                      value={formData.activitiesCausePainOther}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
       

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">ASSESSMENT AND PLAN</h2>

          {/* Treatment plan */}
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment plan:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <button
  type="button"
  onClick={() => fetchTreatmentListData(formData.previousVisit)}
  className={`bg-white font-medium underline focus:outline-none mt-2 ${
    treatmentListData ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
  }`}
>
  List of treatments {treatmentListData && '✓'}
</button>
{isTreatmentModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        {/* <h3 className="text-xl font-semibold text-gray-800">Complete Treatment Plan</h3> */}
        <button
          onClick={() => setIsTreatmentModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6 text-sm text-gray-700">
        <h4 className="font-semibold text-lg text-gray-800 mb-4">TREATMENT PLAN</h4>
        
        {/* Chiropractic Adjustment */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Chiropractic Adjustment</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-800">
            {[
              'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Sacroiliac Spine',
              'Hip R / L', 'Knee (Patella) R / L', 'Ankle R / L',
              'Shoulder (GHJ) R / L', 'Elbow R / L', 'Wrist Carpals R / L'
            ].map(item => (
              <label key={item} className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.chiropracticAdjustment?.includes(item) || false}
                  onChange={() => {
                    const currentArray = treatmentListData.chiropracticAdjustment || [];
                    if (currentArray.includes(item)) {
                      setTreatmentListData(prev => ({
                        ...prev,
                        chiropracticAdjustment: currentArray.filter(i => i !== item)
                      }));
                    } else {
                      setTreatmentListData(prev => ({
                        ...prev,
                        chiropracticAdjustment: [...currentArray, item]
                      }));
                    }
                  }}
                />
                {item}
            </label>
            ))}
          </div>
          <div className="mt-2">
            <label className="text-sm text-gray-700 mr-2">Other:</label>
            <input
              type="text"
              value={treatmentListData.chiropracticOther || ''}
              onChange={(e) => setTreatmentListData(prev => ({
                ...prev,
                chiropracticOther: e.target.value
              }))}
              className="border px-2 py-1 rounded w-1/2"
              placeholder="_______________________________"
            />
          </div>
          </div>

        {/* Acupuncture (Cupping) */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Acupuncture (Cupping)</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-800">
            {[
              'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Sacroiliac Spine',
              'Hip R / L', 'Knee (Patella) R / L', 'Ankle R / L',
              'Shoulder (GHJ) R / L', 'Elbow R / L', 'Wrist Carpals R / L'
            ].map(item => (
              <label key={item} className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.acupuncture?.includes(item) || false}
                  onChange={() => {
                    const currentArray = treatmentListData.acupuncture || [];
                    if (currentArray.includes(item)) {
                      setTreatmentListData(prev => ({
                        ...prev,
                        acupuncture: currentArray.filter(i => i !== item)
                      }));
                    } else {
                      setTreatmentListData(prev => ({
                        ...prev,
                        acupuncture: [...currentArray, item]
                      }));
                    }
                  }}
                />
                {item}
            </label>
            ))}
          </div>
          <div className="mt-2">
            <label className="text-sm text-gray-700 mr-2">Other:</label>
            <input
              type="text"
              value={treatmentListData.acupunctureOther || ''}
              onChange={(e) => setTreatmentListData(prev => ({
                ...prev,
                acupunctureOther: e.target.value
              }))}
              className="border px-2 py-1 rounded w-1/2"
              placeholder="_______________________________"
            />
          </div>
          </div>

        {/* Physiotherapy */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Physiotherapy</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Hot Pack/Cold Pack', 'Ultrasound', 'EMS', 'E-Stim', 'Therapeutic Exercises', 'NMR', 'Orthion Bed', 'Mechanical Traction', 'Paraffin Wax', 'Infrared'].map(item => (
              <label key={item} className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.physiotherapy?.includes(item) || false} 
                  onChange={() => {
                    const currentArray = treatmentListData.physiotherapy || [];
                    if (currentArray.includes(item)) {
                      setTreatmentListData(prev => ({
                        ...prev,
                        physiotherapy: currentArray.filter(i => i !== item)
                      }));
                    } else {
                      setTreatmentListData(prev => ({
                        ...prev,
                        physiotherapy: [...currentArray, item]
                      }));
                    }
                  }} 
                />
                {item}
            </label>
            ))}
          </div>
          </div>

        {/* Rehabilitation Exercises */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Rehabilitation Exercises</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {treatmentListData.chiropracticAdjustment?.map(item => (
              <label key={item + '-rehab'} className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.rehabilitationExercises?.includes(item) || false} 
                  onChange={() => {
                    const currentArray = treatmentListData.rehabilitationExercises || [];
                    if (currentArray.includes(item)) {
                      setTreatmentListData(prev => ({
                        ...prev,
                        rehabilitationExercises: currentArray.filter(i => i !== item)
                      }));
                    } else {
                      setTreatmentListData(prev => ({
                        ...prev,
                        rehabilitationExercises: [...currentArray, item]
                      }));
                    }
                  }} 
                />
                {item}
            </label>
            ))}
          </div>
          </div>

        {/* Duration & Re-Evaluation */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Duration & Re-Evaluation</h5>
          <div className="flex flex-wrap gap-4">
            <label>
              Times per Week:
              <input 
                type="number" 
                value={treatmentListData.durationFrequency?.timesPerWeek || ''} 
                onChange={(e) => setTreatmentListData(prev => ({
                  ...prev,
                  durationFrequency: {
                    ...prev.durationFrequency,
                    timesPerWeek: e.target.value
                  }
                }))} 
                className="ml-2 border px-2 py-1 rounded" 
              />
            </label>
            <label>
              Re-Evaluation in Weeks:
              <input 
                type="number" 
                value={treatmentListData.durationFrequency?.reEvalInWeeks || ''} 
                onChange={(e) => setTreatmentListData(prev => ({
                  ...prev,
                  durationFrequency: {
                    ...prev.durationFrequency,
                    reEvalInWeeks: e.target.value
                  }
                }))} 
                className="ml-2 border px-2 py-1 rounded" 
              />
            </label>
          </div>
        </div>

        {/* Referrals */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Referrals</h5>
          <div className="flex flex-wrap gap-4">
            {['Orthopedist', 'Neurologist', 'Pain Management'].map(item => (
              <label key={item} className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.referrals?.includes(item) || false} 
                  onChange={() => {
                    const currentArray = treatmentListData.referrals || [];
                    if (currentArray.includes(item)) {
                      setTreatmentListData(prev => ({
                        ...prev,
                        referrals: currentArray.filter(i => i !== item)
                      }));
                    } else {
                      setTreatmentListData(prev => ({
                        ...prev,
                        referrals: [...currentArray, item]
                      }));
                    }
                  }} 
                />
                {item}
            </label>
            ))}
          </div>
          </div>

        {/* Imaging (X-Ray, MRI, CT) */}
        {['xray', 'mri', 'ct'].map(modality => (
          <div key={modality}>
            <h5 className="font-semibold text-gray-800 mb-3">{modality.toUpperCase()}</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['C/S', 'T/S', 'L/S', 'Sacroiliac Joint R', 'Sacroiliac Joint L', 'Hip R', 'Hip L', 'Knee R', 'Knee L', 'Ankle R', 'Ankle L', 'Shoulder R', 'Shoulder L', 'Elbow R', 'Elbow L', 'Wrist R', 'Wrist L'].map(region => (
                <label key={`${modality}-${region}`} className="flex items-center gap-2">
            <input
              type="checkbox"
                    checked={treatmentListData.imaging?.[modality as keyof typeof treatmentListData.imaging]?.includes(region) || false} 
                    onChange={() => {
                      const currentArray = treatmentListData.imaging?.[modality as keyof typeof treatmentListData.imaging] || [];
                      if (currentArray.includes(region)) {
                        setTreatmentListData(prev => ({
                          ...prev,
                          imaging: {
                            ...prev.imaging,
                            [modality]: currentArray.filter(item => item !== region)
                          }
                        }));
                      } else {
                        setTreatmentListData(prev => ({
                          ...prev,
                          imaging: {
                            ...prev.imaging,
                            [modality]: [...currentArray, region]
                          }
                        }));
                      }
                    }} 
                  />
                  {region}
            </label>
              ))}
          </div>
          </div>
        ))}

        {/* Diagnostic Ultrasound */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Diagnostic Ultrasound</h5>
          <textarea 
            value={treatmentListData.diagnosticUltrasound || ''} 
            onChange={(e) => setTreatmentListData(prev => ({
              ...prev,
              diagnosticUltrasound: e.target.value
            }))} 
            rows={2} 
            className="w-full border rounded px-3 py-2" 
            placeholder="Enter area of ultrasound" 
          />
        </div>

        {/* Nerve Study */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Nerve Study</h5>
          <div className="flex gap-6">
            {['EMG/NCV upper', 'EMG/NCV lower'].map(test => (
              <label key={test} className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.nerveStudy?.includes(test) || false} 
                  onChange={() => {
                    const currentArray = treatmentListData.nerveStudy || [];
                    if (currentArray.includes(test)) {
                      setTreatmentListData(prev => ({
                        ...prev,
                        nerveStudy: currentArray.filter(item => item !== test)
                      }));
                    } else {
                      setTreatmentListData(prev => ({
                        ...prev,
                        nerveStudy: [...currentArray, test]
                      }));
                    }
                  }} 
                />
                {test}
            </label>
            ))}
          </div>
          </div>

        {/* Restrictions */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Restrictions</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avoid Activity (Weeks):</label>
              <input
                type="text"
                value={treatmentListData.restrictions?.avoidActivityWeeks || ''}
                onChange={(e) => setTreatmentListData(prev => ({
                  ...prev,
                  restrictions: {
                    ...prev.restrictions,
                    avoidActivityWeeks: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifting Limit (lbs):</label>
              <input
                type="text"
                value={treatmentListData.restrictions?.liftingLimitLbs || ''}
                onChange={(e) => setTreatmentListData(prev => ({
                  ...prev,
                  restrictions: {
                    ...prev.restrictions,
                    liftingLimitLbs: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 20"
              />
            </div>
          <div className="flex items-center">
              <label className="flex items-center gap-2">
            <input
              type="checkbox"
                  checked={treatmentListData.restrictions?.avoidProlongedSitting || false}
                  onChange={(e) => setTreatmentListData(prev => ({
                    ...prev,
                    restrictions: {
                      ...prev.restrictions,
                      avoidProlongedSitting: e.target.checked
                    }
                  }))}
                />
                Avoid Prolonged Sitting
            </label>
            </div>
          </div>
        </div>

        {/* Disability Duration */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Disability Duration</h5>
          <input
            type="text"
            value={treatmentListData.disabilityDuration || ''}
            onChange={(e) => setTreatmentListData(prev => ({
              ...prev,
              disabilityDuration: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 4 weeks"
          />
        </div>

        {/* Other Notes */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">Other Notes</h5>
          <textarea
            value={treatmentListData.otherNotes || ''}
            onChange={(e) => setTreatmentListData(prev => ({
              ...prev,
              otherNotes: e.target.value
            }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter any additional notes..."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleSaveTreatmentListData}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
        >
          Save Treatment Plan
        </button>
        <button
          onClick={() => setIsTreatmentModalOpen(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}



              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency:</label>
                <div className="space-y-4">
                  {/* Times per week */}
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-700">Times per week:</span>
                      {['4x', '3x', '2x', '1x'].map((times) => (
                        <div key={times} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`frequency-timesPerWeek-${times}`}
                            checked={formData.treatmentPlan.frequency.timesPerWeek[times as keyof typeof formData.treatmentPlan.frequency.timesPerWeek]}
                            onChange={(e) => handleFrequencyChange('timesPerWeek', times, e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`frequency-timesPerWeek-${times}`} className="ml-2 text-sm text-gray-700">
                            {times}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-700">Duration:</span>
                      {['4 wks', '6 wks'].map((duration) => (
                        <div key={duration} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`frequency-duration-${duration}`}
                            checked={typeof formData.treatmentPlan.frequency.duration[duration as keyof typeof formData.treatmentPlan.frequency.duration] === 'boolean' ? formData.treatmentPlan.frequency.duration[duration as keyof typeof formData.treatmentPlan.frequency.duration] as boolean : false}
                            onChange={(e) => handleFrequencyChange('duration', duration, e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`frequency-duration-${duration}`} className="ml-2 text-sm text-gray-700">
                            {duration}
                          </label>
                        </div>
                      ))}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={formData.treatmentPlan.frequency.duration.custom}
                          onChange={(e) => handleFrequencyCustomChange('duration', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="___"
                        />
                        <span className="ml-1 text-sm text-gray-700">weeks</span>
                      </div>
                    </div>
                  </div>

                  {/* Re-evaluation */}
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-700">Re-eval in:</span>
                      {['4 wks', '6 wks'].map((reEval) => (
                        <div key={reEval} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`frequency-reEval-${reEval}`}
                            checked={typeof formData.treatmentPlan.frequency.reEval[reEval as keyof typeof formData.treatmentPlan.frequency.reEval] === 'boolean' ? formData.treatmentPlan.frequency.reEval[reEval as keyof typeof formData.treatmentPlan.frequency.reEval] as boolean : false}
                            onChange={(e) => handleFrequencyChange('reEval', reEval, e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`frequency-reEval-${reEval}`} className="ml-2 text-sm text-gray-700">
                            {reEval}
                          </label>
                        </div>
                      ))}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={formData.treatmentPlan.frequency.reEval.custom}
                          onChange={(e) => handleFrequencyCustomChange('reEval', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="___"
                        />
                        <span className="ml-1 text-sm text-gray-700">weeks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall response to care */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall response to care:</label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="overallResponseImproving"
                  name="overallResponse.improving"
                  type="checkbox"
                  checked={formData.overallResponse.improving}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="overallResponseImproving" className="ml-2 block text-sm text-gray-900">Improving</label>
              </div>
              <div className="flex items-center">
                <input
                  id="overallResponseWorse"
                  name="overallResponse.worse"
                  type="checkbox"
                  checked={formData.overallResponse.worse}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="overallResponseWorse" className="ml-2 block text-sm text-gray-900">Worse</label>
              </div>
              <div className="flex items-center">
                <input
                  id="overallResponseSame"
                  name="overallResponse.same"
                  type="checkbox"
                  checked={formData.overallResponse.same}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="overallResponseSame" className="ml-2 block text-sm text-gray-900">Same</label>
              </div>
            </div>
          </div>

          {/* Referrals */}
          <div>
            <label htmlFor="referrals" className="block text-sm font-medium text-gray-700 mb-1">Referrals: </label>
            <button
  type="button"
  onClick={() => fetchImagingAndSpecialistData(formData.previousVisit)}
  className={`bg-white font-medium underline focus:outline-none mt-2 ${
    imagingData ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
  }`}
>
  List of Imaging and Specialists {imagingData && '✓'}
</button>
{isImagingModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Referrals & Imaging Plan</h3>
        <button
          onClick={() => setIsImagingModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-md space-y-6 text-sm text-gray-700">
        {/* Referrals */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Referrals:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Orthopedist', 'Neurologist', 'Pain Management'].map(item => (
              <label key={item} className="flex items-center gap-2">
              <input
                  type="checkbox" 
                  checked={imagingInputData.referrals.includes(item)} 
                  onChange={() => {
                    if (imagingInputData.referrals.includes(item)) {
                      setImagingInputData(prev => ({
                        ...prev,
                        referrals: prev.referrals.filter(r => r !== item)
                      }));
                    } else {
                      setImagingInputData(prev => ({
                        ...prev,
                        referrals: [...prev.referrals, item]
                      }));
                  }
                }}
              />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Physiotherapy */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Physiotherapy:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Hot Pack/Cold Pack', 'Ultrasound', 'EMS', 'E-Stim', 'Therapeutic Exercises', 'NMR', 'Orthion Bed', 'Mechanical Traction', 'Paraffin Wax', 'Infrared'].map(item => (
              <label key={item} className="flex items-center gap-2">
              <input
                  type="checkbox" 
                  checked={imagingInputData.physiotherapy.includes(item)} 
                  onChange={() => {
                    if (imagingInputData.physiotherapy.includes(item)) {
                      setImagingInputData(prev => ({
                        ...prev,
                        physiotherapy: prev.physiotherapy.filter(p => p !== item)
                      }));
                    } else {
                      setImagingInputData(prev => ({
                        ...prev,
                        physiotherapy: [...prev.physiotherapy, item]
                      }));
                  }
                }}
              />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Rehabilitation Exercises */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Rehabilitation Exercises:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {imagingInputData.rehabilitationExercises.map(item => (
              <label key={item + '-rehab'} className="flex items-center gap-2">
              <input
                  type="checkbox" 
                  checked={imagingInputData.rehabilitationExercises.includes(item)} 
                  onChange={() => {
                    if (imagingInputData.rehabilitationExercises.includes(item)) {
                      setImagingInputData(prev => ({
                        ...prev,
                        rehabilitationExercises: prev.rehabilitationExercises.filter(r => r !== item)
                      }));
                    } else {
                      setImagingInputData(prev => ({
                        ...prev,
                        rehabilitationExercises: [...prev.rehabilitationExercises, item]
                      }));
                  }
                }}
              />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Duration & Frequency */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Duration & Re-Evaluation:</h4>
          <div className="flex flex-wrap gap-4">
            <label>
              Times per Week:
              <input
                type="number" 
                value={imagingInputData.durationFrequency.timesPerWeek}
                onChange={(e) => setImagingInputData(prev => ({
                  ...prev,
                  durationFrequency: {
                    ...prev.durationFrequency,
                    timesPerWeek: e.target.value
                  }
                }))}
                className="ml-2 border px-2 py-1 rounded" 
              />
            </label>
            <label>
              Re-Evaluation in Weeks:
              <input
                type="number" 
                value={imagingInputData.durationFrequency.reEvalInWeeks}
                onChange={(e) => setImagingInputData(prev => ({
                  ...prev,
                  durationFrequency: {
                    ...prev.durationFrequency,
                    reEvalInWeeks: e.target.value
                  }
                }))}
                className="ml-2 border px-2 py-1 rounded" 
              />
            </label>
          </div>
        </div>

        {/* Imaging (X-Ray, MRI, CT) */}
        {['xray', 'mri', 'ct'].map(modality => (
          <div key={modality}>
            <h4 className="font-semibold text-gray-800 mb-3">{modality.toUpperCase()}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['C/S', 'T/S', 'L/S', 'Sacroiliac Joint R', 'Sacroiliac Joint L', 'Hip R', 'Hip L', 'Knee R', 'Knee L', 'Ankle R', 'Ankle L', 'Shoulder R', 'Shoulder L', 'Elbow R', 'Elbow L', 'Wrist R', 'Wrist L'].map(region => (
                <label key={`${modality}-${region}`} className="flex items-center gap-2">
                <input
                    type="checkbox" 
                    checked={imagingInputData.imaging[modality as keyof typeof imagingInputData.imaging].includes(region)} 
                    onChange={() => {
                      const currentArray = imagingInputData.imaging[modality as keyof typeof imagingInputData.imaging];
                      if (currentArray.includes(region)) {
                        setImagingInputData(prev => ({
                          ...prev,
                          imaging: {
                            ...prev.imaging,
                            [modality]: currentArray.filter(item => item !== region)
                          }
                        }));
                      } else {
                        setImagingInputData(prev => ({
                          ...prev,
                          imaging: {
                            ...prev.imaging,
                            [modality]: [...currentArray, region]
                          }
                        }));
                    }
                  }}
                />
                  {region}
                </label>
              ))}
              </div>
        </div>
        ))}

        {/* Diagnostic Ultrasound */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Diagnostic Ultrasound</h4>
          <textarea 
            value={imagingInputData.diagnosticUltrasound || ''} 
            onChange={(e) => setImagingInputData(prev => ({
              ...prev,
              diagnosticUltrasound: e.target.value
            }))} 
            rows={2} 
            className="w-full border rounded px-3 py-2" 
            placeholder="Enter area of ultrasound" 
          />
                </div>

        {/* Nerve Study */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Nerve Study</h4>
          <div className="flex gap-6">
            {['EMG/NCV upper', 'EMG/NCV lower'].map(test => (
              <label key={test} className="flex items-center gap-2">
                <input
                  type="checkbox" 
                  checked={imagingInputData.nerveStudy?.includes(test) || false} 
                  onChange={() => {
                    const currentArray = imagingInputData.nerveStudy || [];
                    if (currentArray.includes(test)) {
                      setImagingInputData(prev => ({
                        ...prev,
                        nerveStudy: currentArray.filter(item => item !== test)
                      }));
                    } else {
                      setImagingInputData(prev => ({
                        ...prev,
                        nerveStudy: [...currentArray, test]
                      }));
                    }
                  }}
                />
                {test}
              </label>
            ))}
            </div>
          </div>

        {/* Restrictions */}
          <div>
          <h4 className="font-semibold text-gray-800 mb-3">Restrictions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avoid Activity (Weeks):</label>
              <input
                type="text"
                value={imagingInputData.restrictions?.avoidActivityWeeks || ''}
                onChange={(e) => setImagingInputData(prev => ({
                  ...prev,
                  restrictions: {
                    ...prev.restrictions,
                    avoidActivityWeeks: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2"
              />
                </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifting Limit (lbs):</label>
                <input
                  type="text"
                value={imagingInputData.restrictions?.liftingLimitLbs || ''}
                onChange={(e) => setImagingInputData(prev => ({
                  ...prev,
                  restrictions: {
                    ...prev.restrictions,
                    liftingLimitLbs: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 20"
              />
              </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={imagingInputData.restrictions?.avoidProlongedSitting || false}
                  onChange={(e) => setImagingInputData(prev => ({
                    ...prev,
                    restrictions: {
                      ...prev.restrictions,
                      avoidProlongedSitting: e.target.checked
                    }
                  }))}
                />
                Avoid Prolonged Sitting
              </label>
            </div>
          </div>
        </div>

        {/* Disability Duration */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Disability Duration</h4>
          <input
            type="text"
            value={imagingInputData.disabilityDuration || ''}
            onChange={(e) => setImagingInputData(prev => ({
              ...prev,
              disabilityDuration: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 4 weeks"
          />
        </div>

        {/* Other Notes */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Other Notes</h4>
          <textarea
            value={imagingInputData.otherNotes || ''}
            onChange={(e) => setImagingInputData(prev => ({
              ...prev,
              otherNotes: e.target.value
            }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter any additional notes..."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleSaveImagingData}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
        >
          Save
        </button>
        <button
          onClick={() => setIsImagingModalOpen(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


          </div>

          {/* Spacing */}
          <div className="mt-6"></div>

          {/* Review of diagnostic study with the patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review of diagnostic study with the patient:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="diagnosticStudy.study" className="block text-xs text-gray-500 mb-1">Study</label>
                <select
                  id="diagnosticStudy.study"
                  name="diagnosticStudy.study"
                  value={formData.diagnosticStudy.study}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select study...</option>
                  <option value="X-ray">X-ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="EMG/NCV">EMG/NCV</option>
                  <option value="Bone Scan">Bone Scan</option>
                  <option value="PET Scan">PET Scan</option>
                  <option value="Nuclear Medicine">Nuclear Medicine</option>
                  <option value="Arthrogram">Arthrogram</option>
                  <option value="Myelogram">Myelogram</option>
                  <option value="Discogram">Discogram</option>
                  <option value="Fluoroscopy">Fluoroscopy</option>
                  <option value="DEXA Scan">DEXA Scan</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="diagnosticStudy.bodyPart" className="block text-xs text-gray-500 mb-1">Body Part</label>
                <select
                  id="diagnosticStudy.bodyPart"
                  name="diagnosticStudy.bodyPart"
                  value={formData.diagnosticStudy.bodyPart}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select body part...</option>
                  <option value="Cervical Spine (C/S)">Cervical Spine (C/S)</option>
                  <option value="Thoracic Spine (T/S)">Thoracic Spine (T/S)</option>
                  <option value="Lumbar Spine (L/S)">Lumbar Spine (L/S)</option>
                  <option value="Sacroiliac Joint Right">Sacroiliac Joint Right</option>
                  <option value="Sacroiliac Joint Left">Sacroiliac Joint Left</option>
                  <option value="Hip Right">Hip Right</option>
                  <option value="Hip Left">Hip Left</option>
                  <option value="Knee Right">Knee Right</option>
                  <option value="Knee Left">Knee Left</option>
                  <option value="Ankle Right">Ankle Right</option>
                  <option value="Ankle Left">Ankle Left</option>
                  <option value="Shoulder Right">Shoulder Right</option>
                  <option value="Shoulder Left">Shoulder Left</option>
                  <option value="Elbow Right">Elbow Right</option>
                  <option value="Elbow Left">Elbow Left</option>
                  <option value="Wrist Right">Wrist Right</option>
                  <option value="Wrist Left">Wrist Left</option>
                  <option value="Hand Right">Hand Right</option>
                  <option value="Hand Left">Hand Left</option>
                  <option value="Foot Right">Foot Right</option>
                  <option value="Foot Left">Foot Left</option>
                  <option value="Pelvis">Pelvis</option>
                  <option value="Skull">Skull</option>
                  <option value="Chest">Chest</option>
                  <option value="Abdomen">Abdomen</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="diagnosticStudy.result" className="block text-xs text-gray-500 mb-1">Result:</label>
                <input
                  type="text"
                  id="diagnosticStudy.result"
                  name="diagnosticStudy.result"
                  value={formData.diagnosticStudy.result}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Home Care/Recommendations */}
          <div>
            <button
              type="button"
              onClick={() => setIsHomeCareModalOpen(true)}
              className={`bg-white font-medium underline focus:outline-none mt-2 ${
                homeCareSuggestions ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Home Care/Recommendations {homeCareSuggestions && '✓'}
            </button>
            
            {isHomeCareModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Home Care/Recommendations</h3>
                    <button
                      onClick={() => setIsHomeCareModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Close modal"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-6 text-sm text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Core Program */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="homeCare.coreProgram"
                          name="homeCare.coreProgram"
                          checked={formData.homeCare.coreProgram}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="homeCare.coreProgram" className="ml-2 text-sm text-gray-700">
                          Core Program
                        </label>
                      </div>

                      {/* Stretches */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="homeCare.stretches"
                          name="homeCare.stretches"
                          checked={formData.homeCare.stretches}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="homeCare.stretches" className="ml-2 text-sm text-gray-700">
                          Stretches
                        </label>
                      </div>

                      {/* Ice Pack/Hot Pack */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="homeCare.icePackHotPack"
                          name="homeCare.icePackHotPack"
                          checked={formData.homeCare.icePackHotPack}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="homeCare.icePackHotPack" className="ml-2 text-sm text-gray-700">
                          Ice Pack/Hot Pack
                        </label>
                      </div>

                      {/* Ligament Stability Program */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="homeCare.ligamentStabilityProgram"
                          name="homeCare.ligamentStabilityProgram"
                          checked={formData.homeCare.ligamentStabilityProgram}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="homeCare.ligamentStabilityProgram" className="ml-2 text-sm text-gray-700">
                          Ligament Stability Program
                        </label>
                      </div>
                    </div>

                    {/* Other Recommendations */}
                    <div className="mt-4">
                      <label htmlFor="homeCare.other" className="block text-sm font-medium text-gray-700 mb-2">
                        Other:
                      </label>
                      <input
                        type="text"
                        id="homeCare.other"
                        name="homeCare.other"
                        value={formData.homeCare.other}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter other recommendations..."
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setIsHomeCareModalOpen(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spacing */}
          <div className="mt-6"></div>

          {/* Additional Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes or observations"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/patients/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Visit
                </>
              )}
            </button>
        </div>
      </form>

      {/* Areas Modal */}
      {isAreasModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Areas Status</h3>
              <button
                onClick={() => setIsAreasModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-6">
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-4">Areas from Previous Visit:</h4>
                
                {/* Display Chief Complaint */}
                {formData.fetchedData?.initialVisitData?.chiefComplaint && (
                  <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
                    <h5 className="font-semibold text-gray-800 mb-2">Chief Complaint:</h5>
                    <p className="text-gray-700">{formData.fetchedData.initialVisitData.chiefComplaint}</p>
                  </div>
                )}

                {/* Display Subjective Intake Data (Chief Complaint) in Tabular Format */}
                {(formData.fetchedData?.areasData as any)?.subjectiveIntakeData && (formData.fetchedData?.areasData as any).subjectiveIntakeData.length > 0 && (
                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-md">
                    <h5 className="font-semibold text-gray-800 mb-3">Pain Location:</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Body Part</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Side</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Severity</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Quality</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Timing</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Context</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Exacerbated By</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Symptoms</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Notes</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Sciatica</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.fetchedData?.areasData as any).subjectiveIntakeData.map((intake: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{intake.bodyPart}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{intake.side}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{intake.severity}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                {Array.isArray(intake.quality) && intake.quality.length > 0 ? intake.quality.join(', ') : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{intake.timing || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{intake.context || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                {Array.isArray(intake.exacerbatedBy) && intake.exacerbatedBy.length > 0 ? intake.exacerbatedBy.join(', ') : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                {Array.isArray(intake.symptoms) && intake.symptoms.length > 0 ? intake.symptoms.join(', ') : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{intake.notes || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                {intake.sciaticaRight || intake.sciaticaLeft ? 
                                  `${intake.sciaticaRight ? 'R' : ''}${intake.sciaticaLeft ? 'L' : ''}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Showing {(formData.fetchedData?.areasData as any).subjectiveIntakeData.length} subjective intake(s) from patient record
                    </div>
                  </div>
                )}

                {/* Show message if no subjective intake data found */}
                {(!(formData.fetchedData?.areasData as any)?.subjectiveIntakeData || (formData.fetchedData?.areasData as any)?.subjectiveIntakeData?.length === 0) && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h5 className="font-semibold text-yellow-800 mb-2">Subjective Intake Data:</h5>
                    <p className="text-yellow-700 text-sm">
                      No subjective intake data found in the patient record. 
                      Please ensure the patient has subjective intake information recorded in their profile.
                    </p>
                  </div>
                )}



                {/* Display Joint Other */}
                {formData.fetchedData?.initialVisitData?.jointOther && (
                  <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
                    <h5 className="font-semibold text-gray-800 mb-2">Joint Other:</h5>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">{formData.fetchedData.initialVisitData.jointOther}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="improving-joint-other"
                            name="areasImproving"
                            checked={formData.areasImproving}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="improving-joint-other" className="ml-2 text-xs text-gray-600">Improving</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="exacerbated-joint-other"
                            name="areasExacerbated"
                            checked={formData.areasExacerbated}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="exacerbated-joint-other" className="ml-2 text-xs text-gray-600">Exacerbated</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="same-joint-other"
                            name="areasSame"
                            checked={formData.areasSame}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="same-joint-other" className="ml-2 text-xs text-gray-600">Same</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="resolved-joint-other"
                            name="areasResolved"
                            checked={formData.areasResolved}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="resolved-joint-other" className="ml-2 text-xs text-gray-600">Resolved</label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Diagnosis */}
                {formData.fetchedData?.initialVisitData?.diagnosis && formData.fetchedData.initialVisitData.diagnosis.length > 0 && (
                  <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
                    <h5 className="font-semibold text-gray-800 mb-2">Diagnosis:</h5>
                    <div className="space-y-2">
                      {formData.fetchedData.initialVisitData.diagnosis.map((diagnosis: string, index: number) => {
                        const areaId = `diagnosis-${index}`;
                        const areaStatus = individualAreaStatus.diagnosis?.[areaId] || {
                          improving: false,
                          exacerbated: false,
                          same: false,
                          resolved: false
                        };
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-700">{diagnosis}</span>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`improving-${areaId}`}
                                  checked={areaStatus.improving}
                                  onChange={(e) => handleIndividualAreaStatusChange('diagnosis', areaId, 'improving', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`improving-${areaId}`} className="ml-2 text-xs text-gray-600">Improving</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`exacerbated-${areaId}`}
                                  checked={areaStatus.exacerbated}
                                  onChange={(e) => handleIndividualAreaStatusChange('diagnosis', areaId, 'exacerbated', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`exacerbated-${areaId}`} className="ml-2 text-xs text-gray-600">Exacerbated</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`same-${areaId}`}
                                  checked={areaStatus.same}
                                  onChange={(e) => handleIndividualAreaStatusChange('diagnosis', areaId, 'same', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`same-${areaId}`} className="ml-2 text-xs text-gray-600">Same</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`resolved-${areaId}`}
                                  checked={areaStatus.resolved}
                                  onChange={(e) => handleIndividualAreaStatusChange('diagnosis', areaId, 'resolved', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`resolved-${areaId}`} className="ml-2 text-xs text-gray-600">Resolved</label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Additional Diagnosis Code */}
                    <div className="mt-4">
                      <label htmlFor="additionalDiagnosisAreas" className="block text-sm font-medium text-gray-700 mb-2">Additional Diagnosis Code:</label>
                      <select
                        id="additionalDiagnosisAreas"
                        name="additionalDiagnosisAreas"
                        value={formData.additionalDiagnosisAreas || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select additional diagnosis...</option>
                        <option value="M54.5">M54.5 - Low back pain</option>
                        <option value="M54.6">M54.6 - Pain in thoracic spine</option>
                        <option value="M54.9">M54.9 - Dorsalgia, unspecified</option>
                        <option value="M25.5">M25.5 - Pain in joint</option>
                        <option value="M79.3">M79.3 - Panniculitis, unspecified</option>
                        <option value="M79.1">M79.1 - Myalgia</option>
                        <option value="M79.9">M79.9 - Soft tissue disorder, unspecified</option>
                        <option value="M62.9">M62.9 - Disorder of muscle, unspecified</option>
                        <option value="M25.9">M25.9 - Joint disorder, unspecified</option>
                        <option value="M54.2">M54.2 - Cervicalgia</option>
                        <option value="M54.3">M54.3 - Sciatica</option>
                        <option value="M54.4">M54.4 - Lumbago with sciatica</option>
                        <option value="M54.8">M54.8 - Other dorsalgia</option>
                        <option value="M79.0">M79.0 - Rheumatism, unspecified</option>
                        <option value="M79.2">M79.2 - Neuralgia and neuritis, unspecified</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Palpations Section */}
                  <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
                  <h5 className="font-semibold text-gray-800 mb-2">Palpations:</h5>
                  <div className="space-y-3">
                    {/* Tenderness Option */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700 font-medium">Tenderness</span>
                      <button
                        type="button"
                        onClick={() => handlePalpationSelection('tenderness')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          formData.fetchedData?.initialVisitData?.tenderness && Object.keys(formData.fetchedData.initialVisitData.tenderness).length > 0
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {formData.fetchedData?.initialVisitData?.tenderness && Object.keys(formData.fetchedData.initialVisitData.tenderness).length > 0
                          ? 'View Data'
                          : 'No Data'
                        }
                      </button>
                    </div>
                    
                    {/* Spasm Option */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700 font-medium">Spasm</span>
                      <button
                        type="button"
                        onClick={() => handlePalpationSelection('spasm')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          formData.fetchedData?.initialVisitData?.spasm && Object.keys(formData.fetchedData.initialVisitData.spasm).length > 0
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {formData.fetchedData?.initialVisitData?.spasm && Object.keys(formData.fetchedData.initialVisitData.spasm).length > 0
                          ? 'View Data'
                          : 'No Data'
                        }
                      </button>
                            </div>
                                </div>
                            </div>
                          </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleSaveAreasData}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => setIsAreasModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
                    </div>
                  </div>
                )}

      {/* Palpations Data Modal */}
      {isPalpationsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedPalpationType === 'tenderness' ? 'Tenderness Data' : 'Spasm Data'}
              </h3>
              <button
                onClick={() => setIsPalpationsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-6">
              {selectedPalpationData && Object.keys(selectedPalpationData).length > 0 ? (
                Object.entries(selectedPalpationData).map(([region, labels], index: number) => {
                        const displayLabels = Array.isArray(labels) ? labels : [labels];
                  const areaId = `${region}-${index}`;
                        
                        return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{region}</h4>
                        <div className="text-gray-600">
                          <span className="font-medium">Areas:</span> {Array.isArray(displayLabels) ? displayLabels.join(', ') : displayLabels}
                            </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Severity Levels:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {['Mild', 'Mild-moderate', 'Moderate', 'Moderate-severe', 'Severe'].map((severity) => (
                            <div key={severity} className="flex items-center p-2 bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                id={`palpation-${areaId}-${severity}`}
                                checked={palpationSeveritySelections[region]?.[areaId]?.includes(severity) || false}
                                onChange={(e) => handlePalpationSeverityChange(region, areaId, severity, e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                              />
                              <span className="text-sm text-gray-700">{severity}</span>
                                </div>
                              ))}
                        </div>
                            </div>
                          </div>
                        );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No {selectedPalpationType} data available</p>
                  </div>
                )}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleSavePalpationData}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => setIsPalpationsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
                    </div>
                  </div>
                )}


      {/* Palpations Data Modal */}
      {isPalpationsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedPalpationType === 'tenderness' ? 'Tenderness Data' : 'Spasm Data'}
              </h3>
              <button
                onClick={() => setIsPalpationsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-6">
              {selectedPalpationData && Object.keys(selectedPalpationData).length > 0 ? (
                Object.entries(selectedPalpationData).map(([region, labels], index: number) => {
                        const displayLabels = Array.isArray(labels) ? labels : [labels];
                  const areaId = `${region}-${index}`;
                        
                        return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{region}</h4>
                        <div className="text-gray-600">
                          <span className="font-medium">Areas:</span> {Array.isArray(displayLabels) ? displayLabels.join(', ') : displayLabels}
                            </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Severity Levels:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {['Mild', 'Mild-moderate', 'Moderate', 'Moderate-severe', 'Severe'].map((severity) => (
                            <div key={severity} className="flex items-center p-2 bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                id={`palpation-${areaId}-${severity}`}
                                checked={palpationSeveritySelections[region]?.[areaId]?.includes(severity) || false}
                                onChange={(e) => handlePalpationSeverityChange(region, areaId, severity, e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                              />
                              <span className="text-sm text-gray-700">{severity}</span>
                                </div>
                              ))}
                        </div>
                            </div>
                          </div>
                        );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No {selectedPalpationType} data available</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleSavePalpationData}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => setIsPalpationsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities Modal */}
      {isActivitiesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Activities That Still Cause Pain</h3>
              <button
                onClick={() => setIsActivitiesModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-6">
              {/* Chief Complaint Reference */}
              {formData.fetchedData?.initialVisitData?.chiefComplaint && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">Original Chief Complaint:</h4>
                  <p className="text-blue-700 text-sm">{formData.fetchedData.initialVisitData.chiefComplaint}</p>
                </div>
              )}

              {/* Add Body Part Section */}
              <div className="mb-6 p-4 bg-white border border-gray-200 rounded-md">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Add Body Part for Activities</h4>
                
                {/* Dropdown Row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Body Part Dropdown */}
                  <select
                    value={formData.subjective?.tempBodyPart || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subjective: {
                          ...prev.subjective,
                          tempBodyPart: e.target.value,
                        },
                      }))
                    }
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Body Part</option>
                    {[
                      'C/S', 'T/S', 'L/S', 'SH', 'ELB', 'WR', 'Hand', 'Finger(s)',
                      'Hip', 'KN', 'AN', 'Foot', 'Toe(s)',
                      'L Ant/Post/Lat/Med', 'R Ant/Post/Lat/Med',
                    ].map((part) => (
                      <option key={part} value={part}>{part}</option>
                    ))}
                  </select>

                  {/* Side Dropdown */}
                  <select
                    value={formData.subjective?.tempSide || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subjective: {
                          ...prev.subjective,
                          tempSide: e.target.value,
                        },
                      }))
                    }
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Side</option>
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                    <option value="Bilateral">Bilateral</option>
                  </select>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const { tempBodyPart, tempSide } = formData.subjective || {};
                      if (tempBodyPart && tempSide) {
                        // Add to activities data
                        const newActivity = `${tempBodyPart} - ${tempSide}`;
                        const currentActivities = activitiesData ? activitiesData + '\n• ' : '• ';
                        setActivitiesData(currentActivities + newActivity);
                        
                        // Clear temp values
                        setFormData((prev) => ({
                          ...prev,
                          subjective: {
                            ...prev.subjective,
                            tempBodyPart: '',
                            tempSide: '',
                          },
                        }));
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Add Body Part
                  </button>
                </div>
              </div>

              {/* Activities Data Table */}
              <div className="bg-white border border-gray-200 rounded-md">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800">Activities That Still Cause Pain</h4>
                  <p className="text-sm text-gray-600 mt-1">Edit the activities based on the chief complaint</p>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <label htmlFor="activitiesTextarea" className="block text-sm font-medium text-gray-700 mb-2">
                      Activities Description:
                    </label>
                    <textarea
                      id="activitiesTextarea"
                      value={activitiesData}
                      onChange={(e) => setActivitiesData(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter activities that still cause pain based on the chief complaint..."
                    />
                  </div>

                  {/* Suggested Activities Table */}
                  {formData.fetchedData?.initialVisitData?.chiefComplaint && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-3">Suggested Activities (from Chief Complaint):</h5>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {formData.fetchedData.initialVisitData.chiefComplaint.split(/[.,;]/).map((activity: string, index: number) => {
                            const trimmedActivity = activity.trim();
                            if (trimmedActivity) {
                              return (
                                <div key={index} className="flex items-center p-2 bg-white border border-gray-200 rounded">
                                  <span className="text-sm text-gray-700 flex-1">{trimmedActivity}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentActivities = activitiesData ? activitiesData + '\n• ' : '• ';
                                      setActivitiesData(currentActivities + trimmedActivity);
                                    }}
                                    className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                                  >
                                    Add
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                    </div>
                  </div>
                )}

                  {/* Current Activities Display */}
                  {activitiesData && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Current Activities:</h5>
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <pre className="text-sm text-green-800 whitespace-pre-wrap">{activitiesData}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleSaveActivitiesData}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Save Activities
              </button>
              <button
                onClick={() => setIsActivitiesModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowupVisitForm;

