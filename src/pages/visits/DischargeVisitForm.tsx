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
  romPercent: string;
  orthos: {
    tests: string;
    result: string;
  };
  activitiesCausePain: string;
  otherNotes: string;
  prognosis: string;
  diagnosticStudy: {
    study: string;
    bodyPart: string;
    result: string;
  };
  futureMedicalCare: string[];
  croftCriteria: string;
  amaDisability: string;
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
    romPercent: '',
    orthos: {
      tests: '',
      result: ''
    },
    activitiesCausePain: '',
    otherNotes: '',
    prognosis: '',
    diagnosticStudy: {
      study: '',
      bodyPart: '',
      result: ''
    },
    futureMedicalCare: [],
    croftCriteria: '',
    amaDisability: '',
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
    homeCareSuggestions: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isMuscleModalOpen, setIsMuscleModalOpen] = useState(false);
  const [isOrthosModalOpen, setIsOrthosModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isCroftModalOpen, setIsCroftModalOpen] = useState(false);

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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

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

  const handleOrthoTestChange = (testKey: string, field: string, value: string) => {
    setEditableAdditionalData(prev => ({
      ...prev,
      ortho: {
        ...prev.ortho,
        [testKey]: {
          ...prev.ortho[testKey],
          [field]: value
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

  // Handlers for severity checkboxes
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
      setFollowupData(data);
      
      // Initialize individual area status checkboxes
      const initialStatus: { [key: string]: { improving: boolean; exacerbated: boolean; same: boolean; resolved: boolean; } } = {};
      
      // Add status for each element that has data
      if (data.musclePalpation) {
        initialStatus['musclePalpation'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.painRadiating) {
        initialStatus['painRadiating'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.romPercent) {
        initialStatus['romPercent'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.orthos?.tests || data.orthos?.result) {
        initialStatus['orthos'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.activitiesCausePain) {
        initialStatus['activitiesCausePain'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.otherNotes) {
        initialStatus['otherNotes'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.muscleStrength && data.muscleStrength.length > 0) {
        initialStatus['muscleStrength'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.tenderness && Object.keys(data.tenderness).length > 0) {
        initialStatus['tenderness'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.spasm && Object.keys(data.spasm).length > 0) {
        initialStatus['spasm'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.ortho && Object.keys(data.ortho).length > 0) {
        initialStatus['ortho'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.arom && Object.keys(data.arom).length > 0) {
        initialStatus['arom'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      if (data.homeCareSuggestions) {
        initialStatus['homeCareSuggestions'] = { improving: false, exacerbated: false, same: false, resolved: false };
      }
      
      setIndividualAreaStatus(initialStatus);
      
      // Initialize additional assessment data with default cervical, thoracic, lumbar regions
      const defaultTenderness = {
        cervical: { part: 'cervical', severities: [] },
        thoracic: { part: 'thoracic', severities: [] },
        lumbar: { part: 'lumbar', severities: [] },
        ...data.tenderness
      };
      
      const defaultSpasm = {
        cervical: { part: 'cervical', severities: [] },
        thoracic: { part: 'thoracic', severities: [] },
        lumbar: { part: 'lumbar', severities: [] },
        ...data.spasm
      };
      
      setEditableAdditionalData({
        tenderness: defaultTenderness,
        spasm: defaultSpasm,
        ortho: data.ortho || {},
        arom: data.arom || {},
        muscleStrength: data.muscleStrength || [],
        activities: data.activities || {},
        croftCriteria: data.croftCriteria || {}
      });
      
      // Toggle side by side view instead of modal
      setShowSideBySide(true);
    } catch (error) {
      console.error('Error fetching followup visit data:', error);
      alert('Failed to load followup visit data.');
    }
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
      arom: editableAdditionalData.arom || {}
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
    const payload = {
      ...formData,
      visitType: 'discharge',
      patient: id,
    };

    await axios.post('https://emr-h.onrender.com/api/visits', payload);

    navigate(`/patients/${id}`);
  } catch (err) {
    console.error('Error submitting form', err);
    alert('Form submission failed. Check console for details.');
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

          {/* Muscle Palpation */}
          <div>
            <label htmlFor="musclePalpation" className="block text-sm font-medium text-gray-700 mb-1">Muscle Palpation:</label>
                    <button
          type="button"
          onClick={() => {
            if (followupData) {
              setIsMuscleModalOpen(true);
            } else {
              fetchLastFollowupData();
            }
          }}
          className="bg-white text-purple-600 font-medium underline hover:text-purple-800 focus:outline-none mb-4"
        >
          List of muscles specific to that body part
        </button>
            <textarea 
              id="musclePalpation"
              name="musclePalpation" 
              value={formData.musclePalpation} 
              onChange={handleChange} 
              placeholder="Muscle Palpation Results" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Pain Radiating */}
          <div>
            <label htmlFor="painRadiating" className="block text-sm font-medium text-gray-700 mb-1">Pain Radiating:</label>
            <textarea 
              id="painRadiating"
              name="painRadiating" 
              value={formData.painRadiating} 
              onChange={handleChange} 
              placeholder="Pain Radiating" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* ROM */}
          <div>
            <label htmlFor="romPercent" className="block text-sm font-medium text-gray-700 mb-1">ROM:</label>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                id="romPercent"
                name="romPercent" 
                value={formData.romPercent} 
                onChange={handleChange} 
                placeholder="ROM % Pre-injury" 
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-600">% Pre-injury status</span>
            </div>
          </div>

          {/* Orthos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orthos:</label>
            <button
              type="button"
              onClick={() => {
                if (followupData) {
                  setIsOrthosModalOpen(true);
                } else {
                  fetchLastFollowupData();
                }
              }}
              className="bg-white text-green-600 font-medium underline hover:text-green-800 focus:outline-none mb-4"
            >
              List of tests specific for body part
            </button>
          </div>

          {/* Activities that still cause pain */}
          <div>
            <label htmlFor="activitiesCausePain" className="block text-sm font-medium text-gray-700 mb-1">Activities that still cause pain:</label>
            <button
              type="button"
              onClick={() => {
                if (followupData) {
                  setIsActivitiesModalOpen(true);
                } else {
                  fetchLastFollowupData();
                }
              }}
              className="bg-white text-orange-600 font-medium underline hover:text-orange-800 focus:outline-none mb-4"
            >
              List of things specific to selected body part
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
              <option value="plateau">The patient has reached a plateau in their recovery. He/she remains symptomatic due to the extensive injuries sustained.</option>
              <option value="maximum_benefits">The patient has received maximum benefits from the given treatment and therefore, will be discharged from care.</option>
            </select>
          </div>

          {/* Review of diagnostic study */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review of diagnostic study with the patient:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="diagnosticStudy.study" className="block text-xs text-gray-500 mb-1">Study</label>
                <input
                  type="text"
                  id="diagnosticStudy.study"
                  value={formData.diagnosticStudy.study}
                  onChange={(e) => handleNestedChange('diagnosticStudy', 'study', e.target.value)}
                  placeholder="Study Type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="diagnosticStudy.bodyPart" className="block text-xs text-gray-500 mb-1">Body Part</label>
                <input
                  type="text"
                  id="diagnosticStudy.bodyPart"
                  value={formData.diagnosticStudy.bodyPart}
                  onChange={(e) => handleNestedChange('diagnosticStudy', 'bodyPart', e.target.value)}
                  placeholder="Body Part"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
              onClick={() => {
                if (followupData) {
                  setIsCroftModalOpen(true);
                } else {
                  fetchLastFollowupData();
                }
              }}
              className="bg-white text-teal-600 font-medium underline hover:text-teal-800 focus:outline-none mb-4"
            >
              Grade
            </button>
          </div>

          {/* AMA Disability */}
          <div>
            <label htmlFor="amaDisability" className="block text-sm font-medium text-gray-700 mb-1">AMA Disability:</label>
            <select 
              id="amaDisability"
              name="amaDisability" 
              value={formData.amaDisability} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select AMA Disability Grade</option>
              <option value="Grade I">Grade I</option>
              <option value="Grade II">Grade II</option>
              <option value="Grade III">Grade III</option>
              <option value="Grade IV">Grade IV</option>
            </select>
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
        {showSideBySide && followupData && (
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
                      <h5 className="font-medium text-gray-700 mb-1">Muscle Palpation:</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.musclePalpation}</p>
                    </div>
                  )}
                  {followupData.painRadiating && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Pain Radiating:</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.painRadiating}</p>
                    </div>
                  )}
                  {followupData.romPercent && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">ROM %:</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.romPercent}%</p>
                    </div>
                  )}
                  {followupData.muscleStrength && followupData.muscleStrength.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Muscle Strength:</h5>
                      <div className="space-y-1">
                        {followupData.muscleStrength.map((muscle: string, index: number) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            • {muscle}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Orthos Tests - Enhanced Display */}
                  {(followupData.orthos?.tests || Object.keys(editableAdditionalData.ortho).length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Orthos Tests:</h5>
                      {followupData.orthos?.tests ? (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.orthos.tests}</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(editableAdditionalData.ortho).map(([test, data]: [string, any]) => (
                            <div key={test} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="font-medium">{data.name || test.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-xs text-gray-600">Result: {data.result || 'N/A'}</div>
                              {data.details && <div className="text-xs text-gray-600">Details: {data.details}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activities Causing Pain - Enhanced Display */}
                  {(followupData.activitiesCausePain || Object.keys(editableAdditionalData.activities).length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Activities Causing Pain:</h5>
                      {followupData.activitiesCausePain ? (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.activitiesCausePain}</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(editableAdditionalData.activities).map(([activity, data]: [string, any]) => (
                            <div key={activity} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="font-medium">{data.name || activity.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-xs text-gray-600">Severity: {data.severity || 'N/A'}</div>
                              {data.frequency && <div className="text-xs text-gray-600">Frequency: {data.frequency}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {followupData.otherNotes && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Other Notes:</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.otherNotes}</p>
                    </div>
                  )}
                  {/* Croft Criteria - Enhanced Display */}
                  {(followupData.croftCriteria || Object.keys(editableAdditionalData.croftCriteria).length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Croft Criteria:</h5>
                      {followupData.croftCriteria ? (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{followupData.croftCriteria}</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(editableAdditionalData.croftCriteria).map(([criteria, data]: [string, any]) => (
                            <div key={criteria} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="font-medium">Grade {data.grade || 'N/A'}</div>
                              <div className="text-xs text-gray-600">Frequency: {data.frequency || 'N/A'}</div>
                              {data.treatmentGuideline && <div className="text-xs text-gray-600">Treatment Guideline: {data.treatmentGuideline}</div>}
                              {data.notes && <div className="text-xs text-gray-600">Notes: {data.notes}</div>}
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
                  {Object.keys(editableAdditionalData.tenderness).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Tenderness:</h5>
                      <div className="space-y-2">
                        {Object.entries(editableAdditionalData.tenderness).map(([region, data]: [string, any]) => (
                          <div key={region} className="bg-gray-50 p-2 rounded text-sm">
                            <span className="font-medium">{data.part || region}:</span> {data.severity || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spasm */}
                  {Object.keys(editableAdditionalData.spasm).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Spasm:</h5>
                      <div className="space-y-2">
                        {Object.entries(editableAdditionalData.spasm).map(([region, data]: [string, any]) => (
                          <div key={region} className="bg-gray-50 p-2 rounded text-sm">
                            <span className="font-medium">{data.part || region}:</span> {data.severity || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ortho Tests */}
                  {Object.keys(editableAdditionalData.ortho).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Ortho Tests:</h5>
                      <div className="space-y-2">
                        {Object.entries(editableAdditionalData.ortho).map(([test, data]: [string, any]) => (
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {Object.keys(editableAdditionalData.activities).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Activities Causing Pain:</h5>
                      <div className="space-y-2">
                        {Object.entries(editableAdditionalData.activities).map(([activity, data]: [string, any]) => (
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Croft Criteria */}
                  {Object.keys(editableAdditionalData.croftCriteria).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Croft Criteria:</h5>
                      <div className="space-y-2">
                        {Object.entries(editableAdditionalData.croftCriteria).map(([criteria, data]: [string, any]) => (
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Muscle Strength */}
                  {editableAdditionalData.muscleStrength && editableAdditionalData.muscleStrength.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Muscle Strength:</h5>
                      <div className="space-y-2">
                                {editableAdditionalData.muscleStrength.map((muscle: string, index: number) => (
          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
            <span className="font-medium">• {muscle}</span>
          </div>
        ))}
                      </div>
                    </div>
                  )}

                  {/* AROM */}
                  {Object.keys(editableAdditionalData.arom).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">AROM:</h5>
                      <div className="space-y-2">
                        {Object.entries(editableAdditionalData.arom).map(([movement, data]: [string, any]) => (
                          <div key={movement} className="bg-gray-50 p-2 rounded text-sm">
                            <span className="font-medium">{movement.replace(/([A-Z])/g, ' $1').trim()}:</span> {data.range || 'N/A'} - {data.quality || 'N/A'} - {data.pain || 'N/A'}
                          </div>
                        ))}
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
        )}
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
        {isOrthosModalOpen && followupData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Orthopedic Tests Data</h3>
                    <p className="text-green-100 text-sm mt-1">Review and edit orthopedic tests from followup visit</p>
                  </div>
                  <button
                    onClick={() => setIsOrthosModalOpen(false)}
                    className="text-white hover:text-green-200 transition-colors p-2 rounded-full hover:bg-green-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <div className="space-y-6">
                  {/* Orthos Tests - Editable */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">O</span>
                        </div>
                        <h4 className="text-lg font-bold text-green-800">Orthopedic Tests</h4>
                      </div>
                      <button
                        onClick={handleAddOrthoTest}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Add Test
                      </button>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(editableAdditionalData.ortho).map(([testKey, testData]: [string, any]) => (
                        <div key={testKey} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-green-700 capitalize">{testKey}</h5>
                            <button
                              onClick={() => handleRemoveOrthoTest(testKey)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name:</label>
                              <input
                                type="text"
                                value={testData.name || ''}
                                onChange={(e) => handleOrthoTestChange(testKey, 'name', e.target.value)}
                                placeholder="Enter test name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Result:</label>
                              <select
                                value={testData.result || ''}
                                onChange={(e) => handleOrthoTestChange(testKey, 'result', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                              >
                                <option value="">Select Result</option>
                                <option value="Positive">Positive</option>
                                <option value="Negative">Negative</option>
                                <option value="Equivocal">Equivocal</option>
                                <option value="Not Tested">Not Tested</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Details:</label>
                              <textarea
                                value={testData.details || ''}
                                onChange={(e) => handleOrthoTestChange(testKey, 'details', e.target.value)}
                                placeholder="Enter test details..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {Object.keys(editableAdditionalData.ortho).length === 0 && (
                        <p className="text-gray-500 italic text-sm text-center py-4">No orthopedic tests. Click "Add Test" to add one.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Ready to apply orthopedic test data to your form?</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsOrthosModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveOrthosData}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={applyOrthosData}
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

        {/* Activities Modal */}
        {isActivitiesModalOpen && followupData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Activities Data</h3>
                    <p className="text-orange-100 text-sm mt-1">Review and edit activities that cause pain from followup visit</p>
                  </div>
                  <button
                    onClick={() => setIsActivitiesModalOpen(false)}
                    className="text-white hover:text-orange-200 transition-colors p-2 rounded-full hover:bg-orange-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <div className="space-y-6">
                  {/* Activities - Editable */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">A</span>
                        </div>
                        <h4 className="text-lg font-bold text-orange-800">Activities Causing Pain</h4>
                      </div>
                      <button
                        onClick={handleAddActivity}
                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                      >
                        Add Activity
                      </button>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(editableAdditionalData.activities).map(([activityKey, activityData]: [string, any]) => (
                        <div key={activityKey} className="bg-white rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-orange-700 capitalize">{activityKey}</h5>
                            <button
                              onClick={() => handleRemoveActivity(activityKey)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name:</label>
                              <input
                                type="text"
                                value={activityData.name || ''}
                                onChange={(e) => handleActivityChange(activityKey, 'name', e.target.value)}
                                placeholder="Enter activity name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Severity:</label>
                              <select
                                value={activityData.severity || ''}
                                onChange={(e) => handleActivityChange(activityKey, 'severity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                <option value="">Select Severity</option>
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency:</label>
                              <select
                                value={activityData.frequency || ''}
                                onChange={(e) => handleActivityChange(activityKey, 'frequency', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                <option value="">Select Frequency</option>
                                <option value="Rarely">Rarely</option>
                                <option value="Occasionally">Occasionally</option>
                                <option value="Frequently">Frequently</option>
                                <option value="Always">Always</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      {Object.keys(editableAdditionalData.activities).length === 0 && (
                        <p className="text-gray-500 italic text-sm text-center py-4">No activities. Click "Add Activity" to add one.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Ready to apply activities data to your form?</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsActivitiesModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveActivitiesData}
                      className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg text-sm font-medium hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={applyActivitiesData}
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

        {/* Croft Criteria Modal */}
        {isCroftModalOpen && followupData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Croft Criteria Data</h3>
                    <p className="text-teal-100 text-sm mt-1">Review and edit Croft Criteria grades from followup visit</p>
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
                  {/* Croft Criteria - Editable */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">C</span>
                        </div>
                        <h4 className="text-lg font-bold text-teal-800">Croft Criteria Assessment</h4>
                      </div>
                      <button
                        onClick={handleAddCroftCriteria}
                        className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                      >
                        Add Criteria
                      </button>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(editableAdditionalData.croftCriteria).map(([criteriaKey, criteriaData]: [string, any]) => (
                        <div key={criteriaKey} className="bg-white rounded-lg p-4 border border-teal-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-teal-700 capitalize">{criteriaKey}</h5>
                            <button
                              onClick={() => handleRemoveCroftCriteria(criteriaKey)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Grade:</label>
                              <select
                                value={criteriaData.grade || ''}
                                onChange={(e) => handleCroftCriteriaChange(criteriaKey, 'grade', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                              >
                                <option value="">Select Grade</option>
                                <option value="1">Grade 1</option>
                                <option value="2">Grade 2</option>
                                <option value="3">Grade 3</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency:</label>
                              <select
                                value={criteriaData.frequency || ''}
                                onChange={(e) => handleCroftCriteriaChange(criteriaKey, 'frequency', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                              >
                                <option value="">Select Frequency</option>
                                <option value="Rarely">Rarely</option>
                                <option value="Occasionally">Occasionally</option>
                                <option value="Frequently">Frequently</option>
                                <option value="Always">Always</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Guideline:</label>
                              <input
                                type="text"
                                value={criteriaData.treatmentGuideline || ''}
                                onChange={(e) => handleCroftCriteriaChange(criteriaKey, 'treatmentGuideline', e.target.value)}
                                placeholder="Enter treatment guideline..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
                              <textarea
                                value={criteriaData.notes || ''}
                                onChange={(e) => handleCroftCriteriaChange(criteriaKey, 'notes', e.target.value)}
                                placeholder="Enter additional notes..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {Object.keys(editableAdditionalData.croftCriteria).length === 0 && (
                        <p className="text-gray-500 italic text-sm text-center py-4">No Croft Criteria. Click "Add Criteria" to add one.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Ready to apply Croft Criteria data to your form?</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsCroftModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCroftCriteriaData}
                      className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={applyCroftCriteriaData}
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

     </div>
   );
 };

export default DischargeVisitForm;
