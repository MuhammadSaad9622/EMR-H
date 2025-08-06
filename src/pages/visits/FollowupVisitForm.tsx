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
  painRadiating: string;
  romWnlNoPain: boolean;
  romWnlWithPain: boolean;
  romImproved: boolean;
  romDecreased: boolean;
  romSame: boolean;
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

    homeCareSuggestions?: string;
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
const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
const [treatmentListData, setTreatmentListData] = useState<any>(null);
const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
const [imagingData, setImagingData] = useState<any>(null);
const [isImagingModalOpen, setIsImagingModalOpen] = useState(false);

  // State for Muscle Palpation modal interactive selections
  const [muscleTendernessSelections, setMuscleTendernessSelections] = useState<{[region: string]: {[anatomicalPart: string]: string[]}}>({});
  const [muscleSpasmSelections, setMuscleSpasmSelections] = useState<{[region: string]: {[anatomicalPart: string]: string[]}}>({});

  
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

  // Use the defined interface for the state type
  const [formData, setFormData] = useState<FollowupVisitFormData>({
    previousVisit: '',
    areas: '',
    areasImproving: false,
    areasExacerbated: false,
    areasSame: false,
    areasResolved: false,
    painRadiating: '',
    romWnlNoPain: false,
    romWnlWithPain: false,
    romImproved: false,
    romDecreased: false,
    romSame: false,
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
    notes: ''
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

  // Handler for saving muscle palpation modal selections
  const handleSaveMusclePalpation = () => {
    // Update the muscle palpation data with the selections
    const updatedMusclePalpationData = {
      ...musclePalpationData,
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



  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch patient data
        const [patientResponse, visitsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/patients/${id}`),
          axios.get(`http://localhost:5000/api/patients/${id}/visits`)
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
      await axios.put(`http://localhost:5000/api/visits/${visitId}`, {
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
      await axios.put(`http://localhost:5000/api/visits/${visitId}`, {
        ortho: data,
        arom: arom,
      });
      console.log("✅ Ortho tests data saved");
    } catch (error) {
      console.error("❌ Failed to save ortho tests data", error);
    }
  };
  
  const saveTreatmentPlanData = async (visitId: string, data: any) => {
    if (!visitId) return;
    try {
      await axios.put(`http://localhost:5000/api/visits/${visitId}`, {
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
      await axios.put(`http://localhost:5000/api/visits/${visitId}`, {
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
      await axios.put(`http://localhost:5000/api/visits/${visitId}`, {
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveData = {
        ...formData,
        ...(formData.fetchedData || {}), // ⬅️ this line spreads fetched modal data into the main save body
      };
  
      if (formData.previousVisit) {
        // PUT to update
        await axios.put(`http://localhost:5000/api/visits/${formData.previousVisit}`, saveData);
      } else {
        // POST to create
        const createData = {
          ...saveData,
          visitType: 'followup',
          patient: id,
        };
        await axios.post('http://localhost:5000/api/visits', createData);
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
      const res = await axios.get(`http://localhost:5000/api/visits/${visitId}`);
      const visit = res.data;
  
      // Check if data exists for followup or initial
      const musclePalpationData = {
        muscleStrength: visit.muscleStrength || [],
        strength: visit.strength || {},
        tenderness: visit.tenderness || {},
        spasm: visit.spasm || {},
      };
  
      setMusclePalpationData(musclePalpationData);
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
      const response = await axios.get(`http://localhost:5000/api/visits/${visitId}`);
      const visitData = response.data;

      if (!visitData) {
        console.error("Visit data is missing.");
        alert("Failed to load visit data.");
        return;
      }
  
      // Extract and structure ortho tests data
      const orthoTestsData: {
        [region: string]: {
          [testName: string]: { left: string; right: string; ligLaxity: string };
        };
      } = visitData.ortho
        ? Object.entries(visitData.ortho as Record<string, any>).reduce((acc: any, [testName, testResult]) => {
            const region = testName.split(" ")[0];
            const { left, right, ligLaxity } = testResult as {
              left: string;
              right: string;
              ligLaxity: string;
            };
  
            if (!acc[region]) acc[region] = {};
  
            acc[region][testName] = {
              left: left || "N/A",
              right: right || "N/A",
              ligLaxity: ligLaxity || "N/A",
            };
            return acc;
          }, {})
        : {};
  
      // Extract and structure AROM data
      const aromData: {
        [region: string]: {
          [movementName: string]: { left: string; right: string; ligLaxity: string };
        };
      } = visitData.arom
        ? Object.entries(visitData.arom as Record<string, any>).reduce((acc: any, [region, movements]) => {
            acc[region] = Object.entries(movements as Record<string, any>).reduce((movementAcc: any, [movementName, movementData]) => {
              const { left, right, ligLaxity } = movementData as {
                left: string;
                right: string;
                ligLaxity: string;
              };
  
              movementAcc[movementName] = {
                left: left || "N/A",
                right: right || "N/A",
                ligLaxity: ligLaxity || "N/A",
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
      const response = await axios.get(`http://localhost:5000/api/visits/${visitId}`);
      const visitData = response.data;

      // Filter only treatment plan data
      const treatmentData = {
        chiropracticAdjustment: visitData.chiropracticAdjustment || [],
        chiropracticOther: visitData.chiropracticOther || '',
        acupuncture: visitData.acupuncture || [],
        acupunctureOther: visitData.acupunctureOther || '',
        physiotherapy: visitData.physiotherapy || [],
        rehabilitationExercises: visitData.rehabilitationExercises || [],
        durationFrequency: visitData.durationFrequency || {
          timesPerWeek: '',
          reEvalInWeeks: '',
        },
        diagnosticUltrasound: visitData.diagnosticUltrasound || '',
        disabilityDuration: visitData.disabilityDuration || '',
      };
  
      // Show in modal
      setActivitiesPainData(treatmentData);
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
      const response = await axios.get(`http://localhost:5000/api/visits/${visitId}`);
      const visitData = response.data;

      const treatmentList = {
        chiropracticAdjustment: visitData.chiropracticAdjustment || [],
        chiropracticOther: visitData.chiropracticOther || '',
        acupuncture: visitData.acupuncture || [],
        acupunctureOther: visitData.acupunctureOther || '',
        physiotherapy: visitData.physiotherapy || [],
        rehabilitationExercises: visitData.rehabilitationExercises || [],
        durationFrequency: visitData.durationFrequency || { timesPerWeek: '', reEvalInWeeks: '' },
        referrals: visitData.referrals || [],
        imaging: visitData.imaging || { xray: [], mri: [], ct: [] },
        diagnosticUltrasound: visitData.diagnosticUltrasound || '',
        nerveStudy: visitData.nerveStudy || [],
        restrictions: visitData.restrictions || {
          avoidActivityWeeks: '',
          liftingLimitLbs: '',
          avoidProlongedSitting: false,
        },
        disabilityDuration: visitData.disabilityDuration || '',
        otherNotes: visitData.otherNotes || '',
      };
  
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

      // Also update the state for immediate use
      setTreatmentListData(treatmentList);
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
      const response = await axios.get(`http://localhost:5000/api/visits/${visitId}`);
      const visitData = response.data;

      const imagingAndSpecialistData = {
        physiotherapy: visitData.physiotherapy || [],
        rehabilitationExercises: visitData.rehabilitationExercises || [],
        durationFrequency: visitData.durationFrequency || {
          timesPerWeek: '',
          reEvalInWeeks: '',
        },
        referrals: visitData.referrals || [],
        imaging: visitData.imaging || {
          xray: [],
          mri: [],
          ct: [],
        },
      };
  
      // Set modal data
      setImagingData(imagingAndSpecialistData);
      setIsImagingModalOpen(true);
  
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
      const response = await axios.get(`http://localhost:5000/api/visits/${visitId}`);
      
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
        painRadiating: formData.painRadiating || '',
        romWnlNoPain: formData.romWnlNoPain || false,
        romWnlWithPain: formData.romWnlWithPain || false,
        romImproved: formData.romImproved || false,
        romDecreased: formData.romDecreased || false,
        romSame: formData.romSame || false,
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
        referrals: Array.isArray(formData.referrals) ? formData.referrals.join(', ') : (formData.referrals || ''),
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
        muscleStrength: musclePalpationData?.muscleStrength || [],
        strength: musclePalpationData?.strength || {},
        tenderness: musclePalpationData?.tenderness || {},
        spasm: musclePalpationData?.spasm || {},
        
        // Ortho Tests Modal Data
        ortho: orthoTestsData || {},
        arom: aromData || {},
        
        // Activities/Treatment Plan Modal Data
        chiropracticAdjustment: activitiesPainData?.chiropracticAdjustment || [],
        chiropracticOther: activitiesPainData?.chiropracticOther || '',
        acupuncture: activitiesPainData?.acupuncture || [],
        acupunctureOther: activitiesPainData?.acupunctureOther || '',
        physiotherapy: activitiesPainData?.physiotherapy || [],
        rehabilitationExercises: activitiesPainData?.rehabilitationExercises || [],
        durationFrequency: activitiesPainData?.durationFrequency || { timesPerWeek: '', reEvalInWeeks: '' },
        diagnosticUltrasound: activitiesPainData?.diagnosticUltrasound || '',
        disabilityDuration: activitiesPainData?.disabilityDuration || '',
        
        // Treatment List Modal Data
        nerveStudy: treatmentListData?.nerveStudy || [],
        restrictions: treatmentListData?.restrictions || { avoidActivityWeeks: '', liftingLimitLbs: '', avoidProlongedSitting: false },
        otherNotes: treatmentListData?.otherNotes || '',
        
        // Imaging and Referrals Modal Data
        imaging: imagingData?.imaging || { xray: [], mri: [], ct: [] },
        
        // Home Care AI Suggestions
        homeCareSuggestions: homeCareSuggestions || '',
      };
      
      // Final validation
      if (!visitData.previousVisit || !visitData.patient || !visitData.doctor) {
        alert('Missing required fields: previousVisit, patient, or doctor');
        return;
      }

      console.log('Sending visit data:', visitData);
      console.log('Modal data summary:');
      console.log('- Muscle palpation data:', !!musclePalpationData);
      console.log('- Ortho tests data:', !!orthoTestsData);
      console.log('- AROM data:', !!aromData);
      console.log('- Activities pain data:', !!activitiesPainData);
      console.log('- Treatment list data:', !!treatmentListData);
      console.log('- Imaging data:', !!imagingData);
      console.log('- Home care suggestions:', !!homeCareSuggestions);
      
      const response = await axios.post(`http://localhost:5000/api/visits`, visitData);
      
      const savedVisitId = response.data.visit._id;

      // 2. Generate AI narrative
      try {
        const aiResponse = await axios.post(`http://localhost:5000/api/ai/generate-narrative`, {
          ...formData,
          visitType: 'followup'
        });

        if (aiResponse.data.success) {
          // 3. Update the visit with the AI narrative
          await axios.patch(`http://localhost:5000/api/visits/${savedVisitId}`, {
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
      {(musclePalpationData || orthoTestsData || activitiesPainData || treatmentListData || imagingData || homeCareSuggestions) && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700 font-medium">Loaded Data Summary:</p>
              <div className="mt-2 text-xs text-blue-600">
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
  onClick={() => fetchInitialVisitData(formData.previousVisit)}
  className="bg-white text-blue-600 font-medium underline hover:text-blue-800 focus:outline-none mb-4" >
  Areas: Auto generated from Initial
</button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="areasImproving"
                  name="areasImproving"
                  type="checkbox"
                  checked={formData.areasImproving}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="areasImproving" className="ml-2 block text-sm text-gray-900">Improving</label>
              </div>
              <div className="flex items-center">
                <input
                  id="areasExacerbated"
                  name="areasExacerbated"
                  type="checkbox"
                  checked={formData.areasExacerbated}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="areasExacerbated" className="ml-2 block text-sm text-gray-900">Exacerbated</label>
              </div>
              <div className="flex items-center">
                <input
                  id="areasSame"
                  name="areasSame"
                  type="checkbox"
                  checked={formData.areasSame}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="areasSame" className="ml-2 block text-sm text-gray-900">Same</label>
              </div>
              <div className="flex items-center">
                <input
                  id="areasResolved"
                  name="areasResolved"
                  type="checkbox"
                  checked={formData.areasResolved}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="areasResolved" className="ml-2 block text-sm text-gray-900">Resolved</label>
              </div>
            </div>
          </div>

          {/* Muscle Palpation */}
          <div>
  <label htmlFor="musclePalpation" className="block text-sm font-medium text-gray-700 mb-1">Muscle Palpation: </label>
  <button
  type="button"
  onClick={() => fetchMusclePalpationData(formData.previousVisit)}
  className={`bg-white font-medium underline focus:outline-none ${
    musclePalpationData ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
  }`}
>
  List of muscles specific to that body part {musclePalpationData && '✓'}
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
          <h4 className="font-bold text-lg text-gray-800">Muscle Strength:</h4>
          {musclePalpationData?.muscleStrength ? (
            <ul className="list-disc ml-5">
              {musclePalpationData.muscleStrength.map((strength: string, index: number) => (
                <li key={index} className="text-sm text-gray-700">
                  {strength || 'N/A'}
                </li>
              ))}
            </ul>
          ) : (
            <p>N/A</p>
          )}
        </div>

        {/* Strength */}
        <div>
          <h4 className="font-bold text-lg text-gray-800">Strength:</h4>
          {musclePalpationData?.strength ? (
            Object.entries(musclePalpationData.strength).map(([key, value]) => {
              if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
                return (
                  <div key={key} className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">{key}:</span>
                    <div className="ml-4">
                      <p><span className="font-medium">Right:</span> {(value as any).right || 'N/A'}</p>
                      <p><span className="font-medium">Left:</span> {(value as any).left || 'N/A'}</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <p key={key} className="text-sm text-gray-700">
                    <span className="font-semibold">{key}:</span> {String(value || 'N/A')}
                  </p>
                );
              }
            })
          ) : (
            <p>N/A</p>
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



          {/* Pain Radiating */}
          <div>
            <label htmlFor="painRadiating" className="block text-sm font-medium text-gray-700 mb-1">Pain Radiating: </label>
            <input
              type="text"
              id="painRadiating"
              name="painRadiating"
              value={formData.painRadiating}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ROM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ROM:</label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="romWnlNoPain"
                  name="romWnlNoPain"
                  type="checkbox"
                  checked={formData.romWnlNoPain}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="romWnlNoPain" className="ml-2 block text-sm text-gray-900">WNL (No Pain)</label>
              </div>
              <div className="flex items-center">
                <input
                  id="romWnlWithPain"
                  name="romWnlWithPain"
                  type="checkbox"
                  checked={formData.romWnlWithPain}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="romWnlWithPain" className="ml-2 block text-sm text-gray-900">WNL (With Pain)</label>
              </div>
              <div className="flex items-center">
                <input
                  id="romImproved"
                  name="romImproved"
                  type="checkbox"
                  checked={formData.romImproved}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="romImproved" className="ml-2 block text-sm text-gray-900">Improved</label>
              </div>
              <div className="flex items-center">
                <input
                  id="romDecreased"
                  name="romDecreased"
                  type="checkbox"
                  checked={formData.romDecreased}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="romDecreased" className="ml-2 block text-sm text-gray-900">Decreased</label>
              </div>
               <div className="flex items-center">
                <input
                  id="romSame"
                  name="romSame"
                  type="checkbox"
                  checked={formData.romSame}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="romSame" className="ml-2 block text-sm text-gray-900">Same</label>
              </div>
            </div>
          </div>

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
                <h5 className="font-semibold text-lg text-gray-800">{region}</h5>
                {Object.entries(tests as Record<string, any>).map(([testName, testResult]) => (
                  <div key={testName} className="space-y-4">
                    <div className="flex items-center justify-between">
                      {/* Test Name */}
                      <span className="font-medium text-gray-600">{testName}:</span>
                      
                      {/* Display Orthopedic Test (Left, Right, Ligament Laxity) */}
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          value={(testResult as any).left || 'N/A'}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={(testResult as any).right || 'N/A'}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={(testResult as any).ligLaxity || 'N/A'}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none"
                        />
                      </div>
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
      <div className="mt-4 flex justify-end">
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
  onClick={() => fetchTreatmentPlanData(formData.previousVisit)}
  className={`bg-white font-medium underline focus:outline-none mt-2 ${
    activitiesPainData ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
  }`}
>
  List of activities that still cause pain {activitiesPainData && '✓'}
</button>

{isActivitiesModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Treatment Plan Details</h3>
        <button
          onClick={() => setIsActivitiesModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-md space-y-4 text-sm text-gray-700">
        <div>
          <h4 className="font-semibold text-gray-700">Chiropractic Adjustment:</h4>
          <ul className="list-disc ml-5">
            {activitiesPainData?.chiropracticAdjustment?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Chiropractic Other:</h4>
          <p>{activitiesPainData?.chiropracticOther || 'N/A'}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Acupuncture:</h4>
          <ul className="list-disc ml-5">
            {activitiesPainData?.acupuncture?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Acupuncture Other:</h4>
          <p>{activitiesPainData?.acupunctureOther || 'N/A'}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Physiotherapy:</h4>
          <ul className="list-disc ml-5">
            {activitiesPainData?.physiotherapy?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Rehabilitation Exercises:</h4>
          <ul className="list-disc ml-5">
            {activitiesPainData?.rehabilitationExercises?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Duration & Frequency:</h4>
          <p>Times/Week: {activitiesPainData?.durationFrequency?.timesPerWeek || 'N/A'}</p>
          <p>Re-eval in Weeks: {activitiesPainData?.durationFrequency?.reEvalInWeeks || 'N/A'}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Diagnostic Ultrasound:</h4>
          <p>{activitiesPainData?.diagnosticUltrasound || 'N/A'}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Disability Duration:</h4>
          <p>{activitiesPainData?.disabilityDuration || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chiropractic */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.chiropractic"
              name="treatmentPlan.chiropractic"
              checked={formData.treatmentPlan.chiropractic}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.chiropractic" className="ml-2 text-sm text-gray-700">
              Chiropractic
            </label>
          </div>

          {/* Acupuncture */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.acupuncture"
              name="treatmentPlan.acupuncture"
              checked={formData.treatmentPlan.acupuncture}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.acupuncture" className="ml-2 text-sm text-gray-700">
              Acupuncture
            </label>
          </div>

          {/* Mechanical Traction */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.mechanicalTraction"
              name="treatmentPlan.mechanicalTraction"
              checked={formData.treatmentPlan.mechanicalTraction}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.mechanicalTraction" className="ml-2 text-sm text-gray-700">
              Mechanical Traction
            </label>
          </div>

          {/* Myofascial Release */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.myofascialRelease"
              name="treatmentPlan.myofascialRelease"
              checked={formData.treatmentPlan.myofascialRelease}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.myofascialRelease" className="ml-2 text-sm text-gray-700">
              Myofascial Release
            </label>
          </div>

          {/* Ultrasound */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.ultrasound"
              name="treatmentPlan.ultrasound"
              checked={formData.treatmentPlan.ultrasound}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.ultrasound" className="ml-2 text-sm text-gray-700">
              Ultrasound
            </label>
          </div>

          {/* Infrared Electric Muscle Stimulation */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.infraredElectricMuscleStimulation"
              name="treatmentPlan.infraredElectricMuscleStimulation"
              checked={formData.treatmentPlan.infraredElectricMuscleStimulation}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.infraredElectricMuscleStimulation" className="ml-2 text-sm text-gray-700">
              Infrared Electric Muscle Stimulation
            </label>
          </div>

          {/* Therapeutic Exercise */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.therapeuticExercise"
              name="treatmentPlan.therapeuticExercise"
              checked={formData.treatmentPlan.therapeuticExercise}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.therapeuticExercise" className="ml-2 text-sm text-gray-700">
              Therapeutic Exercise
            </label>
          </div>

          {/* Neuromuscular re-education */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="treatmentPlan.neuromuscularReeducation"
              name="treatmentPlan.neuromuscularReeducation"
              checked={formData.treatmentPlan.neuromuscularReeducation}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="treatmentPlan.neuromuscularReeducation" className="ml-2 text-sm text-gray-700">
              Neuromuscular re-education
            </label>
          </div>
        </div>

        {/* Other Treatment */}
        <div className="mt-4">
          <label htmlFor="treatmentPlan.other" className="block text-sm font-medium text-gray-700 mb-2">
            Other:
          </label>
          <input
            type="text"
            id="treatmentPlan.other"
            name="treatmentPlan.other"
            value={formData.treatmentPlan.other}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter other treatments..."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
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

      <div className="bg-gray-50 p-4 rounded-md space-y-4 text-sm text-gray-700">
        {/* Referrals */}
        <div>
          <h4 className="font-semibold">Specialist Referrals:</h4>
          <ul className="list-disc ml-5">
            {imagingData?.referrals?.length > 0 ? (
              imagingData.referrals.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))
            ) : (
              <li>N/A</li>
            )}
          </ul>
        </div>

        {/* Physiotherapy */}
        <div>
          <h4 className="font-semibold">Physiotherapy:</h4>
          <ul className="list-disc ml-5">
            {imagingData?.physiotherapy?.length > 0 ? (
              imagingData.physiotherapy.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))
            ) : (
              <li>N/A</li>
            )}
          </ul>
        </div>

        {/* Rehabilitation Exercises */}
        <div>
          <h4 className="font-semibold">Rehabilitation Exercises:</h4>
          <ul className="list-disc ml-5">
            {imagingData?.rehabilitationExercises?.length > 0 ? (
              imagingData.rehabilitationExercises.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))
            ) : (
              <li>N/A</li>
            )}
          </ul>
        </div>

        {/* Duration & Frequency */}
        <div>
          <h4 className="font-semibold">Duration & Frequency:</h4>
          <p><strong>Times per Week:</strong> {imagingData?.durationFrequency?.timesPerWeek || 'N/A'}</p>
          <p><strong>Re-evaluation in Weeks:</strong> {imagingData?.durationFrequency?.reEvalInWeeks || 'N/A'}</p>
        </div>

        {/* Imaging */}
        <div>
          <h4 className="font-semibold">Imaging:</h4>
          <p><strong>X-ray:</strong> {imagingData?.imaging?.xray?.join(', ') || 'N/A'}</p>
          <p><strong>MRI:</strong> {imagingData?.imaging?.mri?.join(', ') || 'N/A'}</p>
          <p><strong>CT:</strong> {imagingData?.imaging?.ct?.join(', ') || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
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

          {/* Review of diagnostic study with the patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review of diagnostic study with the patient:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="diagnosticStudy.study" className="block text-xs text-gray-500 mb-1">Study</label>
                <input
                  type="text"
                  id="diagnosticStudy.study"
                  name="diagnosticStudy.study"
                  value={formData.diagnosticStudy.study}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="diagnosticStudy.bodyPart" className="block text-xs text-gray-500 mb-1">Body Part</label>
                <input
                  type="text"
                  id="diagnosticStudy.bodyPart"
                  name="diagnosticStudy.bodyPart"
                  value={formData.diagnosticStudy.bodyPart}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Care/Recommendations: </label>
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
        </div>
      </form>
    </div>
  );
};

export default FollowupVisitForm;