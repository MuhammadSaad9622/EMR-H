import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
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

type FormData = {
  areasImproving: boolean;
  areasExacerbated: boolean;
  areasSame: boolean;
  areasResolved: boolean;
  musclePalpation: string;
  painRadiating: string;
  painRadiatingAssessment?: Array<{
    bodyPart: string;
    side: string;
    severity: string;
    quality: string[];
    timing: string;
    context: string;
    exacerbatedBy: string[];
    symptoms: string[];
    notes: string;
  }>;
  romPercent: string;
  romAssessment?: Array<{
    bodyPart: string;
    side: string;
    percentage: string;
    status: string;
    notes: string;
  }>;
  orthos: {
    tests: string;
    result: string;
  };
  activitiesCausePain: string;
  otherNotes: string;
  prognosis: string;
  prognosisPlateau: boolean;
  prognosisMaxBenefits: boolean;
  diagnosticStudy: {
    study: string;
    bodyPart: string;
    result: string;
  };
  futureMedicalCare: string[];
  croftCriteria: string;
  homeCare: string[];
  referralsNotes: string;
  // Additional fields from followup data that should be included
  romWnlNoPain?: boolean;
  romWnlWithPain?: boolean;
  romImproved?: boolean;
  romDecreased?: boolean;
  romSame?: boolean;
  muscleStrength?: string[];
  tenderness?: any;
  spasm?: any;
  ortho?: any;
  arom?: any;
  homeCareSuggestions?: string;
  individualAreaStatus?: {
    [key: string]: {
      improving: boolean;
      exacerbated: boolean;
      same: boolean;
      resolved: boolean;
    };
  };
  subjective?: {
    tempBodyPart?: string;
    tempSide?: string;
  };
};

const DischargeVisitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [previousVisits, setPreviousVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastFollowupVisit, setLastFollowupVisit] = useState<any>(null);
  const [followupData, setFollowupData] = useState<any>(null);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    areasImproving: false,
    areasExacerbated: false,
    areasSame: false,
    areasResolved: false,
    musclePalpation: '',
    painRadiating: '',
    painRadiatingAssessment: [],
    romPercent: '',
    romAssessment: [],
    orthos: {
      tests: '',
      result: ''
    },
    activitiesCausePain: '',
    otherNotes: '',
    prognosis: '',
    prognosisPlateau: false,
    prognosisMaxBenefits: false,
    diagnosticStudy: {
      study: '',
      bodyPart: '',
      result: ''
    },
    futureMedicalCare: [],
    croftCriteria: '',
    homeCare: [],
    referralsNotes: '',
    // Additional fields from followup data
    romWnlNoPain: false,
    romWnlWithPain: false,
    romImproved: false,
    romDecreased: false,
    romSame: false,
    muscleStrength: [],
    tenderness: {},
    spasm: {},
    ortho: {},
    arom: {},
    homeCareSuggestions: '',
    subjective: {
      tempBodyPart: '',
      tempSide: ''
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isMuscleModalOpen, setIsMuscleModalOpen] = useState(false);
  const [isOrthosModalOpen, setIsOrthosModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isCroftModalOpen, setIsCroftModalOpen] = useState(false);
  const [croftGrade, setCroftGrade] = useState<string>('');
  const [croftTemplate, setCroftTemplate] = useState<string>('');
  const [isPainRadiatingModalOpen, setIsPainRadiatingModalOpen] = useState(false);
  const [isROMModalOpen, setIsROMModalOpen] = useState(false);

  // State for orthopedic tests data (similar to FollowupVisitForm)
  const [orthoTestsData, setOrthoTestsData] = useState<any>({});
  const [orthoTestSelections, setOrthoTestSelections] = useState<{[region: string]: {[testName: string]: {left: boolean; right: boolean; bilateral: boolean}}}>({});
  const [hasOrthoTestsChanges, setHasOrthoTestsChanges] = useState(false);

  // State for activities data (similar to FollowupVisitForm)
  const [activitiesData, setActivitiesData] = useState<string>('');
  const [initialVisitData, setInitialVisitData] = useState<any>(null);

  // State for individual area status checkboxes
  const [individualAreaStatus, setIndividualAreaStatus] = useState<{
    [key: string]: {
      improving: boolean;
      exacerbated: boolean;
      same: boolean;
      resolved: boolean;
    };
  }>({});

  // State for editable additional assessment data
  const [editableAdditionalData, setEditableAdditionalData] = useState<{
    tenderness: any;
    spasm: any;
    ortho: any;
    arom: any;
    muscleStrength: string[];
    activities: any;
    croftCriteria: any;
  }>({
    tenderness: {},
    spasm: {},
    ortho: {},
    arom: {},
    muscleStrength: [],
    activities: {},
    croftCriteria: {}
  });

  // State for pain radiating data
  const [painRadiatingData, setPainRadiatingData] = useState<{
    tempBodyPart: string;
    tempSide: string;
    intakes: Array<{
      bodyPart: string;
      side: string;
      severity: string;
      quality: string[];
      timing: string;
      context: string;
      exacerbatedBy: string[];
      symptoms: string[];
      notes: string;
    }>;
  }>({
    tempBodyPart: '',
    tempSide: '',
    intakes: []
  });

  // State for ROM data
  const [romData, setRomData] = useState<{
    tempBodyPart: string;
    tempSide: string;
    intakes: Array<{
      bodyPart: string;
      side: string;
      percentage: string;
      status: string;
      notes: string;
    }>;
  }>({
    tempBodyPart: '',
    tempSide: '',
    intakes: []
  });

  // Fetch patient data and visits on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patientResponse, visitsResponse] = await Promise.all([
          axios.get(`https://emr-h.onrender.com/api/patients/${id}`),
          axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`)
        ]);
        
        setPatient(patientResponse.data);
        
        // Filter and sort visits to get the last followup visit
        const sortedVisits = visitsResponse.data
          .filter((visit: any) => !!visit.date)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setPreviousVisits(sortedVisits);
        
        // Find the last followup visit
        const lastFollowup = sortedVisits.find((visit: any) => 
          visit.visitType === 'followup' || visit.__t === 'followup'
        );
        
        if (lastFollowup) {
          setLastFollowupVisit(lastFollowup);
        }

        // Load existing pain radiating data if available
        await loadExistingPainRadiatingData();
        
        // Load existing ROM data if available
        await loadExistingROMData();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Function to load existing pain radiating data
  const loadExistingPainRadiatingData = async () => {
    try {
      const response = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/pain-radiating`);
      if (response.data && response.data.painRadiatingAssessment) {
        setPainRadiatingData(prev => ({
          ...prev,
          intakes: response.data.painRadiatingAssessment
        }));
        
        // Also update formData
        setFormData(prev => ({
          ...prev,
          painRadiating: response.data.painRadiating || '',
          painRadiatingAssessment: response.data.painRadiatingAssessment || []
        }));
      }
    } catch (error) {
      // No existing data or error - this is fine for new forms
      console.log('No existing pain radiating data found or error loading:', error);
    }
  };

  // Function to load existing ROM data
  const loadExistingROMData = async () => {
    try {
      const response = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/rom-assessment`);
      if (response.data && response.data.romAssessment) {
        setRomData(prev => ({
          ...prev,
          intakes: response.data.romAssessment
        }));
        
        // Also update formData
        setFormData(prev => ({
          ...prev,
          romAssessment: response.data.romAssessment || []
        }));
      }
    } catch (error) {
      // No existing data or error - this is fine for new forms
      console.log('No existing ROM data found or error loading:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNestedChange = (section: keyof FormData, field: string, value: string | boolean) => {
    setFormData((prev) => {
      const sectionValue = prev[section];
      if (typeof sectionValue === 'object' && sectionValue !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionValue,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  // Handler for individual area status checkboxes
  const handleIndividualAreaStatusChange = (elementKey: string, status: 'improving' | 'exacerbated' | 'same' | 'resolved', checked: boolean) => {
    setIndividualAreaStatus(prev => ({
      ...prev,
      [elementKey]: {
        ...prev[elementKey],
        [status]: checked
      }
    }));
  };

  // Handlers for additional assessment data
  const handleAdditionalDataChange = (section: string, field: string, value: any) => {
    setEditableAdditionalData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleAddTendernessItem = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      tenderness: {
        ...prev.tenderness,
        [`region_${Object.keys(prev.tenderness).length + 1}`]: {
          part: '',
          severities: []
        }
      }
    }));
  };

  const handleRemoveTendernessItem = (region: string) => {
    setEditableAdditionalData(prev => {
      const newTenderness = { ...prev.tenderness };
      delete newTenderness[region];
      return {
        ...prev,
        tenderness: newTenderness
      };
    });
  };

  const handleAddSpasmItem = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      spasm: {
        ...prev.spasm,
        [`region_${Object.keys(prev.spasm).length + 1}`]: {
          part: '',
          severities: []
        }
      }
    }));
  };

  const handleRemoveSpasmItem = (region: string) => {
    setEditableAdditionalData(prev => {
      const newSpasm = { ...prev.spasm };
      delete newSpasm[region];
      return {
        ...prev,
        spasm: newSpasm
      };
    });
  };



  const handleAddAromMovement = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      arom: {
        ...prev.arom,
        [`movement_${Object.keys(prev.arom).length + 1}`]: {
          range: '',
          quality: '',
          pain: ''
        }
      }
    }));
  };

  const handleRemoveAromMovement = (movement: string) => {
    setEditableAdditionalData(prev => {
      const newArom = { ...prev.arom };
      delete newArom[movement];
      return {
        ...prev,
        arom: newArom
      };
    });
  };







  // Handlers for muscle strength
  const handleAddMuscleStrength = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      muscleStrength: [...prev.muscleStrength, '']
    }));
  };

  const handleMuscleStrengthChange = (index: number, value: string) => {
    setEditableAdditionalData(prev => ({
      ...prev,
      muscleStrength: prev.muscleStrength.map((muscle, i) => i === index ? value : muscle)
    }));
  };

  const handleRemoveMuscleStrength = (index: number) => {
    setEditableAdditionalData(prev => ({
      ...prev,
      muscleStrength: prev.muscleStrength.filter((_, i) => i !== index)
    }));
  };



  // Handlers for orthos tests
  const handleAddOrthoTest = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      ortho: {
        ...prev.ortho,
        [`test_${Object.keys(prev.ortho).length + 1}`]: {
          name: '',
          result: '',
          details: ''
        }
      }
    }));
  };

  const handleRemoveOrthoTest = (testKey: string) => {
    setEditableAdditionalData(prev => {
      const newOrtho = { ...prev.ortho };
      delete newOrtho[testKey];
      return {
        ...prev,
        ortho: newOrtho
      };
    });
  };

  // Handlers for activities
  const handleAddActivity = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      activities: {
        ...prev.activities,
        [`activity_${Object.keys(prev.activities || {}).length + 1}`]: {
          name: '',
          severity: '',
          frequency: ''
        }
      }
    }));
  };

  const handleActivityChange = (activityKey: string, field: string, value: string) => {
    setEditableAdditionalData(prev => ({
      ...prev,
      activities: {
        ...prev.activities,
        [activityKey]: {
          ...prev.activities[activityKey],
          [field]: value
        }
      }
    }));
  };

  const handleRemoveActivity = (activityKey: string) => {
    setEditableAdditionalData(prev => {
      const newActivities = { ...prev.activities };
      delete newActivities[activityKey];
      return {
        ...prev,
        activities: newActivities
      };
    });
  };

  // Handlers for Croft Criteria
  const handleAddCroftCriteria = () => {
    setEditableAdditionalData(prev => ({
      ...prev,
      croftCriteria: {
        ...prev.croftCriteria,
        [`criteria_${Object.keys(prev.croftCriteria).length + 1}`]: {
          grade: '',
          frequency: '',
          treatmentGuideline: '',
          notes: ''
        }
      }
    }));
  };

  const handleCroftCriteriaChange = (criteriaKey: string, field: string, value: string) => {
    setEditableAdditionalData(prev => ({
      ...prev,
      croftCriteria: {
        ...prev.croftCriteria,
        [criteriaKey]: {
          ...prev.croftCriteria[criteriaKey],
          [field]: value
        }
      }
    }));
  };

  const handleRemoveCroftCriteria = (criteriaKey: string) => {
    setEditableAdditionalData(prev => {
      const newCroftCriteria = { ...prev.croftCriteria };
      delete newCroftCriteria[criteriaKey];
      return {
        ...prev,
        croftCriteria: newCroftCriteria
      };
    });
  };

  // Function to generate Croft template based on selected grade
  const generateCroftTemplate = (grade: string) => {
    const baseTemplate = `For our patient who experienced an auto collision as their mechanism of injury, we will follow the croft treatment guidelines, as indicated in the Croft Treatment Guidelines, ICA Best Practices and the California Whiplash Guidelines IV. Motor Vehicle Accidents (MVAs) ICA decided to use the long-established Croft Cervical 
Acceleration/Deceleration (CAD) Guidelines for its basic Frequency and Duration Programs of Care for MVA victims. When developing her guidelines, Croft incorporated the stages of tissue repair. The stages of injury repair are defined in Table 14, Chapter 11 of the original guideline document. In MVAs, Croft originated 5 grades of injury during CAD and these Grades have been universally accepted in the literature.  
This patient most closely falls into a Grade ${grade}: As they show: `;

    let gradeSpecificText = '';
    let durationAndSessions = '';

    switch (grade) {
      case '1':
        gradeSpecificText = 'Minimal symptoms with no ligamentous injury.';
        durationAndSessions = 'Grade 1: 10 weeks, 21 sessions';
        break;
      case '2':
        gradeSpecificText = 'Limitation of range of motion and some ligamentous injury.';
        durationAndSessions = 'Grade 2: 29 weeks, 33 sessions';
        break;
      case '3':
        gradeSpecificText = 'Significant limitation of range of motion and ligamentous injury.';
        durationAndSessions = 'Grade 3: 56 weeks, 76 sessions';
        break;
      default:
        gradeSpecificText = 'Assessment pending grade selection.';
        durationAndSessions = 'Please select a grade to see duration and sessions.';
    }

    return baseTemplate + gradeSpecificText + ` This allocates a treatment duration and sessions as follows: ${durationAndSessions}.`;
  };

  // Function to handle grade selection and update template
  const handleCroftGradeChange = (grade: string) => {
    setCroftGrade(grade);
    const template = generateCroftTemplate(grade);
    setCroftTemplate(template);
  };

  // Handlers for severity checkboxes
  // Functions for pain radiating data management
  const addPainRadiatingIntake = (bodyPart: string, side: string) => {
    setPainRadiatingData(prev => ({
      ...prev,
      intakes: [
        ...prev.intakes,
        {
          bodyPart,
          side,
          severity: '',
          quality: [],
          timing: '',
          context: '',
          exacerbatedBy: [],
          symptoms: [],
          notes: ''
        }
      ]
    }));
  };

  const updatePainRadiatingIntake = (index: number, field: string, value: any) => {
    setPainRadiatingData(prev => {
      const updatedIntakes = [...prev.intakes];
      updatedIntakes[index] = {
        ...updatedIntakes[index],
        [field]: value
      };
      
      return {
        ...prev,
        intakes: updatedIntakes
      };
    });
  };

  const removePainRadiatingIntake = (index: number) => {
    setPainRadiatingData(prev => {
      const updatedIntakes = [...prev.intakes];
      updatedIntakes.splice(index, 1);
      
      return {
        ...prev,
        intakes: updatedIntakes
      };
    });
  };

  // Functions for ROM data management
  const addROMIntake = (bodyPart: string, side: string) => {
    setRomData(prev => ({
      ...prev,
      intakes: [
        ...prev.intakes,
        {
          bodyPart,
          side,
          percentage: '',
          status: '',
          notes: ''
        }
      ]
    }));
  };

  const updateROMIntake = (index: number, field: string, value: any) => {
    setRomData(prev => {
      const updatedIntakes = [...prev.intakes];
      updatedIntakes[index] = {
        ...updatedIntakes[index],
        [field]: value
      };
      
      return {
        ...prev,
        intakes: updatedIntakes
      };
    });
  };

  const removeROMIntake = (index: number) => {
    setRomData(prev => {
      const updatedIntakes = [...prev.intakes];
      updatedIntakes.splice(index, 1);
      
      return {
        ...prev,
        intakes: updatedIntakes
      };
    });
  };

  // Function to save pain radiating data to database
  const savePainRadiatingData = async () => {
    try {
      const payload = {
        painRadiating: JSON.stringify(painRadiatingData.intakes),
        painRadiatingAssessment: painRadiatingData.intakes
      };

      // Save to database immediately
      await axios.post('https://emr-h.onrender.com/api/visits/pain-radiating', {
        patientId: id,
        ...payload
      });

      console.log('Pain radiating data saved to database:', payload);
    } catch (error) {
      console.error('Error saving pain radiating data:', error);
      // Don't show error to user as this is a background save
    }
  };

  // Function to save ROM data to database
  const saveROMData = async () => {
    try {
      const payload = {
        romAssessment: romData.intakes
      };

      // Save to database immediately
      await axios.post('https://emr-h.onrender.com/api/visits/rom-assessment', {
        patientId: id,
        ...payload
      });

      console.log('ROM data saved to database:', payload);
    } catch (error) {
      console.error('Error saving ROM data:', error);
      // Don't show error to user as this is a background save
    }
  };

  // Function to fetch orthopedic tests data from followup visit
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

      // Update state for modal display
      setOrthoTestsData(orthoTestsData);
      setIsOrthosModalOpen(true);

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
      setHasOrthoTestsChanges(false);

    } catch (error) {
      console.error("Error fetching orthopedic tests data:", error);
      alert("Failed to load orthopedic tests data.");
    }
  };

  // Function to handle orthopedic test checkbox changes
  const handleOrthoTestChange = (region: string, testName: string, field: 'left' | 'right' | 'bilateral', checked: boolean) => {
    setOrthoTestSelections(prev => ({
      ...prev,
      [region]: {
        ...prev[region],
        [testName]: {
          ...prev[region]?.[testName],
          [field]: checked
        }
      }
    }));
    setHasOrthoTestsChanges(true);
  };

  // Function to fetch initial visit data for activities
  const fetchInitialVisitData = async (visitId: string) => {
    try {
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${visitId}`);
      const visitData = response.data;
      
      if (visitData) {
        setInitialVisitData(visitData);
        console.log('Initial visit data loaded:', visitData);
      }
    } catch (error) {
      console.error('Error fetching initial visit data:', error);
      alert('Failed to load initial visit data.');
    }
  };

  // Function to handle activities modal opening
  const handleActivitiesModalOpen = async () => {
    if (!lastFollowupVisit) {
      alert("No followup visit found. Please ensure there's a followup visit to load activities data.");
      return;
    }
    
    try {
      // Fetch initial visit data if not already loaded
      if (!initialVisitData) {
        await fetchInitialVisitData(lastFollowupVisit._id);
      }
      
      // Set the current activities data from form
      setActivitiesData(formData.activitiesCausePain || '');
      setIsActivitiesModalOpen(true);
    } catch (error) {
      console.error('Error opening activities modal:', error);
      alert('Failed to load activities data.');
    }
  };

  // Function to save activities data
  const handleSaveActivitiesData = async () => {
    if (!lastFollowupVisit) {
      alert('No followup visit found. Please create a followup visit first.');
      return;
    }

    try {
      // Update form data with the activities data
      setFormData(prev => ({
        ...prev,
        activitiesCausePain: activitiesData
      }));
      
      // Save to database by updating the existing followup visit
      const updateData = {
        activitiesCausePain: activitiesData
      };

      await axios.put(`https://emr-h.onrender.com/api/visits/${lastFollowupVisit._id}`, updateData);
      
      // Update local followup data
      setFollowupData((prev: any) => ({
        ...prev,
        ...updateData
      }));
      
      alert('Activities data saved successfully!');
      setIsActivitiesModalOpen(false);
    } catch (error) {
      console.error('Error saving activities data:', error);
      alert('Failed to save activities data.');
    }
  };

  // Function to save orthopedic tests data to database
  const saveOrthoTestsData = async () => {
    try {
      const payload = {
        orthoTestSelections: orthoTestSelections
      };

      // Save to database immediately
      await axios.post('https://emr-h.onrender.com/api/visits/ortho-tests', {
        patientId: id,
        ...payload
      });

      console.log('Orthopedic tests data saved to database:', payload);
      alert('Orthopedic tests data saved successfully to database!');
      setHasOrthoTestsChanges(false);
    } catch (error) {
      console.error('Error saving orthopedic tests data:', error);
      alert('Failed to save orthopedic tests data.');
    }
  };

  const handleSeverityChange = (section: 'tenderness' | 'spasm', region: string, severity: string, checked: boolean) => {
    setEditableAdditionalData(prev => {
      const sectionData = prev[section];
      const regionData = sectionData[region];
      
      if (!regionData) return prev;
      
      let newSeverities = [...(regionData.severities || [])];
      
      if (checked) {
        if (!newSeverities.includes(severity)) {
          newSeverities.push(severity);
        }
      } else {
        newSeverities = newSeverities.filter(s => s !== severity);
      }
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [region]: {
            ...regionData,
            severities: newSeverities
          }
        }
      };
    });
  };

  // Function to fetch and display last followup visit data in modal
  const fetchLastFollowupData = async () => {
    if (!lastFollowupVisit) {
      alert('No followup visit found. Please create a followup visit first.');
      return;
    }

    try {
      const response = await axios.get(`https://emr-h.onrender.com/api/visits/${lastFollowupVisit._id}`);
      const data = response.data;
      
      // Safely set followup data
      setFollowupData(data || {});
      
      // Initialize individual area status checkboxes
      const initialStatus: { [key: string]: { improving: boolean; exacerbated: boolean; same: boolean; resolved: boolean; } } = {};
      
      // Add status for each element that has data
      if (data?.musclePalpation) {
        initialStatus['musclePalpation'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.painRadiating) {
        initialStatus['painRadiating'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.romPercent) {
        initialStatus['romPercent'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.orthos?.tests || data?.orthos?.result) {
        initialStatus['orthos'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.activitiesCausePain) {
        initialStatus['activitiesCausePain'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.otherNotes) {
        initialStatus['otherNotes'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.muscleStrength && data.muscleStrength.length > 0) {
        initialStatus['muscleStrength'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.tenderness && Object.keys(data.tenderness).length > 0) {
        initialStatus['tenderness'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.spasm && Object.keys(data.spasm).length > 0) {
        initialStatus['spasm'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.ortho && Object.keys(data.ortho).length > 0) {
        initialStatus['ortho'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.arom && Object.keys(data.arom).length > 0) {
        initialStatus['arom'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data?.homeCareSuggestions) {
        initialStatus['homeCareSuggestions'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      
      setIndividualAreaStatus(initialStatus);
      
      // Initialize additional assessment data with default cervical, thoracic, lumbar regions
      const defaultTenderness = {
        cervical: { part: 'cervical', severities: [] },
        thoracic: { part: 'thoracic', severities: [] },
        lumbar: { part: 'lumbar', severities: [] },
        ...(data?.tenderness || {})
      };
      
      const defaultSpasm = {
        cervical: { part: 'cervical', severities: [] },
        thoracic: { part: 'thoracic', severities: [] },
        lumbar: { part: 'lumbar', severities: [] },
        ...(data?.spasm || {})
      };
      
      setEditableAdditionalData({
        tenderness: defaultTenderness,
        spasm: defaultSpasm,
        ortho: data?.ortho || {},
        arom: data?.arom || {},
        muscleStrength: data?.muscleStrength || [],
        activities: data?.activities || {},
        croftCriteria: data?.croftCriteria || {}
      });
      
      // Open modal to show followup data
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching followup visit data:', error);
      alert('Failed to load followup visit data.');
    }
  };

  // Helper function to render orthopedic test data specifically
  const renderOrthoTestData = (data: any): string => {
    console.log('Ortho Test Data:', data, typeof data);
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      const parts = [];
      
      // Handle left, right, bilateral properties that might be objects
      if (data.left !== undefined) {
        if (typeof data.left === 'object' && data.left !== null) {
          // If left is an object, try to extract meaningful data
          if (data.left.result !== undefined) parts.push(`Left: ${data.left.result}`);
          else if (data.left.value !== undefined) parts.push(`Left: ${data.left.value}`);
          else if (data.left.status !== undefined) parts.push(`Left: ${data.left.status}`);
          else parts.push(`Left: ${JSON.stringify(data.left)}`);
        } else {
          parts.push(`Left: ${data.left}`);
        }
      }
      
      if (data.right !== undefined) {
        if (typeof data.right === 'object' && data.right !== null) {
          if (data.right.result !== undefined) parts.push(`Right: ${data.right.result}`);
          else if (data.right.value !== undefined) parts.push(`Right: ${data.right.value}`);
          else if (data.right.status !== undefined) parts.push(`Right: ${data.right.status}`);
          else parts.push(`Right: ${JSON.stringify(data.right)}`);
        } else {
          parts.push(`Right: ${data.right}`);
        }
      }
      
      if (data.bilateral !== undefined) {
        if (typeof data.bilateral === 'object' && data.bilateral !== null) {
          if (data.bilateral.result !== undefined) parts.push(`Bilateral: ${data.bilateral.result}`);
          else if (data.bilateral.value !== undefined) parts.push(`Bilateral: ${data.bilateral.value}`);
          else if (data.bilateral.status !== undefined) parts.push(`Bilateral: ${data.bilateral.status}`);
          else parts.push(`Bilateral: ${JSON.stringify(data.bilateral)}`);
        } else {
          parts.push(`Bilateral: ${data.bilateral}`);
        }
      }
      
      if (data.result !== undefined) parts.push(`Result: ${data.result}`);
      if (data.details !== undefined) parts.push(`Details: ${data.details}`);
      if (data.name !== undefined) parts.push(`Name: ${data.name}`);
      
      if (parts.length > 0) return parts.join(' | ');
      
      // If no specific properties found, try to render all properties
      const allParts = Object.entries(data).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Try to extract meaningful data from nested objects
          const obj = value as any;
          if (obj.result !== undefined) return `${key}: ${obj.result}`;
          if (obj.value !== undefined) return `${key}: ${obj.value}`;
          if (obj.status !== undefined) return `${key}: ${obj.status}`;
          if (obj.text !== undefined) return `${key}: ${obj.text}`;
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      });
      if (allParts.length > 0) return allParts.join(' | ');
    }
    return safeRenderData(data);
  };

  // Helper function to render AROM data specifically
  const renderAromData = (data: any): string => {
    console.log('AROM Data:', data, typeof data);
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      const parts = [];
      
      // Handle left, right, bilateral properties that might be objects
      if (data.left !== undefined) {
        if (typeof data.left === 'object' && data.left !== null) {
          const obj = data.left as any;
          if (obj.result !== undefined) parts.push(`Left: ${obj.result}`);
          else if (obj.value !== undefined) parts.push(`Left: ${obj.value}`);
          else if (obj.status !== undefined) parts.push(`Left: ${obj.status}`);
          else parts.push(`Left: ${JSON.stringify(data.left)}`);
        } else {
          parts.push(`Left: ${data.left}`);
        }
      }
      
      if (data.right !== undefined) {
        if (typeof data.right === 'object' && data.right !== null) {
          const obj = data.right as any;
          if (obj.result !== undefined) parts.push(`Right: ${obj.result}`);
          else if (obj.value !== undefined) parts.push(`Right: ${obj.value}`);
          else if (obj.status !== undefined) parts.push(`Right: ${obj.status}`);
          else parts.push(`Right: ${JSON.stringify(data.right)}`);
        } else {
          parts.push(`Right: ${data.right}`);
        }
      }
      
      if (data.bilateral !== undefined) {
        if (typeof data.bilateral === 'object' && data.bilateral !== null) {
          const obj = data.bilateral as any;
          if (obj.result !== undefined) parts.push(`Bilateral: ${obj.result}`);
          else if (obj.value !== undefined) parts.push(`Bilateral: ${obj.value}`);
          else if (obj.status !== undefined) parts.push(`Bilateral: ${obj.status}`);
          else parts.push(`Bilateral: ${JSON.stringify(data.bilateral)}`);
        } else {
          parts.push(`Bilateral: ${data.bilateral}`);
        }
      }
      
      if (data.range !== undefined) parts.push(`Range: ${data.range}`);
      if (data.quality !== undefined) parts.push(`Quality: ${data.quality}`);
      if (data.pain !== undefined) parts.push(`Pain: ${data.pain}`);
      
      if (parts.length > 0) return parts.join(' | ');
      
      // If no specific properties found, try to render all properties
      const allParts = Object.entries(data).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          const obj = value as any;
          if (obj.result !== undefined) return `${key}: ${obj.result}`;
          if (obj.value !== undefined) return `${key}: ${obj.value}`;
          if (obj.status !== undefined) return `${key}: ${obj.status}`;
          if (obj.text !== undefined) return `${key}: ${obj.text}`;
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      });
      if (allParts.length > 0) return allParts.join(' | ');
    }
    return safeRenderData(data);
  };

  // Helper function to safely render data as human-readable string
  const safeRenderData = (data: any): string => {
    if (data === null || data === undefined) return 'N/A';
    if (typeof data === 'string') return data;
    if (typeof data === 'number') return String(data);
    if (typeof data === 'boolean') return data ? 'Yes' : 'No';
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'object') {
      // Handle specific object types for better readability
      if (data.left !== undefined || data.right !== undefined || data.bilateral !== undefined) {
        const parts = [];
        if (data.left !== undefined) parts.push(`Left: ${data.left}`);
        if (data.right !== undefined) parts.push(`Right: ${data.right}`);
        if (data.bilateral !== undefined) parts.push(`Bilateral: ${data.bilateral}`);
        return parts.join(' | ');
      }
      if (data.name !== undefined || data.severity !== undefined || data.frequency !== undefined) {
        const parts = [];
        if (data.name !== undefined) parts.push(`Name: ${data.name}`);
        if (data.severity !== undefined) parts.push(`Severity: ${data.severity}`);
        if (data.frequency !== undefined) parts.push(`Frequency: ${data.frequency}`);
        return parts.join(' | ');
      }
      if (data.grade !== undefined || data.treatmentGuideline !== undefined) {
        const parts = [];
        if (data.grade !== undefined) parts.push(`Grade: ${data.grade}`);
        if (data.frequency !== undefined) parts.push(`Frequency: ${data.frequency}`);
        if (data.treatmentGuideline !== undefined) parts.push(`Treatment: ${data.treatmentGuideline}`);
        if (data.notes !== undefined) parts.push(`Notes: ${data.notes}`);
        return parts.join(' | ');
      }
      // For other objects, try to make them readable
      const entries = Object.entries(data);
      if (entries.length === 0) return 'Empty';
      return entries.map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}: ${safeRenderData(value)}`;
        }
        return `${key}: ${value}`;
      }).join(' | ');
    }
    return 'N/A';
  };

  // Function to apply followup data to form
  const applyFollowupData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      areasImproving: followupData.areasImproving || false,
      areasExacerbated: followupData.areasExacerbated || false,
      areasSame: followupData.areasSame || false,
      areasResolved: followupData.areasResolved || false,
      musclePalpation: followupData.musclePalpation || '',
      painRadiating: followupData.painRadiating || '',
      romPercent: followupData.romPercent || '',
      romWnlNoPain: followupData.romWnlNoPain || false,
      romWnlWithPain: followupData.romWnlWithPain || false,
      romImproved: followupData.romImproved || false,
      romDecreased: followupData.romDecreased || false,
      romSame: followupData.romSame || false,
      orthos: {
        tests: followupData.orthos?.tests || '',
        result: followupData.orthos?.result || ''
      },
      ortho: followupData.ortho || {},
      activitiesCausePain: followupData.activitiesCausePain || '',
      otherNotes: followupData.otherNotes || '',
      muscleStrength: followupData.muscleStrength || [],
      tenderness: followupData.tenderness || {},
      spasm: followupData.spasm || {},
      diagnosticStudy: {
        study: followupData.diagnosticStudy?.study || '',
        bodyPart: followupData.diagnosticStudy?.bodyPart || '',
        result: followupData.diagnosticStudy?.result || ''
      },
      homeCareSuggestions: followupData.homeCareSuggestions || ''
    }));

    // Store individual area status in form data for later use
    setFormData((prev: FormData) => ({
      ...prev,
      individualAreaStatus: individualAreaStatus,
      tenderness: editableAdditionalData.tenderness || {},
      spasm: editableAdditionalData.spasm || {},
      ortho: editableAdditionalData.ortho || {},
      arom: editableAdditionalData.arom || {},
      muscleStrength: editableAdditionalData.muscleStrength || [],
      activities: editableAdditionalData.activities || {},
      croftCriteria: editableAdditionalData.croftCriteria || {}
    }));

    setIsModalOpen(false);
    alert('Data applied from last followup visit successfully!');
  };

  // Function to save muscle assessment data to database
  const saveMusclePalpationData = async () => {
    if (!lastFollowupVisit) return;

    try {
      const updateData = {
        muscleStrength: editableAdditionalData.muscleStrength,
        tenderness: editableAdditionalData.tenderness,
        spasm: editableAdditionalData.spasm
      };

      await axios.put(`https://emr-h.onrender.com/api/visits/${lastFollowupVisit._id}`, updateData);
      
      // Update local followup data
      setFollowupData((prev: any) => ({
        ...prev,
        ...updateData
      }));
      
      alert('Muscle assessment data saved successfully!');
    } catch (error) {
      console.error('Error saving muscle assessment data:', error);
      alert('Failed to save muscle assessment data.');
    }
  };

  // Function to save orthos data to database
  const saveOrthosData = async () => {
    if (!lastFollowupVisit) return;

    try {
      const updateData = {
        ortho: editableAdditionalData.ortho
      };

      await axios.put(`https://emr-h.onrender.com/api/visits/${lastFollowupVisit._id}`, updateData);
      
      // Update local followup data
      setFollowupData((prev: any) => ({
        ...prev,
        ...updateData
      }));
      
      alert('Orthos data saved successfully!');
    } catch (error) {
      console.error('Error saving orthos data:', error);
      alert('Failed to save orthos data.');
    }
  };

  // Function to save activities data to database
  const saveActivitiesData = async () => {
    if (!lastFollowupVisit) return;

    try {
      const updateData = {
        activities: editableAdditionalData.activities
      };

      await axios.put(`https://emr-h.onrender.com/api/visits/${lastFollowupVisit._id}`, updateData);
      
      // Update local followup data
      setFollowupData((prev: any) => ({
        ...prev,
        ...updateData
      }));
      
      alert('Activities data saved successfully!');
    } catch (error) {
      console.error('Error saving activities data:', error);
      alert('Failed to save activities data.');
    }
  };

  // Function to apply muscle palpation data to form
  const applyMusclePalpationData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      musclePalpation: followupData.musclePalpation || '',
      muscleStrength: editableAdditionalData.muscleStrength || [],
      tenderness: editableAdditionalData.tenderness || {},
      spasm: editableAdditionalData.spasm || {}
    }));

    setIsMuscleModalOpen(false);
    alert('Muscle palpation data applied successfully!');
  };

  // Function to apply orthos data to form
  const applyOrthosData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      orthos: {
        tests: Object.values(editableAdditionalData.ortho).map((test: any) => test.name).join(', '),
        result: Object.values(editableAdditionalData.ortho).map((test: any) => test.result).join(', ')
      }
    }));

    setIsOrthosModalOpen(false);
    alert('Orthos data applied successfully!');
  };

  // Function to apply activities data to form
  const applyActivitiesData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      activitiesCausePain: Object.values(editableAdditionalData.activities).map((activity: any) => activity.name).join(', ')
    }));

    setIsActivitiesModalOpen(false);
    alert('Activities data applied successfully!');
  };

  // Function to save Croft Criteria data to database
  const saveCroftCriteriaData = async () => {
    if (!lastFollowupVisit) return;

    try {
      const updateData = {
        croftCriteria: editableAdditionalData.croftCriteria
      };

      await axios.put(`https://emr-h.onrender.com/api/visits/${lastFollowupVisit._id}`, updateData);
      
      // Update local followup data
      setFollowupData((prev: any) => ({
        ...prev,
        ...updateData
      }));
      
      alert('Croft Criteria data saved successfully!');
    } catch (error) {
      console.error('Error saving Croft Criteria data:', error);
      alert('Failed to save Croft Criteria data.');
    }
  };

  // Function to apply Croft Criteria data to form
  const applyCroftCriteriaData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      croftCriteria: Object.values(editableAdditionalData.croftCriteria).map((criteria: any) => 
        `Grade ${criteria.grade} - ${criteria.frequency} - ${criteria.treatmentGuideline}`
      ).join('; ')
    }));

    setIsCroftModalOpen(false);
    alert('Croft Criteria data applied successfully!');
  };



  // Function to apply croft criteria data to form
  const applyCroftData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      croftCriteria: followupData.croftCriteria || ''
    }));

    setIsCroftModalOpen(false);
    alert('Croft Criteria data applied successfully!');
  };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);

  try {
    // Create payload matching the discharge visit schema
    const payload = {
      visitType: 'discharge',
      patient: id,
      
      // Required fields from schema
      areasImproving: formData.areasImproving || false,
      areasExacerbated: formData.areasExacerbated || false,
      areasSame: formData.areasSame || false,
      areasResolved: formData.areasResolved || false,
      
      // Assessment fields
      musclePalpation: formData.musclePalpation || '',
      painRadiating: formData.painRadiating || '',
      painRadiatingAssessment: formData.painRadiatingAssessment || [],
      romPercent: formData.romPercent ? Number(formData.romPercent) : undefined,
      romAssessment: formData.romAssessment || [],
      
      // ROM fields
      romWnlNoPain: formData.romWnlNoPain || false,
      romWnlWithPain: formData.romWnlWithPain || false,
      romImproved: formData.romImproved || false,
      romDecreased: formData.romDecreased || false,
      romSame: formData.romSame || false,
      
      // Orthos data
      orthos: {
        tests: formData.orthos?.tests || '',
        result: formData.orthos?.result || ''
      },
      ortho: editableAdditionalData.ortho || {},
      arom: editableAdditionalData.arom || {},
      
      // Activities and notes
      activitiesCausePain: formData.activitiesCausePain || '',
      otherNotes: formData.otherNotes || '',
      
      // Assessment and plan
      prognosis: formData.prognosis || '',
      prognosisPlateau: formData.prognosisPlateau || false,
      prognosisMaxBenefits: formData.prognosisMaxBenefits || false,
      diagnosticStudy: {
        study: formData.diagnosticStudy?.study || '',
        bodyPart: formData.diagnosticStudy?.bodyPart || '',
        result: formData.diagnosticStudy?.result || ''
      },
      futureMedicalCare: formData.futureMedicalCare || [],
      croftCriteria: formData.croftCriteria || '',
      homeCare: formData.homeCare || [],
      referralsNotes: formData.referralsNotes || '',
      
      // Additional assessment data
      muscleStrength: Array.isArray(editableAdditionalData.muscleStrength) ? editableAdditionalData.muscleStrength : [],
      tenderness: editableAdditionalData.tenderness || {},
      spasm: editableAdditionalData.spasm || {},
      homeCareSuggestions: formData.homeCareSuggestions || ''
    };

    console.log('Sending discharge form data:', payload);

    const response = await axios.post('https://emr-h.onrender.com/api/visits', payload);
    
    console.log('Response:', response.data);

    alert('Discharge form submitted successfully! All assessment data has been saved to the database.');
    navigate(`/patients/${id}`);
  } catch (err: any) {
    console.error('Error submitting form', err);
    
    // Log more detailed error information
    if (err.response) {
      console.error('Error response:', err.response.data);
      console.error('Error status:', err.response.status);
      
      // Log specific validation errors if they exist
      if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
        console.error('Validation errors:', err.response.data.errors);
        const errorMessages = err.response.data.errors.map((error: any) => 
          `${error.field || 'Unknown field'}: ${error.message || error}`
        ).join('\n');
        alert(`Form submission failed:\n${errorMessages}`);
      } else {
        alert(`Form submission failed: ${err.response.data?.message || 'Server error'}`);
      }
    } else if (err.request) {
      console.error('Error request:', err.request);
      alert('Form submission failed: Network error');
    } else {
      alert('Form submission failed: Unknown error');
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
          <h1 className="text-2xl font-semibold text-gray-800">EXAM FORM---DISCHARGE</h1>
          <p className="text-gray-600">
            Patient: {patient.firstName} {patient.lastName}
          </p>
          <p className="text-gray-600">
            Date: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Side by Side View Toggle */}
      {showSideBySide && followupData && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Previous Followup Data</h3>
                <p className="text-blue-600 text-sm">Review and compare with current form fields</p>
              </div>
            </div>
            <button
              onClick={() => setShowSideBySide(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close Side View
            </button>
          </div>
        </div>
      )}

      <div className={`${showSideBySide ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
        {/* Current Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 relative">
        <div className="space-y-6">
          {/* Areas Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Areas:</label>
            <button
              type="button"
              onClick={fetchLastFollowupData}
              className="bg-white text-blue-600 font-medium underline hover:text-blue-800 focus:outline-none mb-4"
            >
              Auto generated from Reeval
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


          {/* Pain Radiating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pain Radiating:</label>
                    <button
          type="button"
              onClick={() => setIsPainRadiatingModalOpen(true)}
          className="bg-white text-purple-600 font-medium underline hover:text-purple-800 focus:outline-none mb-4"
        >
              Add Body Parts for Pain Radiating Assessment
        </button>
          </div>

          {/* ROM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ROM:</label>
            <button
              type="button"
              onClick={() => setIsROMModalOpen(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <span className="mr-2">ROM Assessment</span>
              <span className="text-green-600">✓</span>
            </button>
            {formData.romAssessment && formData.romAssessment.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {formData.romAssessment.length} body part(s) assessed
            </div>
            )}
          </div>

          {/* Orthos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orthos:</label>
            <button
              type="button"
              onClick={() => {
                if (lastFollowupVisit) {
                  fetchOrthoTestsData(lastFollowupVisit._id);
                } else {
                  alert("No followup visit found. Please ensure there's a followup visit to load orthopedic tests data.");
                }
              }}
              className={`bg-white font-medium underline focus:outline-none ${
                hasOrthoTestsChanges ? 'text-orange-600 hover:text-orange-800' :
                orthoTestsData && Object.keys(orthoTestsData).length > 0 ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              List of tests specific for body part {orthoTestsData && Object.keys(orthoTestsData).length > 0 && (hasOrthoTestsChanges ? '⚠️' : '✓')}
            </button>
          </div>

          {/* Activities that still cause pain */}
          <div>
            <label htmlFor="activitiesCausePain" className="block text-sm font-medium text-gray-700 mb-1">Activities that still cause pain:</label>
            <button
              type="button"
              onClick={handleActivitiesModalOpen}
              className={`bg-white font-medium underline focus:outline-none ${
                activitiesData ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              List of things specific to selected body part {activitiesData && '✓'}
            </button>
          </div>

          {/* Other Notes */}
          <div>
            <label htmlFor="otherNotes" className="block text-sm font-medium text-gray-700 mb-1">Other Notes:</label>
            <textarea 
              id="otherNotes"
              name="otherNotes" 
              value={formData.otherNotes} 
              onChange={handleChange} 
              placeholder="Other Notes" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">ASSESSMENT AND PLAN</h2>

          {/* Prognosis */}
          <div>
            <label htmlFor="prognosis" className="block text-sm font-medium text-gray-700 mb-1">Prognosis:</label>
            <select 
              id="prognosis"
              name="prognosis" 
              value={formData.prognosis} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Prognosis</option>
              <option value="excellent">Excellent - Full recovery expected</option>
              <option value="good">Good - Significant improvement expected</option>
              <option value="fair">Fair - Moderate improvement expected</option>
              <option value="guarded">Guarded - Limited improvement expected</option>
              <option value="poor">Poor - Minimal improvement expected</option>
            </select>
            
            {/* Prognosis Checkboxes */}
            <div className="mt-4 space-y-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="prognosisPlateau"
                  name="prognosisPlateau"
                  checked={formData.prognosisPlateau}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="prognosisPlateau" className="ml-3 text-sm text-gray-700">
                  The patient has reached a plateau in her recovery. She remains symptomatic due to the extensive injuries sustained.
                </label>
              </div>
              
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="prognosisMaxBenefits"
                  name="prognosisMaxBenefits"
                  checked={formData.prognosisMaxBenefits}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="prognosisMaxBenefits" className="ml-3 text-sm text-gray-700">
                  The patient has received maximum benefits from the given treatment and therefore, will be discharged from care.
                </label>
              </div>
            </div>
          </div>

          {/* Review of diagnostic study */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review of diagnostic study with the patient:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="diagnosticStudy.study" className="block text-xs text-gray-500 mb-1">Study</label>
                <select
                  id="diagnosticStudy.study"
                  name="diagnosticStudy.study"
                  value={formData.diagnosticStudy.study}
                  onChange={(e) => handleNestedChange('diagnosticStudy', 'study', e.target.value)}
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
                  onChange={(e) => handleNestedChange('diagnosticStudy', 'bodyPart', e.target.value)}
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
                <label htmlFor="diagnosticStudy.result" className="block text-xs text-gray-500 mb-1">Result</label>
                <input
                  type="text"
                  id="diagnosticStudy.result"
                  value={formData.diagnosticStudy.result}
                  onChange={(e) => handleNestedChange('diagnosticStudy', 'result', e.target.value)}
                  placeholder="Result"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Croft Criteria */}
          <div>
            <label htmlFor="croftCriteria" className="block text-sm font-medium text-gray-700 mb-1">Croft Criteria: Grade (1,2,3) Frequency of Treatment Guideline Placement</label>
            <button
              type="button"
              onClick={() => setIsCroftModalOpen(true)}
              className="bg-white text-teal-600 font-medium underline hover:text-teal-800 focus:outline-none mb-4"
            >
              Grade
            </button>
          </div>


          {/* Referrals / Recommendations / Notes */}
          <div>
            <label htmlFor="referralsNotes" className="block text-sm font-medium text-gray-700 mb-1">Referrals / Recommendations / Notes:</label>
            <textarea 
              id="referralsNotes"
              name="referralsNotes" 
              value={formData.referralsNotes} 
              onChange={handleChange} 
              placeholder="Referrals / Recommendations / Notes" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
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
              disabled={isSaving || isGeneratingNarrative}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Submitting...
                </>
              ) : isGeneratingNarrative ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Generating Narrative...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </button>
                     </div>
         </div>
       </form>

        {/* Previous Data Side Panel */}
        {showSideBySide && followupData && (() => {
          try {
            return (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-md">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Previous Followup Data</h3>
              <p className="text-blue-600 text-sm">Click "Apply to Form" to copy data to current form</p>
            </div>

            <div className="space-y-6">
              {/* Areas Status */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Areas Status</h4>
                <div className="space-y-2">
                  {Object.entries(individualAreaStatus).map(([element, status]) => (
                    <div key={element} className="border border-gray-200 rounded p-3">
                      <h5 className="font-medium text-gray-700 mb-2 capitalize">
                        {element.replace(/([A-Z])/g, ' $1').trim()}
                      </h5>
                      <div className="flex space-x-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={status.improving}
                            onChange={(e) => handleIndividualAreaStatusChange(element, 'improving', e.target.checked)}
                            className="mr-1 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-xs font-medium text-green-700">Improving</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={status.exacerbated}
                            onChange={(e) => handleIndividualAreaStatusChange(element, 'exacerbated', e.target.checked)}
                            className="mr-1 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs font-medium text-red-700">Exacerbated</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={status.same}
                            onChange={(e) => handleIndividualAreaStatusChange(element, 'same', e.target.checked)}
                            className="mr-1 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="text-xs font-medium text-yellow-700">Same</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={status.resolved}
                            onChange={(e) => handleIndividualAreaStatusChange(element, 'resolved', e.target.checked)}
                            className="mr-1 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-blue-700">Resolved</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Previous Data Display */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Previous Visit Data</h4>
                <div className="space-y-4">
                  {followupData.musclePalpation && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Muscle Palpation
                      </h5>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-700">{followupData.musclePalpation}</p>
                      </div>
                    </div>
                  )}
                  {followupData.painRadiating && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Pain Radiating
                      </h5>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-sm text-gray-700">{followupData.painRadiating}</p>
                      </div>
                    </div>
                  )}
                  {followupData.romPercent && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Range of Motion (ROM)
                      </h5>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700 font-semibold">{followupData.romPercent}% of pre-injury status</p>
                      </div>
                    </div>
                  )}
                  {followupData.muscleStrength && followupData.muscleStrength.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        Muscle Strength Assessment
                      </h5>
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                        <div className="space-y-1">
                          {followupData.muscleStrength.map((muscle: string, index: number) => (
                            <div key={index} className="text-sm text-gray-700 flex items-center">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                              {muscle}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Orthos Tests - Enhanced Display */}
                  {(followupData.orthos?.tests || followupData.ortho || (editableAdditionalData.ortho && Object.keys(editableAdditionalData.ortho).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Orthopedic Tests
                      </h5>
                      {followupData.orthos?.tests ? (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-sm text-gray-700">{followupData.orthos.tests}</p>
                        </div>
                      ) : followupData.ortho && Object.keys(followupData.ortho).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(followupData.ortho).map(([test, data]: [string, any]) => (
                            <div key={test} className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="font-semibold text-green-700 mb-1">{test}</div>
                              <div className="text-sm text-gray-700">
                                {renderOrthoTestData(data)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editableAdditionalData.ortho && Object.entries(editableAdditionalData.ortho).map(([test, data]: [string, any]) => (
                            <div key={test} className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="font-semibold text-green-700 mb-1">{data.name || test.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-sm text-gray-700">
                                Result: {data.result || 'N/A'}
                                {data.details && <div className="mt-1">Details: {data.details}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activities Causing Pain - Enhanced Display */}
                  {(followupData.activitiesCausePain || followupData.activities || (editableAdditionalData.activities && Object.keys(editableAdditionalData.activities).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Activities Causing Pain
                      </h5>
                      {followupData.activitiesCausePain ? (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-sm text-gray-700">{followupData.activitiesCausePain}</p>
                        </div>
                      ) : followupData.activities && Object.keys(followupData.activities).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(followupData.activities).map(([activity, data]: [string, any]) => (
                            <div key={activity} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="font-semibold text-orange-700 mb-1">{activity}</div>
                              <div className="text-sm text-gray-700">
                                {safeRenderData(data)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editableAdditionalData.activities && Object.entries(editableAdditionalData.activities).map(([activity, data]: [string, any]) => (
                            <div key={activity} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="font-semibold text-orange-700 mb-1">{data.name || activity.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-sm text-gray-700">
                                Severity: {data.severity || 'N/A'}
                                {data.frequency && <div className="mt-1">Frequency: {data.frequency}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {followupData.otherNotes && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                        Other Notes
                      </h5>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">{followupData.otherNotes}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Croft Criteria - Enhanced Display */}
                  {(followupData.croftCriteria || Object.keys(editableAdditionalData.croftCriteria).length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                        Croft Criteria Assessment
                      </h5>
                      {followupData.croftCriteria ? (
                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                          <p className="text-sm text-gray-700">{followupData.croftCriteria}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editableAdditionalData.croftCriteria && Object.entries(editableAdditionalData.croftCriteria).map(([criteria, data]: [string, any]) => (
                            <div key={criteria} className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                              <div className="font-semibold text-teal-700 mb-1">Grade {data.grade || 'N/A'}</div>
                              <div className="text-sm text-gray-700">
                                Frequency: {data.frequency || 'N/A'}
                                {data.treatmentGuideline && <div className="mt-1">Treatment: {data.treatmentGuideline}</div>}
                                {data.notes && <div className="mt-1">Notes: {data.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Assessment Data */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Additional Assessment Data</h4>
                <div className="space-y-3">
                  {/* Tenderness */}
                  {((editableAdditionalData.tenderness && Object.keys(editableAdditionalData.tenderness).length > 0) || (followupData.tenderness && Object.keys(followupData.tenderness).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Tenderness:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.tenderness && Object.keys(followupData.tenderness).length > 0 && 
                          Object.entries(followupData.tenderness).map(([region, data]: [string, any]) => (
                            <div key={region} className="bg-gray-50 p-3 rounded text-sm border-l-4 border-red-200">
                              <div className="font-semibold text-red-700 capitalize mb-1">{region} Region</div>
                              <div className="text-gray-700">
                                {safeRenderData(data)}
                              </div>
                            </div>
                          ))
                        }
                        {/* Show editable data */}
                        {editableAdditionalData.tenderness && Object.keys(editableAdditionalData.tenderness).length > 0 && 
                          Object.entries(editableAdditionalData.tenderness).map(([region, data]: [string, any]) => (
                            <div key={region} className="bg-gray-50 p-2 rounded text-sm">
                              <span className="font-medium">{data.part || region}:</span> 
                              {data.severities && data.severities.length > 0 ? data.severities.join(', ') : (data.severity || 'N/A')}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Spasm */}
                  {((editableAdditionalData.spasm && Object.keys(editableAdditionalData.spasm).length > 0) || (followupData.spasm && Object.keys(followupData.spasm).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Spasm:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.spasm && Object.keys(followupData.spasm).length > 0 && 
                          Object.entries(followupData.spasm).map(([region, data]: [string, any]) => (
                            <div key={region} className="bg-gray-50 p-3 rounded text-sm border-l-4 border-orange-200">
                              <div className="font-semibold text-orange-700 capitalize mb-1">{region} Region</div>
                              <div className="text-gray-700">
                                {safeRenderData(data)}
                              </div>
                            </div>
                          ))
                        }
                        {/* Show editable data */}
                        {editableAdditionalData.spasm && Object.keys(editableAdditionalData.spasm).length > 0 && 
                          Object.entries(editableAdditionalData.spasm).map(([region, data]: [string, any]) => (
                            <div key={region} className="bg-gray-50 p-2 rounded text-sm">
                              <span className="font-medium">{data.part || region}:</span> 
                              {data.severities && data.severities.length > 0 ? data.severities.join(', ') : (data.severity || 'N/A')}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Ortho Tests */}
                  {((editableAdditionalData.ortho && Object.keys(editableAdditionalData.ortho).length > 0) || (followupData.ortho && Object.keys(followupData.ortho).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Ortho Tests:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.ortho && Object.keys(followupData.ortho).length > 0 && 
                          Object.entries(followupData.ortho).map(([test, data]: [string, any]) => (
                            <div key={test} className="bg-gray-50 p-3 rounded text-sm border-l-4 border-green-200">
                              <div className="font-semibold text-green-700 mb-1">{test}</div>
                              <div className="text-gray-700 text-sm">
                                {renderOrthoTestData(data)}
                              </div>
                            </div>
                          ))
                        }
                        {/* Show editable data */}
                        {editableAdditionalData.ortho && Object.keys(editableAdditionalData.ortho).length > 0 && 
                          Object.entries(editableAdditionalData.ortho).map(([test, data]: [string, any]) => (
                            <div key={test} className="bg-gray-50 p-3 rounded text-sm">
                              <div className="font-medium text-gray-800 mb-1">{data.name || test.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="space-y-1 text-xs">
                                <div><span className="font-medium">Result:</span> <span className={`px-2 py-1 rounded text-xs ${
                                  data.result === 'Positive' ? 'bg-red-100 text-red-800' :
                                  data.result === 'Negative' ? 'bg-green-100 text-green-800' :
                                  data.result === 'Equivocal' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{data.result || 'Not specified'}</span></div>
                                {data.details && (
                                  <div><span className="font-medium">Details:</span> {data.details}</div>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {((editableAdditionalData.activities && Object.keys(editableAdditionalData.activities).length > 0) || (followupData.activities && Object.keys(followupData.activities).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Activities Causing Pain:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.activities && Object.keys(followupData.activities).length > 0 && 
                          Object.entries(followupData.activities).map(([activity, data]: [string, any]) => (
                            <div key={activity} className="bg-gray-50 p-3 rounded text-sm border-l-4 border-orange-200">
                              <div className="font-semibold text-orange-700 mb-1">{activity}</div>
                              <div className="text-gray-700 text-sm">
                                {safeRenderData(data)}
                              </div>
                            </div>
                          ))
                        }
                        {/* Show editable data */}
                        {editableAdditionalData.activities && Object.keys(editableAdditionalData.activities).length > 0 && 
                          Object.entries(editableAdditionalData.activities).map(([activity, data]: [string, any]) => (
                            <div key={activity} className="bg-gray-50 p-3 rounded text-sm">
                              <div className="font-medium text-gray-800 mb-1">{data.name || activity.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="space-y-1 text-xs">
                                <div><span className="font-medium">Severity:</span> <span className={`px-2 py-1 rounded text-xs ${
                                  data.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                                  data.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                                  data.severity === 'Mild' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{data.severity || 'Not specified'}</span></div>
                                {data.frequency && (
                                  <div><span className="font-medium">Frequency:</span> <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">{data.frequency}</span></div>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Croft Criteria */}
                  {((editableAdditionalData.croftCriteria && Object.keys(editableAdditionalData.croftCriteria).length > 0) || followupData.croftCriteria) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Croft Criteria:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.croftCriteria && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <div className="font-medium text-gray-800 mb-1">Database Data</div>
                            <div className="text-xs text-gray-600">{followupData.croftCriteria}</div>
                          </div>
                        )}
                        {/* Show editable data */}
                        {editableAdditionalData.croftCriteria && Object.keys(editableAdditionalData.croftCriteria).length > 0 && 
                          Object.entries(editableAdditionalData.croftCriteria).map(([criteria, data]: [string, any]) => (
                            <div key={criteria} className="bg-gray-50 p-3 rounded text-sm">
                              <div className="font-medium text-gray-800 mb-1">{criteria.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="space-y-1 text-xs">
                                <div><span className="font-medium">Grade:</span> <span className="px-2 py-1 rounded text-xs bg-teal-100 text-teal-800">Grade {data.grade || 'N/A'}</span></div>
                                {data.frequency && (
                                  <div><span className="font-medium">Frequency:</span> <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">{data.frequency}</span></div>
                                )}
                                {data.treatmentGuideline && (
                                  <div><span className="font-medium">Treatment Guideline:</span> <span className="text-gray-600">{data.treatmentGuideline}</span></div>
                                )}
                                {data.notes && (
                                  <div><span className="font-medium">Notes:</span> <span className="text-gray-600">{data.notes}</span></div>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Muscle Strength */}
                  {(editableAdditionalData.muscleStrength && editableAdditionalData.muscleStrength.length > 0) || (followupData.muscleStrength && followupData.muscleStrength.length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Muscle Strength:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.muscleStrength && followupData.muscleStrength.length > 0 && 
                          followupData.muscleStrength.map((muscle: string, index: number) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                              <span className="font-medium">• {muscle}</span>
                            </div>
                          ))
                        }
                        {/* Show editable data */}
                        {editableAdditionalData.muscleStrength && editableAdditionalData.muscleStrength.length > 0 && 
                          editableAdditionalData.muscleStrength.map((muscle: string, index: number) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                              <span className="font-medium">• {muscle}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* AROM */}
                  {((editableAdditionalData.arom && Object.keys(editableAdditionalData.arom).length > 0) || (followupData.arom && Object.keys(followupData.arom).length > 0)) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">AROM:</h5>
                      <div className="space-y-2">
                        {/* Show data from database first */}
                        {followupData.arom && Object.keys(followupData.arom).length > 0 && 
                          Object.entries(followupData.arom).map(([movement, data]: [string, any]) => (
                            <div key={movement} className="bg-gray-50 p-3 rounded text-sm border-l-4 border-blue-200">
                              <div className="font-semibold text-blue-700 capitalize mb-1">{movement.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-gray-700 text-sm">
                                {renderAromData(data)}
                              </div>
                            </div>
                          ))
                        }
                        {/* Show editable data */}
                        {editableAdditionalData.arom && Object.keys(editableAdditionalData.arom).length > 0 && 
                          Object.entries(editableAdditionalData.arom).map(([movement, data]: [string, any]) => (
                            <div key={movement} className="bg-gray-50 p-2 rounded text-sm">
                              <span className="font-medium">{movement.replace(/([A-Z])/g, ' $1').trim()}:</span> {data.range || 'N/A'} - {data.quality || 'N/A'} - {data.pain || 'N/A'}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-4">
                <button
                  onClick={applyFollowupData}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
                >
                  Apply to Form
                </button>
              </div>
            </div>
          </div>
            );
          } catch (error) {
            console.error('Error rendering side panel:', error);
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
                  <p className="text-red-600 text-sm">There was an error loading the previous visit data. Please try again.</p>
                </div>
                <button
                  onClick={() => setShowSideBySide(false)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            );
          }
        })()}
      </div>

       {/* Followup Data Modal */}
       {isModalOpen && followupData && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
             {/* Header */}
             <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl">
               <div className="flex justify-between items-center">
                 <div>
                   <h3 className="text-xl font-bold">Last Followup Visit Data</h3>
                   <p className="text-blue-100 text-sm mt-1">Review and apply data to current discharge form</p>
                 </div>
                 <button
                   onClick={() => setIsModalOpen(false)}
                   className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-blue-600"
                 >
                   <X className="h-6 w-6" />
                 </button>
               </div>
             </div>

             {/* Content */}
             <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
               <div className="space-y-6">
                 {/* Header with instructions */}
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <h4 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h4>
                   <p className="text-blue-700 text-sm">
                     Review the data from the last followup visit and select the appropriate status for each element using the checkboxes: 
                     <span className="font-semibold"> Improving</span>, 
                     <span className="font-semibold"> Exacerbated</span>, 
                     <span className="font-semibold"> Same</span>, or 
                     <span className="font-semibold"> Resolved</span>
                   </p>
                 </div>

                 {/* Data Elements with Status Checkboxes */}
                 <div className="space-y-4">
                   {/* Muscle Palpation */}
                   {followupData.musclePalpation && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Muscle Palpation</h5>
                           <p className="text-gray-700 text-sm leading-relaxed">{followupData.musclePalpation}</p>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['musclePalpation']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('musclePalpation', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['musclePalpation']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('musclePalpation', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['musclePalpation']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('musclePalpation', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['musclePalpation']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('musclePalpation', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Pain Radiating */}
                   {followupData.painRadiating && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Pain Radiating</h5>
                           <p className="text-gray-700 text-sm leading-relaxed">{followupData.painRadiating}</p>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['painRadiating']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('painRadiating', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['painRadiating']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('painRadiating', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['painRadiating']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('painRadiating', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['painRadiating']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('painRadiating', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* ROM Percent */}
                   {followupData.romPercent && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">ROM Percentage</h5>
                           <p className="text-gray-700 text-sm">ROM % Pre-injury: <span className="font-semibold">{followupData.romPercent}%</span></p>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['romPercent']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('romPercent', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['romPercent']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('romPercent', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['romPercent']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('romPercent', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['romPercent']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('romPercent', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Orthopedic Tests */}
                   {(followupData.orthos?.tests || followupData.orthos?.result) && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Orthopedic Tests</h5>
                           <div className="space-y-1">
                             {followupData.orthos?.tests && (
                               <p className="text-gray-700 text-sm"><span className="font-medium">Tests:</span> {followupData.orthos.tests}</p>
                             )}
                             {followupData.orthos?.result && (
                               <p className="text-gray-700 text-sm"><span className="font-medium">Results:</span> {followupData.orthos.result}</p>
                             )}
                           </div>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['orthos']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('orthos', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['orthos']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('orthos', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['orthos']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('orthos', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['orthos']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('orthos', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Activities Causing Pain */}
                   {followupData.activitiesCausePain && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Activities Causing Pain</h5>
                           <p className="text-gray-700 text-sm leading-relaxed">{followupData.activitiesCausePain}</p>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['activitiesCausePain']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('activitiesCausePain', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['activitiesCausePain']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('activitiesCausePain', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['activitiesCausePain']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('activitiesCausePain', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['activitiesCausePain']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('activitiesCausePain', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Other Notes */}
                   {followupData.otherNotes && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Other Notes</h5>
                           <p className="text-gray-700 text-sm leading-relaxed">{followupData.otherNotes}</p>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['otherNotes']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('otherNotes', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['otherNotes']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('otherNotes', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['otherNotes']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('otherNotes', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['otherNotes']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('otherNotes', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Muscle Strength */}
                   {followupData.muscleStrength && followupData.muscleStrength.length > 0 && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Muscle Strength</h5>
                           <div className="space-y-1">
                             {followupData.muscleStrength.map((item: string, index: number) => (
                               <p key={index} className="text-gray-700 text-sm">• {item}</p>
                             ))}
                           </div>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['muscleStrength']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('muscleStrength', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['muscleStrength']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('muscleStrength', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['muscleStrength']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('muscleStrength', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['muscleStrength']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('muscleStrength', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Home Care Suggestions */}
                   {followupData.homeCareSuggestions && (
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-semibold text-gray-800 mb-2">Home Care Suggestions</h5>
                           <p className="text-gray-700 text-sm leading-relaxed">{followupData.homeCareSuggestions}</p>
                         </div>
                         <div className="ml-4 flex space-x-3">
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['homeCareSuggestions']?.improving || false}
                               onChange={(e) => handleIndividualAreaStatusChange('homeCareSuggestions', 'improving', e.target.checked)}
                               className="mr-1 text-green-600 focus:ring-green-500"
                             />
                             <span className="text-xs font-medium text-green-700">Improving</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['homeCareSuggestions']?.exacerbated || false}
                               onChange={(e) => handleIndividualAreaStatusChange('homeCareSuggestions', 'exacerbated', e.target.checked)}
                               className="mr-1 text-red-600 focus:ring-red-500"
                             />
                             <span className="text-xs font-medium text-red-700">Exacerbated</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['homeCareSuggestions']?.same || false}
                               onChange={(e) => handleIndividualAreaStatusChange('homeCareSuggestions', 'same', e.target.checked)}
                               className="mr-1 text-yellow-600 focus:ring-yellow-500"
                             />
                             <span className="text-xs font-medium text-yellow-700">Same</span>
                           </label>
                           <label className="flex items-center">
                             <input
                               type="checkbox"
                               checked={individualAreaStatus['homeCareSuggestions']?.resolved || false}
                               onChange={(e) => handleIndividualAreaStatusChange('homeCareSuggestions', 'resolved', e.target.checked)}
                               className="mr-1 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-xs font-medium text-blue-700">Resolved</span>
                           </label>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               {/* Additional Assessment Data Section - Editable */}
               <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center">
                     <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                       <span className="text-white text-lg font-bold">+</span>
                     </div>
                     <h4 className="text-xl font-bold text-indigo-800">Additional Assessment Data</h4>
                   </div>
                 </div>
                   
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                   {/* Tenderness - Editable */}
                   <div className="bg-white rounded-lg p-4 border border-indigo-200">
                     <div className="flex items-center justify-between mb-3">
                       <h5 className="font-semibold text-indigo-700 flex items-center">
                         <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                         Tenderness
                       </h5>
                       <button
                         type="button"
                         onClick={handleAddTendernessItem}
                         className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                       >
                         Add Item
                       </button>
                     </div>
                     <div className="space-y-3">
                       {Object.entries(editableAdditionalData.tenderness).map(([region, data]: [string, any]) => (
                         <div key={region} className="border border-gray-200 rounded p-3">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Region</span>
                             <button
                               type="button"
                               onClick={() => handleRemoveTendernessItem(region)}
                               className="text-red-500 hover:text-red-700 text-xs"
                             >
                               Remove
                             </button>
                           </div>
                           <div className="space-y-2">
                             <input
                               type="text"
                               value={data.part || ''}
                               onChange={(e) => handleAdditionalDataChange('tenderness', region, { ...data, part: e.target.value })}
                               placeholder="Body part..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                             <input
                               type="text"
                               value={data.severity || ''}
                               onChange={(e) => handleAdditionalDataChange('tenderness', region, { ...data, severity: e.target.value })}
                               placeholder="Severity..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                           </div>
                         </div>
                       ))}
                       {Object.keys(editableAdditionalData.tenderness).length === 0 && (
                         <p className="text-gray-500 italic text-sm">No tenderness items. Click "Add Item" to add one.</p>
                       )}
                     </div>
                   </div>

                   {/* Spasm - Editable */}
                   <div className="bg-white rounded-lg p-4 border border-indigo-200">
                     <div className="flex items-center justify-between mb-3">
                       <h5 className="font-semibold text-indigo-700 flex items-center">
                         <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                         Spasm
                       </h5>
                       <button
                         type="button"
                         onClick={handleAddSpasmItem}
                         className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                       >
                         Add Item
                       </button>
                     </div>
                     <div className="space-y-3">
                       {Object.entries(editableAdditionalData.spasm).map(([region, data]: [string, any]) => (
                         <div key={region} className="border border-gray-200 rounded p-3">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Region</span>
                             <button
                               type="button"
                               onClick={() => handleRemoveSpasmItem(region)}
                               className="text-red-500 hover:text-red-700 text-xs"
                             >
                               Remove
                             </button>
                           </div>
                           <div className="space-y-2">
                             <input
                               type="text"
                               value={data.part || ''}
                               onChange={(e) => handleAdditionalDataChange('spasm', region, { ...data, part: e.target.value })}
                               placeholder="Body part..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                             <input
                               type="text"
                               value={data.severity || ''}
                               onChange={(e) => handleAdditionalDataChange('spasm', region, { ...data, severity: e.target.value })}
                               placeholder="Severity..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                           </div>
                         </div>
                       ))}
                       {Object.keys(editableAdditionalData.spasm).length === 0 && (
                         <p className="text-gray-500 italic text-sm">No spasm items. Click "Add Item" to add one.</p>
                       )}
                     </div>
                   </div>

                   {/* Ortho Tests - Editable */}
                   <div className="bg-white rounded-lg p-4 border border-indigo-200">
                     <div className="flex items-center justify-between mb-3">
                       <h5 className="font-semibold text-indigo-700 flex items-center">
                         <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                         Ortho Tests
                       </h5>
                       <button
                         type="button"
                         onClick={handleAddOrthoTest}
                         className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                       >
                         Add Test
                       </button>
                     </div>
                     <div className="space-y-3">
                       {Object.entries(editableAdditionalData.ortho).map(([test, data]: [string, any]) => (
                         <div key={test} className="border border-gray-200 rounded p-3">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Test</span>
                             <button
                               type="button"
                               onClick={() => handleRemoveOrthoTest(test)}
                               className="text-red-500 hover:text-red-700 text-xs"
                             >
                               Remove
                             </button>
                           </div>
                           <div className="space-y-2">
                             <input
                               type="text"
                               value={data.result || ''}
                               onChange={(e) => handleAdditionalDataChange('ortho', test, { ...data, result: e.target.value })}
                               placeholder="Test result..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                             <textarea
                               value={data.details || ''}
                               onChange={(e) => handleAdditionalDataChange('ortho', test, { ...data, details: e.target.value })}
                               placeholder="Test details..."
                               rows={2}
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                           </div>
                         </div>
                       ))}
                       {Object.keys(editableAdditionalData.ortho).length === 0 && (
                         <p className="text-gray-500 italic text-sm">No ortho tests. Click "Add Test" to add one.</p>
                       )}
                     </div>
                   </div>

                   {/* AROM - Editable */}
                   <div className="bg-white rounded-lg p-4 border border-indigo-200">
                     <div className="flex items-center justify-between mb-3">
                       <h5 className="font-semibold text-indigo-700 flex items-center">
                         <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                         Active Range of Motion (AROM)
                       </h5>
                       <button
                         type="button"
                         onClick={handleAddAromMovement}
                         className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                       >
                         Add Movement
                       </button>
                     </div>
                     <div className="space-y-3">
                       {Object.entries(editableAdditionalData.arom).map(([movement, data]: [string, any]) => (
                         <div key={movement} className="border border-gray-200 rounded p-3">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Movement</span>
                             <button
                               type="button"
                               onClick={() => handleRemoveAromMovement(movement)}
                               className="text-red-500 hover:text-red-700 text-xs"
                             >
                               Remove
                             </button>
                           </div>
                           <div className="space-y-2">
                             <input
                               type="text"
                               value={data.range || ''}
                               onChange={(e) => handleAdditionalDataChange('arom', movement, { ...data, range: e.target.value })}
                               placeholder="Range (e.g., 90°)..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                             <input
                               type="text"
                               value={data.quality || ''}
                               onChange={(e) => handleAdditionalDataChange('arom', movement, { ...data, quality: e.target.value })}
                               placeholder="Quality (e.g., Smooth)..."
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                             <select
                               value={data.pain || ''}
                               onChange={(e) => handleAdditionalDataChange('arom', movement, { ...data, pain: e.target.value })}
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             >
                               <option value="">Select Pain Level</option>
                               <option value="None">None</option>
                               <option value="Mild">Mild</option>
                               <option value="Moderate">Moderate</option>
                               <option value="Severe">Severe</option>
                             </select>
                           </div>
                         </div>
                       ))}
                       {Object.keys(editableAdditionalData.arom).length === 0 && (
                         <p className="text-gray-500 italic text-sm">No AROM movements. Click "Add Movement" to add one.</p>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Footer */}
             <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
               <div className="flex justify-between items-center">
                 <div className="text-sm text-gray-600">
                   <span className="font-medium">Ready to apply this data to your discharge form?</span>
                 </div>
                 <div className="flex space-x-3">
                   <button
                     onClick={() => setIsModalOpen(false)}
                     className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={applyFollowupData}
                     className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
                   >
                     Apply to Form
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
               )}

        {/* Muscle Palpation Modal */}
        {isMuscleModalOpen && followupData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Muscle Palpation Data</h3>
                    <p className="text-purple-100 text-sm mt-1">Review and apply muscle palpation data from followup visit</p>
                  </div>
                  <button
                    onClick={() => setIsMuscleModalOpen(false)}
                    className="text-white hover:text-purple-200 transition-colors p-2 rounded-full hover:bg-purple-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
             <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Left Column - Muscle Palpation & Strength */}
                <div className="space-y-6">
                  {/* Muscle Palpation Data */}
                  {followupData.musclePalpation && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">M</span>
                        </div>
                        <h4 className="text-lg font-bold text-purple-800">Muscle Palpation Results</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{followupData.musclePalpation}</p>
                      </div>
                    </div>
                  )}

                   {/* Muscle Strength Assessment - Editable */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">S</span>
                        </div>
                        <h4 className="text-lg font-bold text-indigo-800">Muscle Strength Assessment</h4>
                      </div>
                    <button
                         onClick={handleAddMuscleStrength}
                         className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                       >
                         Add Muscle
                    </button>
                  </div>
                     <div className="space-y-3">
                               {editableAdditionalData.muscleStrength.map((muscle: string, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-indigo-200">
                           <div className="flex items-center space-x-2">
                             <input
                               type="text"
                               value={muscle}
                               onChange={(e) => handleMuscleStrengthChange(index, e.target.value)}
                               placeholder="Enter muscle name..."
                               className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                  <button
                               onClick={() => handleRemoveMuscleStrength(index)}
                               className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                               Remove
                  </button>
                </div>
                          </div>
                        ))}
                       {editableAdditionalData.muscleStrength.length === 0 && (
                         <p className="text-gray-500 italic text-sm text-center py-4">No muscle strength items. Click "Add Muscle" to add one.</p>
                       )}
                      </div>
                    </div>
                      </div>

                 {/* Right Column - Tenderness & Spasm */}
                 <div className="space-y-6">
                                      {/* Tenderness Data - Editable with Severity */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <h4 className="text-lg font-bold text-red-800">Tenderness Assessment</h4>
                      </div>
                       <button
                         onClick={handleAddTendernessItem}
                         className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                       >
                         Add Custom Item
                       </button>
                     </div>
                     
                     {/* Pre-defined body regions */}
                     <div className="mb-4">
                       <h5 className="font-medium text-red-700 mb-2">Body Regions:</h5>
                       <div className="grid grid-cols-1 gap-3">
                         {['cervical', 'thoracic', 'lumbar'].map(region => {
                           const regionData = editableAdditionalData.tenderness[region] || { part: region, severities: [] };
                           return (
                             <div key={region} className="bg-white rounded-lg p-3 border border-red-200">
                               <div className="flex items-center justify-between mb-2">
                                 <h6 className="font-semibold text-red-700 capitalize">{region}</h6>
                                 <button
                                   onClick={() => handleRemoveTendernessItem(region)}
                                   className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                 >
                                   Remove
                                 </button>
                               </div>
                              <div className="space-y-2">
                                 <input
                                   type="text"
                                   value={regionData.part || region}
                                   onChange={(e) => handleAdditionalDataChange('tenderness', region, { ...regionData, part: e.target.value })}
                                   placeholder={`${region} area...`}
                                   className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                 />
                                 <div>
                                   <label className="block text-xs font-medium text-gray-600 mb-1">Severity:</label>
                                   <div className="flex space-x-2">
                                     {['Mild', 'Moderate', 'Severe'].map(severity => (
                                       <label key={severity} className="flex items-center">
                                         <input
                                           type="checkbox"
                                           checked={(regionData.severities || []).includes(severity)}
                                           onChange={(e) => handleSeverityChange('tenderness', region, severity, e.target.checked)}
                                           className="mr-1 text-red-600 focus:ring-red-500"
                                         />
                                         <span className="text-xs text-gray-700">{severity}</span>
                                       </label>
                                     ))}
                                  </div>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                     
                     {/* Additional custom tenderness items */}
                     <div className="border-t border-red-200 pt-4">
                       <h5 className="font-medium text-red-700 mb-2">Additional Areas:</h5>
                       <div className="space-y-3">
                         {Object.entries(editableAdditionalData.tenderness)
                           .filter(([region]) => !['cervical', 'thoracic', 'lumbar'].includes(region))
                           .map(([region, data]: [string, any]) => (
                           <div key={region} className="bg-white rounded-lg p-3 border border-red-200">
                             <div className="flex items-center justify-between mb-2">
                               <h6 className="font-semibold text-red-700 capitalize">{region}</h6>
                               <button
                                 onClick={() => handleRemoveTendernessItem(region)}
                                 className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                               >
                                 Remove
                               </button>
                             </div>
                             <div className="space-y-2">
                               <input
                                 type="text"
                                 value={data.part || ''}
                                 onChange={(e) => handleAdditionalDataChange('tenderness', region, { ...data, part: e.target.value })}
                                 placeholder="Body part..."
                                 className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                               />
                               <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-1">Severity:</label>
                                 <div className="flex space-x-2">
                                   {['Mild', 'Moderate', 'Severe'].map(severity => (
                                     <label key={severity} className="flex items-center">
                                       <input
                                         type="checkbox"
                                         checked={(data.severities || []).includes(severity)}
                                         onChange={(e) => handleSeverityChange('tenderness', region, severity, e.target.checked)}
                                         className="mr-1 text-red-600 focus:ring-red-500"
                                       />
                                       <span className="text-xs text-gray-700">{severity}</span>
                                     </label>
                                ))}
                              </div>
                              </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                   </div>

                                      {/* Spasm Assessment - Editable with Severity */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">S</span>
                        </div>
                        <h4 className="text-lg font-bold text-orange-800">Spasm Assessment</h4>
                      </div>
                       <button
                         onClick={handleAddSpasmItem}
                         className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                       >
                         Add Custom Item
                       </button>
                     </div>
                     
                     {/* Pre-defined body regions */}
                     <div className="mb-4">
                       <h5 className="font-medium text-orange-700 mb-2">Body Regions:</h5>
                       <div className="grid grid-cols-1 gap-3">
                         {['cervical', 'thoracic', 'lumbar'].map(region => {
                           const regionData = editableAdditionalData.spasm[region] || { part: region, severities: [] };
                           return (
                             <div key={region} className="bg-white rounded-lg p-3 border border-orange-200">
                               <div className="flex items-center justify-between mb-2">
                                 <h6 className="font-semibold text-orange-700 capitalize">{region}</h6>
                                 <button
                                   onClick={() => handleRemoveSpasmItem(region)}
                                   className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                 >
                                   Remove
                                 </button>
                               </div>
                              <div className="space-y-2">
                                 <input
                                   type="text"
                                   value={regionData.part || region}
                                   onChange={(e) => handleAdditionalDataChange('spasm', region, { ...regionData, part: e.target.value })}
                                   placeholder={`${region} area...`}
                                   className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                 />
                                 <div>
                                   <label className="block text-xs font-medium text-gray-600 mb-1">Severity:</label>
                                   <div className="flex space-x-2">
                                     {['Mild', 'Moderate', 'Severe'].map(severity => (
                                       <label key={severity} className="flex items-center">
                                         <input
                                           type="checkbox"
                                           checked={(regionData.severities || []).includes(severity)}
                                           onChange={(e) => handleSeverityChange('spasm', region, severity, e.target.checked)}
                                           className="mr-1 text-orange-600 focus:ring-orange-500"
                                         />
                                         <span className="text-xs text-gray-700">{severity}</span>
                                       </label>
                                     ))}
                                  </div>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                     
                     {/* Additional custom spasm items */}
                     <div className="border-t border-orange-200 pt-4">
                       <h5 className="font-medium text-orange-700 mb-2">Additional Areas:</h5>
                       <div className="space-y-3">
                         {Object.entries(editableAdditionalData.spasm)
                           .filter(([region]) => !['cervical', 'thoracic', 'lumbar'].includes(region))
                           .map(([region, data]: [string, any]) => (
                           <div key={region} className="bg-white rounded-lg p-3 border border-orange-200">
                             <div className="flex items-center justify-between mb-2">
                               <h6 className="font-semibold text-orange-700 capitalize">{region}</h6>
                               <button
                                 onClick={() => handleRemoveSpasmItem(region)}
                                 className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                               >
                                 Remove
                               </button>
                             </div>
                             <div className="space-y-2">
                               <input
                                 type="text"
                                 value={data.part || ''}
                                 onChange={(e) => handleAdditionalDataChange('spasm', region, { ...data, part: e.target.value })}
                                 placeholder="Body part..."
                                 className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                               />
                               <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-1">Severity:</label>
                                 <div className="flex space-x-2">
                                   {['Mild', 'Moderate', 'Severe'].map(severity => (
                                     <label key={severity} className="flex items-center">
                                       <input
                                         type="checkbox"
                                         checked={(data.severities || []).includes(severity)}
                                         onChange={(e) => handleSeverityChange('spasm', region, severity, e.target.checked)}
                                         className="mr-1 text-orange-600 focus:ring-orange-500"
                                       />
                                       <span className="text-xs text-gray-700">{severity}</span>
                                     </label>
                                ))}
                              </div>
                              </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                   </div>
              </div>
                        </div>

                  {/* No Data Message */}
                   {!followupData.musclePalpation && (!editableAdditionalData.muscleStrength || editableAdditionalData.muscleStrength.length === 0) && 
                    Object.keys(editableAdditionalData.tenderness).filter(key => !['cervical', 'thoracic', 'lumbar'].includes(key)).length === 0 && 
                    Object.keys(editableAdditionalData.spasm).filter(key => !['cervical', 'thoracic', 'lumbar'].includes(key)).length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-600 text-2xl">📋</span>
                      </div>
                       <h4 className="text-lg font-semibold text-gray-700 mb-2">No Additional Muscle Data Available</h4>
                       <p className="text-gray-500">No additional muscle palpation, strength, tenderness, or spasm data found in the followup visit. You can still edit the default body regions.</p>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Ready to apply muscle palpation data to your form?</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsMuscleModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                     onClick={saveMusclePalpationData}
                     className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-md hover:shadow-lg"
                   >
                     Save Changes
                    </button>
                    <button
                      onClick={applyMusclePalpationData}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Apply to Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orthos Modal */}
        {isOrthosModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Orthopedic Tests Data</h3>
                  <button
                    onClick={() => setIsOrthosModalOpen(false)}
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

              {/* Footer with Save Button */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {hasOrthoTestsChanges && (
                    <span className="text-orange-600 font-medium">⚠️ You have unsaved changes</span>
                  )}
                  {!hasOrthoTestsChanges && (
                    <span className="text-green-600">✓ All changes saved</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsOrthosModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await saveOrthoTestsData();
                      setIsOrthosModalOpen(false);
                    }}
                    disabled={!hasOrthoTestsChanges}
                    className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg ${
                      hasOrthoTestsChanges
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
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
                {initialVisitData?.chiefComplaint && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-semibold text-blue-800 mb-2">Original Chief Complaint:</h4>
                    <p className="text-blue-700 text-sm">{initialVisitData.chiefComplaint}</p>
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
                    {initialVisitData?.chiefComplaint && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 mb-3">Suggested Activities (from Chief Complaint):</h5>
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {initialVisitData.chiefComplaint.split(/[.,;]/).map((activity: string, index: number) => {
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

        {/* Croft Criteria Modal */}
        {isCroftModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                            <div>
                    <h3 className="text-xl font-bold">Croft Criteria - Frequency of Treatment Guideline Placement</h3>
                    <p className="text-teal-100 text-sm mt-1">Select grade and review the generated treatment guideline</p>
                            </div>
                  <button
                    onClick={() => setIsCroftModalOpen(false)}
                    className="text-white hover:text-teal-200 transition-colors p-2 rounded-full hover:bg-teal-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <div className="space-y-6">
                  {/* Grade Selection */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">C</span>
                      </div>
                      <h4 className="text-lg font-bold text-teal-800">Croft Grade Selection</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Grade:</label>
                              <select
                          value={croftGrade}
                          onChange={(e) => handleCroftGradeChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Select Grade</option>
                          <option value="1">Grade 1</option>
                          <option value="2">Grade 2</option>
                          <option value="3">Grade 3</option>
                              </select>
                          </div>
                      
                      {croftGrade && (
                        <div className="md:col-span-2">
                          <div className="bg-white rounded-lg p-3 border border-teal-200">
                            <h5 className="font-semibold text-teal-700 mb-2">Treatment Duration & Sessions:</h5>
                            <p className="text-sm text-gray-700">
                              {croftGrade === '1' && 'Grade 1: 10 weeks, 21 sessions'}
                              {croftGrade === '2' && 'Grade 2: 29 weeks, 33 sessions'}
                              {croftGrade === '3' && 'Grade 3: 56 weeks, 76 sessions'}
                            </p>
                      </div>
                    </div>
                              )}
                            </div>
                          </div>

                  {/* Template Text */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">T</span>
                      </div>
                      <h4 className="text-lg font-bold text-blue-800">Frequency of Treatment Guideline Placement</h4>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Guideline Template:</label>
                      <textarea
                        value={croftTemplate}
                        onChange={(e) => setCroftTemplate(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                        placeholder="Select a grade above to generate the treatment guideline template..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Ready to save Croft Criteria to your form?</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsCroftModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Save the template to formData
                        setFormData(prev => ({
                          ...prev,
                          croftCriteria: croftTemplate
                        }));
                        setIsCroftModalOpen(false);
                        alert('Croft Criteria saved successfully!');
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pain Radiating Modal */}
        {isPainRadiatingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Pain Radiating Assessment</h3>
                    <p className="text-purple-100 text-sm mt-1">Add body parts and assess pain radiating patterns</p>
                  </div>
                  <button
                    onClick={() => setIsPainRadiatingModalOpen(false)}
                    className="text-white hover:text-purple-200 transition-colors p-2 rounded-full hover:bg-purple-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <div className="space-y-6">
                  {/* Add Body Part Section */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-800 mb-4">Add Body Part for Pain Radiating Assessment</h4>
                    
                    {/* Dropdown Row */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {/* Body Part Dropdown */}
                      <select
                        value={painRadiatingData.tempBodyPart}
                        onChange={(e) =>
                          setPainRadiatingData(prev => ({
                            ...prev,
                            tempBodyPart: e.target.value,
                          }))
                        }
                        className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                        value={painRadiatingData.tempSide}
                        onChange={(e) =>
                          setPainRadiatingData(prev => ({
                            ...prev,
                            tempSide: e.target.value,
                          }))
                        }
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                          const { tempBodyPart, tempSide } = painRadiatingData;
                          if (tempBodyPart && tempSide) {
                            addPainRadiatingIntake(tempBodyPart, tempSide);
                            setPainRadiatingData(prev => ({
                              ...prev,
                              tempBodyPart: '',
                              tempSide: '',
                            }));
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                      >
                        Add Body Part
                      </button>
                      </div>
                  </div>

                  {/* Display pain radiating intakes for each body part */}
                  {painRadiatingData.intakes.map((intake, intakeIndex) => (
                    <div key={`pain-intake-${intakeIndex}`} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-purple-700">
                          {intake.bodyPart} - {intake.side}
                        </h3>
                            <button
                          type="button"
                          onClick={() => removePainRadiatingIntake(intakeIndex)}
                          className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                      </div>

                      {/* Severity */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Severity</h4>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Mild", "Moderate", "Severe"].map(val => (
                            <label key={`severity-${intakeIndex}-${val}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`pain-intake-${intakeIndex}-severity`}
                                value={val}
                                checked={intake.severity === val}
                                onChange={() => updatePainRadiatingIntake(intakeIndex, 'severity', val)}
                              />
                              <span>{val}</span>
                            </label>
                          ))}
                                    </div>
                                </div>

                      {/* Quality */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Quality</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {["Achy", "Dull", "Sharp", "Stabbing", "Throbbing", "Burning", "Crushing"].map(val => (
                            <label key={`quality-${intakeIndex}-${val}`} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={val}
                                checked={intake.quality.includes(val)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...intake.quality, val]
                                    : intake.quality.filter(q => q !== val);
                                  updatePainRadiatingIntake(intakeIndex, 'quality', updated);
                                }}
                              />
                              <span>{val}</span>
                            </label>
                          ))}
                                </div>
                            </div>

                      {/* Timing */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Timing</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {["Constant", "Frequent", "Intermittent", "Occasional", "Activity Dependent"].map(val => (
                            <label key={`timing-${intakeIndex}-${val}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`pain-intake-${intakeIndex}-timing`}
                                value={val}
                                checked={intake.timing === val}
                                onChange={() => updatePainRadiatingIntake(intakeIndex, 'timing', val)}
                              />
                              <span>{val}</span>
                            </label>
                          ))}
                          </div>
                      </div>

                      {/* Context */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Context</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {["New", "Improving", "Worsening", "Recurrent"].map(val => (
                            <label key={`context-${intakeIndex}-${val}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`pain-intake-${intakeIndex}-context`}
                                value={val}
                                checked={intake.context === val}
                                onChange={() => updatePainRadiatingIntake(intakeIndex, 'context', val)}
                              />
                              <span>{val}</span>
                            </label>
                          ))}
                      </div>
                    </div>

                      {/* Exacerbated By */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Exacerbated By</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {["Rest", "Increased Activity", "Prolonged Work", "School", "Stress", "Looking Up/Down", "Overhead Reach", "Sitting", "Standing", "Walking", "Twisting", "Stooping", "Bend", "Squat", "Kneel", "Lifting", "Carrying", "Serving", "Pulling/Pushing", "Grip/Grasp", "Chiro", "Physio", "Exercise", "Ice", "Heat", "Changes in the Weather"].map(val => (
                            <label key={`exacerbated-${intakeIndex}-${val}`} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={val}
                                checked={intake.exacerbatedBy.includes(val)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...intake.exacerbatedBy, val]
                                    : intake.exacerbatedBy.filter(v => v !== val);
                                  updatePainRadiatingIntake(intakeIndex, 'exacerbatedBy', updated);
                                }}
                              />
                              <span>{val}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Signs/Symptoms */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Signs / Symptoms</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {["Tenderness", "Soreness", "Stiffness", "Tightness", "Loss of Motion", "Locking", "Grinding", "Popping", "Clicking", "Joint Instability", "Joint Redness", "Tingling", "Numbness", "Swelling", "Weakness", "Pulling", "Dropping Objects", "Dizziness", "Nausea", "Hearing Loss", "TMJ", "Double Vision", "Blurry Vision", "Photosensitivity", "Throat Pain", "Fever", "Rash", "Loss of Bowel or Bladder", "Feeling Mentally Foggy", "Feeling Slowed Down", "Difficulty Remembering", "Difficulty Concentrating"].map(val => (
                            <label key={`symptoms-${intakeIndex}-${val}`} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={val}
                                checked={intake.symptoms.includes(val)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...intake.symptoms, val]
                                    : intake.symptoms.filter(s => s !== val);
                                  updatePainRadiatingIntake(intakeIndex, 'symptoms', updated);
                                }}
                              />
                              <span>{val}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mb-6">
                        <label htmlFor={`pain-intake-${intakeIndex}-notes`} className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          id={`pain-intake-${intakeIndex}-notes`}
                          rows={3}
                          value={intake.notes}
                          onChange={(e) => updatePainRadiatingIntake(intakeIndex, 'notes', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        ></textarea>
                      </div>
                    </div>
                  ))}

                  {/* Show message if no body parts added */}
                  {painRadiatingData.intakes.length === 0 && (
                    <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500">No body parts added yet. Use the form above to add body parts for pain radiating assessment.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Ready to save pain radiating assessment data?</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsPainRadiatingModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        // Save pain radiating data to formData
                        setFormData(prev => ({
                          ...prev,
                          painRadiating: JSON.stringify(painRadiatingData.intakes),
                          painRadiatingAssessment: painRadiatingData.intakes
                        }));
                        
                        // Save to database immediately
                        await savePainRadiatingData();
                        
                        setIsPainRadiatingModalOpen(false);
                        alert('Pain radiating assessment data saved successfully to database!');
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
                       </div>
         </div>
       )}

          {/* ROM Assessment Modal */}
          {isROMModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">ROM Assessment - Pre-injury Status</h2>
                  <button
                      onClick={() => setIsROMModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                      ×
                  </button>
                </div>
              </div>

                <div className="p-6">
                  {/* Add Body Part Section */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Add Body Part for ROM Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Body Part</label>
                        <select
                          value={romData.tempBodyPart}
                          onChange={(e) => setRomData(prev => ({ ...prev, tempBodyPart: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Body Part</option>
                          <option value="C/S">Cervical Spine (C/S)</option>
                          <option value="T/S">Thoracic Spine (T/S)</option>
                          <option value="L/S">Lumbar Spine (L/S)</option>
                          <option value="SH">Shoulder (SH)</option>
                          <option value="ELB">Elbow (ELB)</option>
                          <option value="WR">Wrist (WR)</option>
                          <option value="Hand">Hand</option>
                          <option value="Finger(s)">Finger(s)</option>
                          <option value="Hip">Hip</option>
                          <option value="KN">Knee (KN)</option>
                          <option value="AN">Ankle (AN)</option>
                          <option value="Foot">Foot</option>
                          <option value="Toe(s)">Toe(s)</option>
                          <option value="L Ant/Post/Lat/Med">L Ant/Post/Lat/Med</option>
                          <option value="R Ant/Post/Lat/Med">R Ant/Post/Lat/Med</option>
                        </select>
                        </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Side</label>
                        <select
                          value={romData.tempSide}
                          onChange={(e) => setRomData(prev => ({ ...prev, tempSide: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Side</option>
                          <option value="Left">Left</option>
                          <option value="Right">Right</option>
                          <option value="Bilateral">Bilateral</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                      <button
                          onClick={() => {
                            if (romData.tempBodyPart && romData.tempSide) {
                              addROMIntake(romData.tempBodyPart, romData.tempSide);
                              setRomData(prev => ({ ...prev, tempBodyPart: '', tempSide: '' }));
                            } else {
                              alert('Please select both body part and side');
                            }
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Add Body Part
                      </button>
                        </div>
                    </div>
                  </div>

                  {/* Display ROM Assessments */}
                  {romData.intakes.map((intake, intakeIndex) => (
                    <div key={intakeIndex} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {intake.bodyPart} - {intake.side}
                        </h4>
                            <button
                          onClick={() => removeROMIntake(intakeIndex)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                            >
                              Remove
                            </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Percentage */}
                            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Percentage of Pre-injury ROM</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={intake.percentage}
                              onChange={(e) => updateROMIntake(intakeIndex, 'percentage', e.target.value)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0-100"
                            />
                            <span className="text-gray-600">%</span>
                    </div>
                        </div>

                        {/* Status */}
                            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                            value={intake.status}
                            onChange={(e) => updateROMIntake(intakeIndex, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Status</option>
                            <option value="WNL No Pain">WNL No Pain</option>
                            <option value="WNL With Pain">WNL With Pain</option>
                            <option value="Improved">Improved</option>
                            <option value="Decreased">Decreased</option>
                            <option value="Same">Same</option>
                            <option value="Resolved">Resolved</option>
                              </select>
                      </div>
                    </div>

                      {/* Notes */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                          value={intake.notes}
                          onChange={(e) => updateROMIntake(intakeIndex, 'notes', e.target.value)}
                                rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Additional notes about ROM assessment..."
                              />
                          </div>
                        </div>
                      ))}

                  {/* Empty State */}
                  {romData.intakes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No body parts added yet. Use the form above to add body parts for ROM assessment.</p>
                    </div>
                  )}
              </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsROMModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        // Save ROM data to formData
                        setFormData(prev => ({
                          ...prev,
                          romAssessment: romData.intakes
                        }));
                        
                        // Save to database immediately
                        await saveROMData();
                        
                        setIsROMModalOpen(false);
                        alert('ROM assessment data saved successfully to database!');
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Save Changes
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

     </div>
   );
 };

export default DischargeVisitForm;
