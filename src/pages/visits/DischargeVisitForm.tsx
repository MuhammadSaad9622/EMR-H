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
      setIsModalOpen(true);
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
      arom: followupData.arom || {},
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

    setIsModalOpen(false);
    alert('Data applied from last followup visit successfully!');
  };

  // Function to apply muscle palpation data to form
  const applyMusclePalpationData = () => {
    if (!followupData) return;

    setFormData(prev => ({
      ...prev,
      musclePalpation: followupData.musclePalpation || ''
    }));

    setIsMuscleModalOpen(false);
    alert('Muscle palpation data applied successfully!');
  };

  // Function to apply orthos data to form
  const applyOrthosData = () => {
    if (!followupData) return;

    // Create a summary of the ortho data for display
    let orthoSummary = '';
    
    if (followupData.ortho && Object.keys(followupData.ortho).length > 0) {
      const testResults = Object.entries(followupData.ortho).map(([test, data]: [string, any]) => {
        const testName = test.replace(/([A-Z])/g, ' $1').trim();
        if (typeof data === 'object') {
          const result = Object.entries(data).map(([key, value]: [string, any]) => {
            const keyName = key.replace(/([A-Z])/g, ' $1').trim();
            const valueStr = typeof value === 'boolean' ? (value ? 'Positive' : 'Negative') :
                           typeof value === 'string' ? value :
                           typeof value === 'number' ? value.toString() :
                           Array.isArray(value) ? value.join(', ') : 'N/A';
            return `${keyName}: ${valueStr}`;
          }).join(', ');
          return `${testName}: ${result}`;
        } else {
          const valueStr = typeof data === 'boolean' ? (data ? 'Positive' : 'Negative') :
                         typeof data === 'string' ? data :
                         typeof data === 'number' ? data.toString() : 'N/A';
          return `${testName}: ${valueStr}`;
        }
      }).join('; ');
      orthoSummary = testResults;
    } else if (followupData.orthos) {
      orthoSummary = `Tests: ${followupData.orthos.tests || 'N/A'}; Results: ${followupData.orthos.result || 'N/A'}`;
    }

    setFormData(prev => ({
      ...prev,
      orthos: {
        tests: orthoSummary,
        result: ''
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
      activitiesCausePain: followupData.activitiesCausePain || ''
    }));

    setIsActivitiesModalOpen(false);
    alert('Activities data applied successfully!');
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
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Left Column */}
                 <div className="space-y-6">
                   {/* Areas Section */}
                   <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center mb-3">
                       <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                         <span className="text-white text-sm font-bold">A</span>
                       </div>
                       <h4 className="text-lg font-bold text-green-800">Areas Status</h4>
                     </div>
                                           <div className="grid grid-cols-2 gap-3">
                        <div className={`flex items-center p-3 rounded-lg ${followupData.areasImproving ? 'bg-green-100 border border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className={`w-4 h-4 rounded-full mr-3 ${followupData.areasImproving ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm font-medium ${followupData.areasImproving ? 'text-green-800' : 'text-gray-500'}`}>Improving</span>
                          {followupData.areasImproving && (
                            <span className="ml-auto text-xs text-green-600 font-semibold">SELECTED</span>
                          )}
                        </div>
                        <div className={`flex items-center p-3 rounded-lg ${followupData.areasExacerbated ? 'bg-red-100 border border-red-300' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className={`w-4 h-4 rounded-full mr-3 ${followupData.areasExacerbated ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm font-medium ${followupData.areasExacerbated ? 'text-red-800' : 'text-gray-500'}`}>Exacerbated</span>
                          {followupData.areasExacerbated && (
                            <span className="ml-auto text-xs text-red-600 font-semibold">SELECTED</span>
                          )}
                        </div>
                        <div className={`flex items-center p-3 rounded-lg ${followupData.areasSame ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className={`w-4 h-4 rounded-full mr-3 ${followupData.areasSame ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm font-medium ${followupData.areasSame ? 'text-yellow-800' : 'text-gray-500'}`}>Same</span>
                          {followupData.areasSame && (
                            <span className="ml-auto text-xs text-yellow-600 font-semibold">SELECTED</span>
                          )}
                        </div>
                        <div className={`flex items-center p-3 rounded-lg ${followupData.areasResolved ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className={`w-4 h-4 rounded-full mr-3 ${followupData.areasResolved ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm font-medium ${followupData.areasResolved ? 'text-blue-800' : 'text-gray-500'}`}>Resolved</span>
                          {followupData.areasResolved && (
                            <span className="ml-auto text-xs text-blue-600 font-semibold">SELECTED</span>
                          )}
                        </div>
                      </div>
                   </div>

                   {/* Muscle Palpation */}
                   {followupData.musclePalpation && (
                     <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">M</span>
                         </div>
                         <h4 className="text-lg font-bold text-purple-800">Muscle Palpation</h4>
                       </div>
                       <div className="bg-white rounded-lg p-4 border border-purple-200">
                         <p className="text-gray-700 leading-relaxed">{followupData.musclePalpation}</p>
                       </div>
                     </div>
                   )}

                   {/* Pain Radiating */}
                   {followupData.painRadiating && (
                     <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">P</span>
                         </div>
                         <h4 className="text-lg font-bold text-red-800">Pain Radiating</h4>
                       </div>
                       <div className="bg-white rounded-lg p-4 border border-red-200">
                         <p className="text-gray-700 leading-relaxed">{followupData.painRadiating}</p>
                       </div>
                     </div>
                   )}

                   {/* ROM Status */}
                   {(followupData.romWnlNoPain || followupData.romWnlWithPain || followupData.romImproved || followupData.romDecreased || followupData.romSame) && (
                     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">R</span>
                         </div>
                         <h4 className="text-lg font-bold text-blue-800">ROM Status</h4>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className={`flex items-center p-3 rounded-lg ${followupData.romWnlNoPain ? 'bg-green-100 border border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
                           <div className={`w-4 h-4 rounded-full mr-3 ${followupData.romWnlNoPain ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                           <span className={`text-sm font-medium ${followupData.romWnlNoPain ? 'text-green-800' : 'text-gray-500'}`}>WNL No Pain</span>
                           {followupData.romWnlNoPain && (
                             <span className="ml-auto text-xs text-green-600 font-semibold">SELECTED</span>
                           )}
                         </div>
                         <div className={`flex items-center p-3 rounded-lg ${followupData.romWnlWithPain ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50 border border-gray-200'}`}>
                           <div className={`w-4 h-4 rounded-full mr-3 ${followupData.romWnlWithPain ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                           <span className={`text-sm font-medium ${followupData.romWnlWithPain ? 'text-yellow-800' : 'text-gray-500'}`}>WNL With Pain</span>
                           {followupData.romWnlWithPain && (
                             <span className="ml-auto text-xs text-yellow-600 font-semibold">SELECTED</span>
                           )}
                         </div>
                         <div className={`flex items-center p-3 rounded-lg ${followupData.romImproved ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
                           <div className={`w-4 h-4 rounded-full mr-3 ${followupData.romImproved ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                           <span className={`text-sm font-medium ${followupData.romImproved ? 'text-blue-800' : 'text-gray-500'}`}>Improved</span>
                           {followupData.romImproved && (
                             <span className="ml-auto text-xs text-blue-600 font-semibold">SELECTED</span>
                           )}
                         </div>
                         <div className={`flex items-center p-3 rounded-lg ${followupData.romDecreased ? 'bg-red-100 border border-red-300' : 'bg-gray-50 border border-gray-200'}`}>
                           <div className={`w-4 h-4 rounded-full mr-3 ${followupData.romDecreased ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                           <span className={`text-sm font-medium ${followupData.romDecreased ? 'text-red-800' : 'text-gray-500'}`}>Decreased</span>
                           {followupData.romDecreased && (
                             <span className="ml-auto text-xs text-red-600 font-semibold">SELECTED</span>
                           )}
                         </div>
                         <div className={`flex items-center p-3 rounded-lg ${followupData.romSame ? 'bg-gray-100 border border-gray-300' : 'bg-gray-50 border border-gray-200'}`}>
                           <div className={`w-4 h-4 rounded-full mr-3 ${followupData.romSame ? 'bg-gray-500' : 'bg-gray-300'}`}></div>
                           <span className={`text-sm font-medium ${followupData.romSame ? 'text-gray-800' : 'text-gray-500'}`}>Same</span>
                           {followupData.romSame && (
                             <span className="ml-auto text-xs text-gray-600 font-semibold">SELECTED</span>
                           )}
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Activities that cause pain */}
                   {followupData.activitiesCausePain && (
                     <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">A</span>
                         </div>
                         <h4 className="text-lg font-bold text-orange-800">Activities Causing Pain</h4>
                       </div>
                       <div className="bg-white rounded-lg p-4 border border-orange-200">
                         <p className="text-gray-700 leading-relaxed">{followupData.activitiesCausePain}</p>
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Right Column */}
                 <div className="space-y-6">
                   {/* Orthos */}
                   {(followupData.orthos?.tests || followupData.orthos?.result) && (
                     <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">O</span>
                         </div>
                         <h4 className="text-lg font-bold text-cyan-800">Orthopedic Tests</h4>
                       </div>
                       <div className="space-y-3">
                         {followupData.orthos?.tests && (
                           <div className="bg-white rounded-lg p-4 border border-cyan-200">
                             <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">Tests</span>
                             <p className="text-gray-700 mt-1">{followupData.orthos.tests}</p>
                           </div>
                         )}
                         {followupData.orthos?.result && (
                           <div className="bg-white rounded-lg p-4 border border-cyan-200">
                             <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">Result</span>
                             <p className="text-gray-700 mt-1">{followupData.orthos.result}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Diagnostic Study */}
                   {(followupData.diagnosticStudy?.study || followupData.diagnosticStudy?.bodyPart || followupData.diagnosticStudy?.result) && (
                     <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">D</span>
                         </div>
                         <h4 className="text-lg font-bold text-teal-800">Diagnostic Study</h4>
                       </div>
                       <div className="space-y-3">
                         {followupData.diagnosticStudy?.study && (
                           <div className="bg-white rounded-lg p-4 border border-teal-200">
                             <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Study Type</span>
                             <p className="text-gray-700 mt-1">{followupData.diagnosticStudy.study}</p>
                           </div>
                         )}
                         {followupData.diagnosticStudy?.bodyPart && (
                           <div className="bg-white rounded-lg p-4 border border-teal-200">
                             <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Body Part</span>
                             <p className="text-gray-700 mt-1">{followupData.diagnosticStudy.bodyPart}</p>
                           </div>
                         )}
                         {followupData.diagnosticStudy?.result && (
                           <div className="bg-white rounded-lg p-4 border border-teal-200">
                             <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Result</span>
                             <p className="text-gray-700 mt-1">{followupData.diagnosticStudy.result}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Other Notes */}
                   {followupData.otherNotes && (
                     <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">N</span>
                         </div>
                         <h4 className="text-lg font-bold text-gray-800">Other Notes</h4>
                       </div>
                       <div className="bg-white rounded-lg p-4 border border-gray-200">
                         <p className="text-gray-700 leading-relaxed">{followupData.otherNotes}</p>
                       </div>
                     </div>
                   )}

                   {/* Home Care Suggestions */}
                   {followupData.homeCareSuggestions && (
                     <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">H</span>
                         </div>
                         <h4 className="text-lg font-bold text-emerald-800">Home Care Suggestions</h4>
                       </div>
                       <div className="bg-white rounded-lg p-4 border border-emerald-200">
                         <p className="text-gray-700 leading-relaxed">{followupData.homeCareSuggestions}</p>
                       </div>
                     </div>
                   )}

                   {/* ROM Percent */}
                   {followupData.romPercent && (
                     <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center mb-3">
                         <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                           <span className="text-white text-sm font-bold">%</span>
                         </div>
                         <h4 className="text-lg font-bold text-cyan-800">ROM Percentage</h4>
                       </div>
                       <div className="bg-white rounded-lg p-4 border border-cyan-200">
                         <div className="flex items-center justify-between">
                           <span className="font-medium text-gray-700">ROM % Pre-injury:</span>
                           <span className="text-lg font-semibold text-cyan-600">{followupData.romPercent}%</span>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               {/* Additional Data Section - Full Width */}
               {(followupData.muscleStrength || followupData.tenderness || followupData.spasm || followupData.ortho || followupData.arom) && (
                 <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                   <div className="flex items-center mb-4">
                     <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                       <span className="text-white text-lg font-bold">+</span>
                     </div>
                     <h4 className="text-xl font-bold text-indigo-800">Additional Assessment Data</h4>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                     {/* Muscle Strength */}
                     {followupData.muscleStrength && followupData.muscleStrength.length > 0 && (
                       <div className="bg-white rounded-lg p-4 border border-indigo-200">
                         <h5 className="font-semibold text-indigo-700 mb-2 flex items-center">
                           <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                           Muscle Strength
                         </h5>
                         <div className="space-y-1">
                           {followupData.muscleStrength.map((item: string, index: number) => (
                             <div key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                               {item}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Tenderness */}
                     {followupData.tenderness && Object.keys(followupData.tenderness).length > 0 && (
                       <div className="bg-white rounded-lg p-4 border border-indigo-200">
                         <h5 className="font-semibold text-indigo-700 mb-2 flex items-center">
                           <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                           Tenderness
                         </h5>
                         <div className="space-y-2">
                           {Object.entries(followupData.tenderness).map(([region, data]: [string, any]) => (
                             <div key={region} className="border-l-2 border-indigo-200 pl-3">
                               <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{region}</span>
                               {typeof data === 'object' ? (
                                 <div className="mt-1 space-y-1">
                                   {Object.entries(data).map(([part, severities]: [string, any]) => (
                                     <div key={part} className="text-sm text-gray-700">
                                       <span className="font-medium">{part}:</span> {Array.isArray(severities) ? severities.join(', ') : severities}
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="text-sm text-gray-700 mt-1">
                                   {Array.isArray(data) ? data.join(', ') : data}
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Spasm */}
                     {followupData.spasm && Object.keys(followupData.spasm).length > 0 && (
                       <div className="bg-white rounded-lg p-4 border border-indigo-200">
                         <h5 className="font-semibold text-indigo-700 mb-2 flex items-center">
                           <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                           Spasm
                         </h5>
                         <div className="space-y-2">
                           {Object.entries(followupData.spasm).map(([region, data]: [string, any]) => (
                             <div key={region} className="border-l-2 border-indigo-200 pl-3">
                               <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{region}</span>
                               {typeof data === 'object' ? (
                                 <div className="mt-1 space-y-1">
                                   {Object.entries(data).map(([part, severities]: [string, any]) => (
                                     <div key={part} className="text-sm text-gray-700">
                                       <span className="font-medium">{part}:</span> {Array.isArray(severities) ? severities.join(', ') : severities}
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="text-sm text-gray-700 mt-1">
                                   {Array.isArray(data) ? data.join(', ') : data}
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                                           {/* Ortho Tests */}
                      {followupData.ortho && Object.keys(followupData.ortho).length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-indigo-200">
                          <h5 className="font-semibold text-indigo-700 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                            Ortho Tests
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-indigo-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Test</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Result</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Details</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {Object.entries(followupData.ortho).map(([test, data]: [string, any], index: number) => (
                                  <tr key={test} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                                      {test.replace(/([A-Z])/g, ' $1').trim()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {typeof data === 'object' && data.result ? data.result : 
                                       typeof data === 'string' ? data : 
                                       typeof data === 'boolean' ? (data ? 'Positive' : 'Negative') : 
                                       'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {typeof data === 'object' && data.details ? data.details :
                                       typeof data === 'object' && data.note ? data.note :
                                       typeof data === 'object' ? Object.entries(data)
                                         .filter(([key]) => key !== 'result' && key !== 'details' && key !== 'note')
                                         .map(([key, value]) => `${key}: ${value}`).join(', ') : 
                                       ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* AROM */}
                      {followupData.arom && Object.keys(followupData.arom).length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-indigo-200">
                          <h5 className="font-semibold text-indigo-700 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                            Active Range of Motion (AROM)
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-indigo-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Movement</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Range</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Quality</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide">Pain</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {Object.entries(followupData.arom).map(([movement, data]: [string, any], index: number) => (
                                  <tr key={movement} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                                      {movement.replace(/([A-Z])/g, ' $1').trim()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {typeof data === 'object' && data.range ? data.range :
                                       typeof data === 'object' && data.degrees ? data.degrees :
                                       typeof data === 'string' ? data : 
                                       typeof data === 'number' ? `${data}°` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {typeof data === 'object' && data.quality ? data.quality :
                                       typeof data === 'object' && data.smoothness ? data.smoothness : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {typeof data === 'object' && data.pain ? (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          data.pain === 'None' || data.pain === 'No pain' ? 'bg-green-100 text-green-800' :
                                          data.pain === 'Mild' ? 'bg-yellow-100 text-yellow-800' :
                                          data.pain === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                                          data.pain === 'Severe' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {data.pain}
                                        </span>
                                      ) : typeof data === 'object' && data.painLevel ? (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          data.painLevel === 'None' || data.painLevel === 'No pain' ? 'bg-green-100 text-green-800' :
                                          data.painLevel === 'Mild' ? 'bg-yellow-100 text-yellow-800' :
                                          data.painLevel === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                                          data.painLevel === 'Severe' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {data.painLevel}
                                        </span>
                                      ) : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                   </div>
                 </div>
               )}
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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
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
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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

                  {/* Muscle Strength Data */}
                  {followupData.muscleStrength && followupData.muscleStrength.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">S</span>
                        </div>
                        <h4 className="text-lg font-bold text-indigo-800">Muscle Strength Assessment</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followupData.muscleStrength.map((muscle: string, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-indigo-200">
                            <span className="text-sm font-medium text-gray-700">{muscle}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tenderness Data */}
                  {followupData.tenderness && Object.keys(followupData.tenderness).length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <h4 className="text-lg font-bold text-red-800">Tenderness Assessment</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(followupData.tenderness).map(([region, data]: [string, any]) => (
                          <div key={region} className="bg-white rounded-lg p-4 border border-red-200">
                            <h5 className="font-semibold text-red-700 mb-2 capitalize">{region}</h5>
                            {typeof data === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(data).map(([part, severities]: [string, any]) => (
                                  <div key={part} className="text-sm text-gray-700">
                                    <span className="font-medium">{part}:</span> {Array.isArray(severities) ? severities.join(', ') : severities}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-700">
                                {Array.isArray(data) ? data.join(', ') : data}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spasm Data */}
                  {followupData.spasm && Object.keys(followupData.spasm).length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">S</span>
                        </div>
                        <h4 className="text-lg font-bold text-orange-800">Spasm Assessment</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(followupData.spasm).map(([region, data]: [string, any]) => (
                          <div key={region} className="bg-white rounded-lg p-4 border border-orange-200">
                            <h5 className="font-semibold text-orange-700 mb-2 capitalize">{region}</h5>
                            {typeof data === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(data).map(([part, severities]: [string, any]) => (
                                  <div key={part} className="text-sm text-gray-700">
                                    <span className="font-medium">{part}:</span> {Array.isArray(severities) ? severities.join(', ') : severities}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-700">
                                {Array.isArray(data) ? data.join(', ') : data}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {!followupData.musclePalpation && !followupData.muscleStrength && !followupData.tenderness && !followupData.spasm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-600 text-2xl">📋</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Muscle Data Available</h4>
                      <p className="text-gray-500">No muscle palpation, strength, tenderness, or spasm data found in the followup visit.</p>
                    </div>
                  )}
                </div>
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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Orthopedic Tests Data</h3>
                    <p className="text-green-100 text-sm mt-1">From previous followup visit</p>
                  </div>
                  <button
                    onClick={() => setIsOrthosModalOpen(false)}
                    className="text-white hover:text-green-200 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Orthos Tests Data */}
                  {followupData.orthos && (followupData.orthos.tests || followupData.orthos.result) && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">O</span>
                        </div>
                        <h4 className="text-lg font-bold text-green-800">Orthopedic Tests</h4>
                      </div>
                      <div className="space-y-4">
                        {followupData.orthos.tests && (
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h5 className="font-semibold text-green-700 mb-2">Tests Performed</h5>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {followupData.orthos.tests}
                            </div>
                          </div>
                        )}
                        {followupData.orthos.result && (
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h5 className="font-semibold text-green-700 mb-2">Test Results</h5>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {followupData.orthos.result}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ortho Object Data (if exists) */}
                  {followupData.ortho && Object.keys(followupData.ortho).length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <h4 className="text-lg font-bold text-blue-800">Detailed Test Results</h4>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(followupData.ortho).map(([test, data]: [string, any]) => (
                          <div key={test} className="bg-white rounded-lg p-4 border border-blue-200">
                            <h5 className="font-semibold text-blue-700 mb-2 capitalize">
                              {test.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            <div className="text-sm text-gray-700">
                              {typeof data === 'object' ? (
                                <div className="space-y-2">
                                  {Object.entries(data).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="text-gray-600">
                                        {typeof value === 'boolean' ? (value ? 'Positive' : 'Negative') :
                                         typeof value === 'string' ? value :
                                         typeof value === 'number' ? value.toString() :
                                         Array.isArray(value) ? value.join(', ') : 'N/A'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex justify-between">
                                  <span className="font-medium">Result:</span>
                                  <span className="text-gray-600">
                                    {typeof data === 'boolean' ? (data ? 'Positive' : 'Negative') :
                                     typeof data === 'string' ? data :
                                     typeof data === 'number' ? data.toString() : 'N/A'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {(!followupData.orthos || (!followupData.orthos.tests && !followupData.orthos.result)) && 
                   (!followupData.ortho || Object.keys(followupData.ortho).length === 0) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-600 text-2xl">🔬</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Orthopedic Test Data Available</h4>
                      <p className="text-gray-500">No orthopedic test data found in the followup visit.</p>
                    </div>
                  )}
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
                      onClick={applyOrthosData}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-md hover:shadow-lg"
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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Activities Data</h3>
                    <p className="text-orange-100 text-sm mt-1">From previous followup visit</p>
                  </div>
                  <button
                    onClick={() => setIsActivitiesModalOpen(false)}
                    className="text-white hover:text-orange-200 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Activities that cause pain */}
                  {followupData.activitiesCausePain && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">A</span>
                        </div>
                        <h4 className="text-lg font-bold text-orange-800">Activities Causing Pain</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{followupData.activitiesCausePain}</p>
                      </div>
                    </div>
                  )}

                  {/* Pain Radiating */}
                  {followupData.painRadiating && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">P</span>
                        </div>
                        <h4 className="text-lg font-bold text-red-800">Pain Radiating</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{followupData.painRadiating}</p>
                      </div>
                    </div>
                  )}

                  {/* ROM Data */}
                  {followupData.romPercent && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">R</span>
                        </div>
                        <h4 className="text-lg font-bold text-blue-800">Range of Motion</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">ROM Percentage:</span>
                          <span className="text-lg font-semibold text-blue-600">{followupData.romPercent}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Pre-injury status</p>
                      </div>
                    </div>
                  )}

                  {/* AROM Data */}
                  {followupData.arom && Object.keys(followupData.arom).length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">M</span>
                        </div>
                        <h4 className="text-lg font-bold text-indigo-800">Active Range of Motion (AROM)</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(followupData.arom).map(([movement, data]: [string, any]) => (
                          <div key={movement} className="bg-white rounded-lg p-4 border border-indigo-200">
                            <h5 className="font-semibold text-indigo-700 mb-2 capitalize">
                              {movement.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            <div className="text-sm text-gray-700">
                              {typeof data === 'object' ? (
                                <div className="space-y-2">
                                  {Object.entries(data).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="text-gray-600">
                                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                                         typeof value === 'string' ? value :
                                         typeof value === 'number' ? value.toString() :
                                         Array.isArray(value) ? value.join(', ') : 'N/A'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex justify-between">
                                  <span className="font-medium">Value:</span>
                                  <span className="text-gray-600">
                                    {typeof data === 'boolean' ? (data ? 'Yes' : 'No') :
                                     typeof data === 'string' ? data :
                                     typeof data === 'number' ? data.toString() : 'N/A'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {!followupData.activitiesCausePain && !followupData.painRadiating && !followupData.romPercent && 
                   (!followupData.arom || Object.keys(followupData.arom).length === 0) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-600 text-2xl">🏃‍♂️</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Activities Data Available</h4>
                      <p className="text-gray-500">No activities, pain radiating, ROM, or AROM data found in the followup visit.</p>
                    </div>
                  )}
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
                      onClick={applyActivitiesData}
                      className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg text-sm font-medium hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-md hover:shadow-lg"
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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Croft Criteria Data</h3>
                    <p className="text-teal-100 text-sm mt-1">From previous followup visit</p>
                  </div>
                  <button
                    onClick={() => setIsCroftModalOpen(false)}
                    className="text-white hover:text-teal-200 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Croft Criteria Data */}
                  {followupData.croftCriteria && (
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">C</span>
                        </div>
                        <h4 className="text-lg font-bold text-teal-800">Croft Criteria Grade</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-teal-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Grade:</span>
                          <span className="text-lg font-semibold text-teal-600">{followupData.croftCriteria}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Frequency of Treatment Guideline Placement</p>
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {!followupData.croftCriteria && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-600 text-2xl">📊</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Croft Criteria Data Available</h4>
                      <p className="text-gray-500">No Croft Criteria grade data found in the followup visit.</p>
                    </div>
                  )}
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
                      onClick={applyCroftData}
                      className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-md hover:shadow-lg"
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