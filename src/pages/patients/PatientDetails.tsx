
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../Assets/logo.png';
import Sig from '../../Assets/sig.png';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BillingList from '../billing/BillingList';
import Modal from 'react-modal';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  FileText, 
  DollarSign, 
  Printer,
  Download,
  FileArchive
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';


const toBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};



interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  accidentDate?: string;
  accidentType?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
 
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  subjective?: {
    fullName: string;
    date: string;
    severity: string;
    timing: string;
    context: string;
    notes: string;
    quality?: string[];
    exacerbatedBy?: string[];
    symptoms?: string[];
    radiatingTo?: string;
    radiatingRight?: boolean;
    radiatingLeft?: boolean;
    sciaticaRight?: boolean;
    sciaticaLeft?: boolean;
    bodyPart: {
      part: string;
      side: string;
      severity?: string;
      quality?: string[];
      timing?: string;
      context?: string;
      exacerbatedBy?: string[];
      symptoms?: string[];
      notes?: string;
      radiatingTo?: string;
      radiatingRight?: boolean;
      radiatingLeft?: boolean;
      sciaticaRight?: boolean;
      sciaticaLeft?: boolean;
    }[];
    intakes?: SubjectiveIntake[];
  };
  attorney?: {
    name: string;
    firm: string;
    phone: string;
    email: string;
    caseNumber?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
    };
  };
  
    
  assignedDoctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  maritalStatus?: string;
  injuryDate?: string;
}

interface SubjectiveIntake {
  bodyPart: string;
  side: string;
  headache: string[];
  severity: string;
  quality: string[];
  timing: string;
  context: string;
  exacerbatedBy: string[];
  symptoms: string[];
  radiatingTo: string;
  radiatingRight: boolean;
  radiatingLeft: boolean;
  sciaticaRight: boolean;
  sciaticaLeft: boolean;
  notes: string;
}

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
  notes?: string;
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

  referrals?: string[]; // InitialVisit has referrals as array

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

  // Follow-up Visit fields (matching the EXAM FORM---REEVALUATION template)
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

  // Discharge Visit fields
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

  // Fields observed in VisitDetails.tsx for various visit types, not consistently in previous interface
  assessment?: string; // Used in InitialVisitDetails
  progressNotes?: string; // Used in FollowupVisitDetails for title/check
  assessmentUpdate?: string; // Used in FollowupVisitDetails
  romPercent?: string; // Used in DischargeVisitDetails
  prognosis?: string; // Used in DischargeVisitDetails
  futureMedicalCare?: string[]; // Used in DischargeVisitDetails
  croftCriteria?: string; // Used in DischargeVisitDetails
  amaDisability?: string; // Used in DischargeVisitDetails
  referralsNotes?: string; // Used in DischargeVisitDetails (as notes for referrals)

   // Plan details - matching structure in VisitDetails.tsx
   plan?: {
    diagnosis?: string[];
    labTests?: string[];
    imaging?: string[];
    medications?: { name: string; dosage: string; frequency: string }[];
  };

   // Referral field in Followup and Discharge is a string
   referral?: string;

   // Missing fields identified from linter errors/VisitDetails.tsx review
   rationale?: string;
   scheduleOfCare?: string;
   physicalModality?: string;
   reevaluation?: string;
   returnFrequency?: string;

  // New comprehensive fields for Initial Visit from VisitDetails.tsx
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

interface Appointment {
  _id: string;
  patient: string;
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  time: {
    start: string;
    end: string;
  };
  type: string;
  status: string;
  notes?: string; // Added notes field
}



const PatientDetails: React.FC<{}> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Using _ prefix to indicate this is intentionally unused
  // const [_invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // All sections are always expanded
  const expandedSections = {
    personalInfo: true,
    contactInfo: true,
    medicalHistory: true,
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [aiNarrativePreview, setAiNarrativePreview] = useState<any>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);

  // Icon mapping for better display
  const getIconForSection = (iconText: string, heading: string) => {
    const iconMap: { [key: string]: string } = {
      '🩺': '🩺',
      '📋': '📋', 
      '📖': '📖',
      '🔍': '🔍',
      '⚕️': '⚕️',
      '💊': '💊',
      '📈': '📈',
      '✅': '✅'
    };
    
    // Fallback based on heading if icon is not recognized
    if (iconMap[iconText]) return iconMap[iconText];
    
    if (heading.includes('CHIEF')) return '🩺';
    if (heading.includes('HISTORY')) return '📋';
    if (heading.includes('MEDICAL')) return '📖';
    if (heading.includes('EXAMINATION')) return '🔍';
    if (heading.includes('ASSESSMENT')) return '⚕️';
    if (heading.includes('TREATMENT')) return '💊';
    if (heading.includes('PROGNOSIS')) return '📈';
    if (heading.includes('RECOMMENDATIONS')) return '✅';
    
    return '•'; // Default bullet
  };

  Modal.setAppElement('#root');

  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true);
      try {
        // Fetch patient details
        const patientResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}`);
        setPatient(patientResponse.data);
        
        // Fetch patient visits
        const visitsResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}/visits`);
        
        const parsedVisits = visitsResponse.data.map((visit: any) => ({
          ...visit,
          plan: typeof visit.plan === 'string' ? JSON.parse(visit.plan) : visit.plan,
        }));
        setVisits(parsedVisits);
        
        // Fetch patient appointments
        const appointmentsResponse = await axios.get(`https://emr-h.onrender.com/api/appointments?patient=${id}`);
        setAppointments(appointmentsResponse.data);
        
        // Fetch invoice count for the patient using the dedicated endpoint
        const invoiceCountResponse = await axios.get(`https://emr-h.onrender.com/api/billing/count/${id}`);
        setInvoiceCount(invoiceCountResponse.data.totalInvoices);

        
        // We don't need to fetch invoices here anymore as BillingList will handle it
        // setInvoices([]); // Clear the local invoices state
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, [id]);

  // No toggle function needed as all sections are always expanded

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const generateAiPreview = async () => {
    if (!patient) return;
    setIsGeneratingReport(true);
    
    try {
      console.log('Generating AI narrative preview:', { patient: patient._id, visitsCount: visits.length });
      const response = await axios.post('https://emr-h.onrender.com/api/ai/generate-narrative', {
        patient,
        visits,
      });
      
      const aiNarrative = response.data.narrative;
      console.log('AI narrative preview generated:', aiNarrative ? 'Success' : 'Failed');
      
      setAiNarrativePreview(aiNarrative);
      setShowAiPreview(true);
    } catch (error) {
      console.error('Error generating AI preview:', error);
      toast.error('Failed to generate AI narrative preview');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Patient_${patient?.firstName}_${patient?.lastName}`,
  });



  const generateFullReport = async () => {
    if (!patient) return;
    setIsGeneratingReport(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;
    const margin = 20;
    const logoBase64 = await toBase64(logo);
    const signatureBase64 = await toBase64(Sig);
  
    const colors = {
      primary: [44, 62, 80],
      secondary: [231, 76, 60],
      accent: [52, 152, 219],
      lightGray: [236, 240, 241],
      darkGray: [127, 140, 141],
      success: [46, 204, 113],
      warning: [241, 196, 15],
      purple: [155, 89, 182]
    };
  
    const addHeaderAndFooter = (doc: any, pageNumber: number, totalPages: number) => {
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.addImage(logoBase64, 'PNG', 15, 8, 12, 12);
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('The Wellness Studio', 32, 18);
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text('3711 Long Beach Blvd., Suite 200, Long Beach, CA, 90807', pageWidth - 15, 18, { align: 'right' });
      doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
      doc.rect(0, 280, pageWidth, 20, 'F');
      const footerText = `The Wellness Studio • 3711 Long Beach Blvd., Suite 200, Long Beach, CA, 90807 • Tel: (562) 980-0555  Page ${pageNumber} of ${totalPages}`;
      doc.setFontSize(9);
      doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
      doc.text(footerText, pageWidth / 2, 290, { align: 'center' });
    };
  
        const addDetailedSection = (title: string, color: number[], fields: Array<[string, any]>, isMainVisitType: boolean = false) => {
      const sentences: Array<{ label: string; text: string[] }> = [];
      let height = 0;

      fields.forEach(([label, value]) => {
        if (!value) return;
        const line = `• ${label}: ${typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}`;
        const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
        sentences.push({ label, text: wrapped });
        height += wrapped.length * 6 + 4;
      });

      if (y + height > 260) {
        doc.addPage();
        y = 30;
      }
      y += 10;

      if (isMainVisitType) {
        // Colored background for main visit types
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(margin - 2, y - 6, pageWidth - margin * 2 + 4, 10, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin, y + 2);
      } else {
        // Bold and underlined for subheadings (no colors)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text(title, margin, y + 2);
        // Add underline
        const textWidth = doc.getTextWidth(title);
        doc.line(margin, y + 4, margin + textWidth, y + 4);
      }
      
      y += 12;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50);
      sentences.forEach(({ text }) => {
        doc.text(text, margin, y);
        y += text.length * 6 + 2;
      });

      y += 10;
    };
  
    const formatVitals = (vitals: any) => {
      if (!vitals) return '';
      const parts = [];
      if (vitals.heightFeet && vitals.heightInches) parts.push(`Height: ${vitals.heightFeet}'${vitals.heightInches}"`);
      if (vitals.weight) parts.push(`Weight: ${vitals.weight} lbs`);
      if (vitals.temp) parts.push(`Temperature: ${vitals.temp}°F`);
      if (vitals.bpSystolic && vitals.bpDiastolic) parts.push(`BP: ${vitals.bpSystolic}/${vitals.bpDiastolic}`);
      if (vitals.pulse) parts.push(`Pulse: ${vitals.pulse}`);
      return parts.join(', ');
    };
  
    const formatGrip = (grip: any) => {
      if (!grip) return '';
      const parts = [];
      if (grip.right1) parts.push(`Right 1: ${grip.right1}`);
      if (grip.right2) parts.push(`Right 2: ${grip.right2}`);
      if (grip.right3) parts.push(`Right 3: ${grip.right3}`);
      if (grip.left1) parts.push(`Left 1: ${grip.left1}`);
      if (grip.left2) parts.push(`Left 2: ${grip.left2}`);
      if (grip.left3) parts.push(`Left 3: ${grip.left3}`);
      return parts.join(', ');
    };
  
        const formatDermatomes = (dermatomes: any) => {
      if (!dermatomes) return '';
      const parts: string[] = [];
      Object.entries(dermatomes).forEach(([key, value]: [string, any]) => {
        if (value.left?.hypo) parts.push(`${key} Left: Hypo`);
        if (value.left?.hyper) parts.push(`${key} Left: Hyper`);
        if (value.right?.hypo) parts.push(`${key} Right: Hypo`);
        if (value.right?.hyper) parts.push(`${key} Right: Hyper`);
      });
      return parts.join(', ');
    };

    const formatStrength = (strength: any) => {
      if (!strength) return '';
      const parts: string[] = [];
      Object.entries(strength).forEach(([key, value]: [string, any]) => {
        if (value.right) parts.push(`${key} Right: ${value.right}`);
        if (value.left) parts.push(`${key} Left: ${value.left}`);
      });
      return parts.join(', ');
    };

    const formatAROM = (arom: any) => {
      if (!arom) return '';
      const parts: string[] = [];
      Object.entries(arom).forEach(([key, value]: [string, any]) => {
        if (value.pain) parts.push(`${key}: Pain`);
        if (value.left) parts.push(`${key}: Left`);
        if (value.right) parts.push(`${key}: Right`);
        if (value.bilateral) parts.push(`${key}: Bilateral`);
      });
      return parts.join(', ');
    };

    const formatOrtho = (ortho: any) => {
      if (!ortho) return '';
      const parts: string[] = [];
      Object.entries(ortho).forEach(([key, value]: [string, any]) => {
        if (value.left) parts.push(`${key}: Left`);
        if (value.right) parts.push(`${key}: Right`);
        if (value.bilateral) parts.push(`${key}: Bilateral`);
        if (value.ligLaxity) parts.push(`${key} Ligament Laxity: ${value.ligLaxity}`);
      });
      return parts.join(', ');
    };

    const formatTenderness = (tenderness: any) => {
      if (!tenderness) return '';
      const parts: string[] = [];
      Object.entries(tenderness).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value)) {
          parts.push(`${key}: ${value.join(', ')}`);
        } else if (value) {
          parts.push(`${key}: ${value}`);
        }
      });
      return parts.join(', ');
    };

    const formatSpasm = (spasm: any) => {
      if (!spasm) return '';
      const parts: string[] = [];
      Object.entries(spasm).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value)) {
          parts.push(`${key}: ${value.join(', ')}`);
        } else if (value) {
          parts.push(`${key}: ${value}`);
        }
      });
      return parts.join(', ');
    };
  
    try {
      console.log('Generating AI narrative with data:', { patient: patient._id, visitsCount: visits.length });
      const response = await axios.post('https://emr-h.onrender.com/api/ai/generate-narrative', {
        patient,
        visits,
      });
  
      const aiNarrative = response.data.narrative;
      console.log('AI narrative generated:', aiNarrative ? 'Success' : 'Failed');
      console.log('AI narrative type:', typeof aiNarrative);
  
      // ATTORNEY INFORMATION
      if (patient.attorney) {
        doc.setFontSize(14);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('ATTORNEY INFORMATION', pageWidth / 2, y, { align: 'center' });
        y += 10;
  
        autoTable(doc, {
          startY: y,
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: {
            fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: { textColor: 50, fontStyle: 'normal' },
          columnStyles: {
            0: { cellWidth: 60, fillColor: [245, 245, 245], fontStyle: 'bold' },
            1: { cellWidth: pageWidth - 100 }
          },
          head: [['Field', 'Details']],
          body: [
            ['Attorney Name', patient.attorney.name || 'N/A'],
            ['Firm', patient.attorney.firm || 'N/A'],
            ['Phone', patient.attorney.phone || 'N/A'],
            ['Email', patient.attorney.email || 'N/A'],
            ['Case Number', patient.attorney.caseNumber || 'N/A'],
            ['Address', patient.attorney.address ? 
              `${patient.attorney.address.street || ''}${patient.attorney.address.street && (patient.attorney.address.city || patient.attorney.address.state) ? ', ' : ''}${patient.attorney.address.city || ''}${patient.attorney.address.city && patient.attorney.address.state ? ', ' : ''}${patient.attorney.address.state || ''} ${patient.attorney.address.zipCode || ''}${patient.attorney.address.country ? `, ${patient.attorney.address.country}` : ''}`.trim() || 'N/A' : 'N/A']
          ],
          theme: 'grid',
          margin: { left: margin, right: margin }
        });
  
        y = (doc as any).lastAutoTable.finalY + 15;
      }
  
      // PATIENT INFO
      doc.setFontSize(14);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT INFORMATION', pageWidth / 2, y, { align: 'center' });
      y += 10;
  
      autoTable(doc, {
        startY: y,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: {
          fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { textColor: 50, fontStyle: 'normal' },
        columnStyles: {
          0: { cellWidth: 60, fillColor: [245, 245, 245], fontStyle: 'bold' },
          1: { cellWidth: pageWidth - 100 }
        },
        head: [['Field', 'Details']],
        body: [
          ['Name', `${patient.firstName} ${patient.lastName}`],
          ['Date of Birth', new Date(patient.dateOfBirth).toLocaleDateString()],
          ['Date of Accident', patient.accidentDate || 'N/A'],
          ['Type of Accident', patient.accidentType || 'N/A']
        ],
        theme: 'grid',
        margin: { left: margin, right: margin }
      });
  
      y = (doc as any).lastAutoTable.finalY + 15;
  
      // GROUPED VISITS
      const grouped = {
        initial: visits.find(v => v.visitType === 'initial'),
        followup: visits.find(v => v.visitType === 'followup'),
        discharge: visits.find(v => v.visitType === 'discharge')
      };
  
      if (grouped.initial) {
        const v = grouped.initial;
        
        // Initial Visit - Main Heading
        addDetailedSection('INITIAL VISIT', colors.accent, [
          ['Visit Date', new Date(v.date).toLocaleDateString()],
          ['Provider', `Dr. ${v.doctor.firstName} ${v.doctor.lastName}`]
        ], true);

        // Chief Complaint & Assessment
        addDetailedSection('CHIEF COMPLAINT & ASSESSMENT', colors.accent, [
          ['Chief Complaint', v.chiefComplaint],
          ['Assessment', v.assessment],
          ['Diagnosis', v.diagnosis?.join(', ')],
          ['Other Notes', v.otherNotes]
        ]);

        // Vitals
        if (v.vitals) {
          addDetailedSection('VITAL SIGNS', colors.accent, [
            ['Vital Signs', formatVitals(v.vitals)],
            ['Grip Strength', formatGrip(v.grip)]
          ]);
        }

        // Appearance and Orientation
        if (v.appearance || v.orientation) {
          addDetailedSection('APPEARANCE & ORIENTATION', colors.accent, [
            ['Appearance', v.appearance?.join(', ')],
            ['Appearance Other', v.appearanceOther],
            ['Orientation', v.orientation?.timePlacePerson],
            ['Orientation Other', v.orientation?.other],
            ['Oriented', v.oriented ? 'Yes' : 'No'],
            ['Coordination', v.coordination ? 'Yes' : 'No']
          ]);
        }

        // Posture and Gait
        if (v.posture || v.gait) {
          addDetailedSection('POSTURE & GAIT', colors.accent, [
            ['Posture', v.posture?.join(', ')],
            ['Gait', v.gait?.join(', ')],
            ['Gait Device', v.gaitDevice]
          ]);
        }

        // DTR and Neurological
        if (v.dtr || v.neuroTests) {
          addDetailedSection('DTR & NEUROLOGICAL', colors.accent, [
            ['Deep Tendon Reflexes', v.dtr?.join(', ')],
            ['DTR Other', v.dtrOther],
            ['Neurological Tests', v.neuroTests?.join(', ')],
            ['Walk Tests', v.walkTests?.join(', ')],
            ['Romberg', v.romberg?.join(', ')],
            ['Romberg Notes', v.rombergNotes],
            ['Pronator Drift', v.pronatorDrift]
          ]);
        }

        // Dermatomes
        if (v.dermatomes) {
          addDetailedSection('DERMATOMES', colors.accent, [
            ['Dermatomes', formatDermatomes(v.dermatomes)]
          ]);
        }

        // Muscle Strength
        if (v.muscleStrength || v.strength) {
          addDetailedSection('MUSCLE STRENGTH', colors.accent, [
            ['Muscle Strength', v.muscleStrength?.join(', ')],
            ['Strength Testing', formatStrength(v.strength)]
          ]);
        }

        // Pain and Joint
        if (v.painLocation || v.jointDysfunction) {
          addDetailedSection('PAIN & JOINT ASSESSMENT', colors.accent, [
            ['Pain Location', v.painLocation?.join(', ')],
            ['Radiating To', v.radiatingTo],
            ['Joint Dysfunction', v.jointDysfunction?.join(', ')],
            ['Joint Other', v.jointOther]
          ]);
        }

        // AROM Testing
        if (v.arom) {
          addDetailedSection('AROM TESTING', colors.accent, [
            ['AROM Testing', formatAROM(v.arom)]
          ]);
        }

        // Orthopedic Tests
        if (v.ortho) {
          addDetailedSection('ORTHOPEDIC TESTS', colors.accent, [
            ['Orthopedic Tests', formatOrtho(v.ortho)]
          ]);
        }

        // Tenderness and Spasm
        if (v.tenderness || v.spasm) {
          addDetailedSection('TENDERNESS & SPASM', colors.accent, [
            ['Tenderness', formatTenderness(v.tenderness)],
            ['Spasm', formatSpasm(v.spasm)]
          ]);
        }

        // Lumbar Movement
        if (v.lumbarTouchingToesMovement) {
          addDetailedSection('LUMBAR MOVEMENT', colors.accent, [
            ['Pain', v.lumbarTouchingToesMovement.pain ? 'Yes' : 'No'],
            ['Pain TS', v.lumbarTouchingToesMovement.painTS ? 'Yes' : 'No'],
            ['Pain LS', v.lumbarTouchingToesMovement.painLS ? 'Yes' : 'No'],
            ['Acceleration', v.lumbarTouchingToesMovement.acceleration ? 'Yes' : 'No'],
            ['Deceleration', v.lumbarTouchingToesMovement.deceleration ? 'Yes' : 'No'],
            ['Gowers Sign', v.lumbarTouchingToesMovement.gowersSign ? 'Yes' : 'No'],
            ['Deviating Lumbopelvic Rhythm', v.lumbarTouchingToesMovement.deviatingLumbopelvicRhythm ? 'Yes' : 'No']
          ]);
        }

        // Cervical AROM
        if (v.cervicalAROMCheckmarks) {
          addDetailedSection('CERVICAL AROM', colors.accent, [
            ['Pain', v.cervicalAROMCheckmarks.pain ? 'Yes' : 'No'],
            ['Poor Coordination', v.cervicalAROMCheckmarks.poorCoordination ? 'Yes' : 'No'],
            ['Abnormal Joint Play', v.cervicalAROMCheckmarks.abnormalJointPlay ? 'Yes' : 'No'],
            ['Motion Not Smooth', v.cervicalAROMCheckmarks.motionNotSmooth ? 'Yes' : 'No'],
            ['Hypomobility Thoracic', v.cervicalAROMCheckmarks.hypomobilityThoracic ? 'Yes' : 'No'],
            ['Fatigue Holding Head', v.cervicalAROMCheckmarks.fatigueHoldingHead ? 'Yes' : 'No']
          ]);
        }

        // Treatment Plan
        addDetailedSection('TREATMENT PLAN', colors.accent, [
          ['Chiropractic Adjustment', v.chiropracticAdjustment?.join(', ')],
          ['Chiropractic Other Notes', v.chiropracticOther],
          ['Acupuncture', v.acupuncture?.join(', ')],
          ['Acupuncture Other Notes', v.acupunctureOther],
          ['Physiotherapy', v.physiotherapy?.join(', ')],
          ['Rehabilitation Exercises', v.rehabilitationExercises?.join(', ')],
          ['Treatment Frequency', v.durationFrequency ? `${v.durationFrequency.timesPerWeek} times/week, re-eval in ${v.durationFrequency.reEvalInWeeks} weeks` : ''],
          ['Referrals', v.referrals?.join(', ')],
          ['Imaging', v.imaging ? Object.entries(v.imaging).map(([modality, parts]) => `${modality.toUpperCase()}: ${parts.join(', ')}`).join('; ') : ''],
          ['Diagnostic Ultrasound', v.diagnosticUltrasound],
          ['Nerve Study', v.nerveStudy?.join(', ')],
          ['Restrictions', v.restrictions ? `Avoid activity for ${v.restrictions.avoidActivityWeeks} weeks, lifting limit ${v.restrictions.liftingLimitLbs} lbs${v.restrictions.avoidProlongedSitting ? ', avoid prolonged sitting' : ''}` : ''],
          ['Disability Duration', v.disabilityDuration]
        ]);
      }
  
      if (grouped.followup) {
        const v = grouped.followup;
        
        // Follow-up Visit - Main Heading
        addDetailedSection('FOLLOW-UP VISIT', colors.success, [
          ['Visit Date', new Date(v.date).toLocaleDateString()],
          ['Provider', `Dr. ${v.doctor.firstName} ${v.doctor.lastName}`]
        ], true);

        // Progress Assessment
        addDetailedSection('PROGRESS ASSESSMENT', colors.success, [
          ['Progress Notes', v.progressNotes],
          ['Assessment Update', v.assessmentUpdate],
          ['Areas Status', [v.areasImproving && '✓ Improving', v.areasExacerbated && '✗ Exacerbated', v.areasSame && '➔ Same', v.areasResolved && '✓ Resolved'].filter(Boolean).join(' ')],
          ['Areas', v.areas]
        ]);

        // Muscle Palpation and Pain
        addDetailedSection('MUSCLE & PAIN ASSESSMENT', colors.success, [
          ['Muscle Palpation', v.musclePalpation],
          ['Pain Radiating', v.painRadiating],
          ['Activities Causing Pain', [v.activitiesCausePain, v.activitiesCausePainOther].filter(Boolean).join(' ')]
        ]);

        // Range of Motion
        addDetailedSection('RANGE OF MOTION', colors.success, [
          ['Range of Motion', [v.romWnlNoPain && '✓ WNL (No Pain)', v.romWnlWithPain && '⚠ WNL (With Pain)', v.romImproved && '↑ Improved', v.romDecreased && '↓ Decreased', v.romSame && '→ Same'].filter(Boolean).join(' ')]
        ]);

        // Orthopedic Tests
        if (v.orthos) {
          addDetailedSection('ORTHOPEDIC TESTS', colors.success, [
            ['Orthopedic Tests', `${v.orthos.tests} - ${v.orthos.result}`]
          ]);
        }

        // Treatment Plan
        if (v.treatmentPlan) {
          addDetailedSection('TREATMENT PLAN', colors.success, [
            ['Treatments', v.treatmentPlan.treatments],
            ['Times Per Week', v.treatmentPlan.timesPerWeek],
            ['Chiropractic', v.treatmentPlan.chiropractic ? 'Yes' : 'No'],
            ['Acupuncture', v.treatmentPlan.acupuncture ? 'Yes' : 'No'],
            ['Mechanical Traction', v.treatmentPlan.mechanicalTraction ? 'Yes' : 'No'],
            ['Myofascial Release', v.treatmentPlan.myofascialRelease ? 'Yes' : 'No'],
            ['Ultrasound', v.treatmentPlan.ultrasound ? 'Yes' : 'No'],
            ['Infrared Electric Muscle Stimulation', v.treatmentPlan.infraredElectricMuscleStimulation ? 'Yes' : 'No'],
            ['Therapeutic Exercise', v.treatmentPlan.therapeuticExercise ? 'Yes' : 'No'],
            ['Neuromuscular Reeducation', v.treatmentPlan.neuromuscularReeducation ? 'Yes' : 'No'],
            ['Other', v.treatmentPlan.other]
          ]);
        }

        // Overall Response
        addDetailedSection('RESPONSE & OUTCOME', colors.success, [
          ['Overall Response', [v.overallResponse?.improving && '↑ Improving', v.overallResponse?.worse && '↓ Worse', v.overallResponse?.same && '→ Same'].filter(Boolean).join(' ')],
          ['Diagnostic Study', v.diagnosticStudy ? `${v.diagnosticStudy.study} of ${v.diagnosticStudy.bodyPart}: ${v.diagnosticStudy.result}` : ''],
          ['Home Care', Array.isArray(v.homeCare) ? v.homeCare.join(', ') : (typeof v.homeCare === 'object' ? Object.entries(v.homeCare).filter(([_, value]) => value).map(([key, _]) => key).join(', ') : 'N/A')],
          ['Home Care Suggestions', v.homeCareSuggestions],
          ['Referral', v.referral],
          ['Notes', v.otherNotes]
        ]);

        // Fetched Data (if available)
        if (v.fetchedData) {
          addDetailedSection('ADDITIONAL DATA', colors.success, [
            ['Initial Visit Data', v.fetchedData.initialVisitData ? 'Available' : 'N/A'],
            ['Muscle Palpation Data', v.fetchedData.musclePalpationData ? 'Available' : 'N/A'],
            ['Ortho Tests Data', v.fetchedData.orthoTestsData ? 'Available' : 'N/A'],
            ['AROM Data', v.fetchedData.aromData ? 'Available' : 'N/A'],
            ['Activities Pain Data', v.fetchedData.activitiesPainData ? 'Available' : 'N/A'],
            ['Treatment List Data', v.fetchedData.treatmentListData ? 'Available' : 'N/A'],
            ['Imaging Data', v.fetchedData.imagingData ? 'Available' : 'N/A']
          ]);
        }
      }
  
      if (grouped.discharge) {
        const v = grouped.discharge;
        
        // Discharge Visit - Main Heading
        addDetailedSection('DISCHARGE VISIT', colors.secondary, [
          ['Visit Date', new Date(v.date).toLocaleDateString()],
          ['Provider', `Dr. ${v.doctor.firstName} ${v.doctor.lastName}`]
        ], true);

        // Treatment Summary
        addDetailedSection('TREATMENT SUMMARY', colors.secondary, [
          ['Treatment Summary', v.treatmentSummary],
          ['Discharge Status', v.dischargeStatus],
          ['Prognosis', v.prognosis],
          ['Range of Motion', v.romPercent ? `${v.romPercent}% of pre-injury ROM` : '']
        ]);

        // Diagnosis and Medications
        addDetailedSection('DIAGNOSIS & MEDICATIONS', colors.secondary, [
          ['Discharge Diagnosis', v.dischargeDiagnosis?.join(', ')],
          ['Medications at Discharge', v.medicationsAtDischarge?.map(med => `${med.name} (${med.dosage}, ${med.frequency}, ${med.duration})`).join('; ')],
          ['Diagnostic Study', v.diagnosticStudy ? `${v.diagnosticStudy.study} of ${v.diagnosticStudy.bodyPart}: ${v.diagnosticStudy.result}` : '']
        ]);

        // Future Care and Instructions
        addDetailedSection('FUTURE CARE & INSTRUCTIONS', colors.secondary, [
          ['Recommended Future Medical Care', Array.isArray(v.futureMedicalCare) ? v.futureMedicalCare.join(', ') : (v.futureMedicalCare || 'N/A')],
          ['Follow-up Instructions', v.followUpInstructions],
          ['Return Precautions', v.returnPrecautions?.join(', ')],
          ['Home Care Instructions', Array.isArray(v.homeCare) ? v.homeCare.join(', ') : (typeof v.homeCare === 'object' ? Object.entries(v.homeCare).filter(([_, value]) => value).map(([key, _]) => key).join(', ') : 'N/A')]
        ]);

        // Disability and Criteria
        addDetailedSection('DISABILITY & CRITERIA', colors.secondary, [
          ['Croft Criteria', v.croftCriteria],
          ['AMA Disability', v.amaDisability],
          ['Referrals / Notes', v.referralsNotes]
        ]);
      }
  
      // AI NARRATIVE (Enhanced formatting) - Always include as comprehensive summary
      if (aiNarrative) {
        // Add a separator before AI narrative
        if (y > 250) {
          doc.addPage();
          y = 30;
        }
        
        // Handle structured JSON response
        if (typeof aiNarrative === 'object' && aiNarrative.sections) {
          // Add main AI narrative heading with enhanced styling
          doc.setFontSize(16);
          doc.setTextColor(colors.purple[0], colors.purple[1], colors.purple[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(aiNarrative.title || 'COMPREHENSIVE MEDICAL NARRATIVE', pageWidth / 2, y, { align: 'center' });
          y += 20;
          
          // Add summary if available
          if (aiNarrative.summary) {
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'italic');
            const summaryText = doc.splitTextToSize(aiNarrative.summary, pageWidth - margin * 2);
            doc.text(summaryText, margin, y);
            y += summaryText.length * 6 + 15;
          }
          
          // Process each section with enhanced formatting
          aiNarrative.sections.forEach((section: any) => {
            if (y > 240) {
              doc.addPage();
              y = 30;
            }
            
            // Section header with icon and enhanced styling
            doc.setFontSize(13);
            doc.setTextColor(colors.purple[0], colors.purple[1], colors.purple[2]);
            doc.setFont('helvetica', 'bold');
            
            // Add colored background for section headers
            doc.setFillColor(250, 248, 255); // Light purple background
            doc.rect(margin - 5, y - 8, pageWidth - margin * 2 + 10, 16, 'F');
            
            // Use simple bullet instead of emoji for PDF compatibility
            const headerText = `• ${section.heading}`;
            doc.text(headerText, margin, y);
            y += 18;
            
            // Section content with improved paragraph formatting
            if (section.content && Array.isArray(section.content)) {
              section.content.forEach((item: string) => {
                if (y > 250) {
                  doc.addPage();
                  y = 30;
                }
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                
                // Add bullet point with paragraph formatting
                const bulletText = `• ${item}`;
                const wrappedText = doc.splitTextToSize(bulletText, pageWidth - margin * 2 - 15);
                doc.text(wrappedText, margin + 8, y);
                y += wrappedText.length * 5.5 + 8; // Extra spacing between paragraphs
              });
            }
            
            // Add spacing between sections
            y += 10;
          });
          
          // Add generation timestamp
          if (aiNarrative.generatedAt) {
            if (y > 260) {
              doc.addPage();
              y = 30;
            }
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'italic');
            doc.text(`Generated: ${new Date(aiNarrative.generatedAt).toLocaleString()}`, margin, y);
            y += 15;
          }
        } 
        // Handle plain text response (fallback)
        else if (typeof aiNarrative === 'string' && aiNarrative.trim()) {
        // Add main AI narrative heading
        doc.setFontSize(14);
        doc.setTextColor(colors.purple[0], colors.purple[1], colors.purple[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPREHENSIVE MEDICAL NARRATIVE', pageWidth / 2, y, { align: 'center' });
        y += 15;
        
        // Parse and format the AI narrative
        const matches = [...aiNarrative.matchAll(/\*\*(.+?):\*\*\s*([\s\S]*?)(?=\*\*|$)/g)];
        
        if (matches.length > 0) {
          // If AI returned structured sections, format them
          matches.forEach(([_, section, content]) => {
            addDetailedSection(section.toUpperCase(), colors.purple, [[section, content.trim()]]);
          });
        } else {
          // If AI returned unstructured text, format it as paragraphs
          const paragraphs = aiNarrative.split('\n\n').filter((p: string) => p.trim());
            paragraphs.forEach((paragraph: string) => {
            if (y > 260) {
              doc.addPage();
              y = 30;
            }
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(50);
            
            const wrappedText = doc.splitTextToSize(paragraph.trim(), pageWidth - margin * 2);
            doc.text(wrappedText, margin, y);
            y += wrappedText.length * 6 + 8;
          });
          }
        }
      }
  
      // SIGNATURE
      if (y > 220) {
        doc.addPage();
        y = 30;
      }
      doc.addImage(signatureBase64, 'PNG', margin, y, 40, 20);
      y += 22;
      doc.setDrawColor(0);
      doc.line(margin, y, margin + 60, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Harold Iseke, D.C.', margin, y);
      y += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Treating Provider', margin, y);
  
      // PAGINATION
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addHeaderAndFooter(doc, i, totalPages);
      }
  
      const fileName = `${patient.lastName}_${patient.firstName}_Medical_Report.pdf`;
      const blob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', blob, fileName);
      await axios.post('https://emr-h.onrender.com/api/reports/upload', formData);
  
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  
      toast.success('Report generated and downloaded successfully');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
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
      {isGeneratingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <span className="text-lg font-semibold text-gray-700">Generating report, please wait...</span>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => navigate('/patients')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600">
              {calculateAge(patient.dateOfBirth)} years • {patient.gender} • {patient.status}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/patients/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
          {user?.role === 'doctor' && (
            <>
              <Link
                to={`/appointments/new?patient=${id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Link>
              {visits.length > 0 ? (
                <>
                  <Link
                    to={`/patients/${id}/visits/followup`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    New Follow-up
                  </Link>
                  {patient.status !== 'discharged' && (
                    <Link
                      to={`/patients/${id}/visits/discharge`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Discharge
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to={`/patients/${id}/visits/initial`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Initial Visit
                </Link>
              )}
            </>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
          <button
            onClick={generateFullReport}
            disabled={isGeneratingReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingReport ? 'Generating...' : 'Export PDF'}
          </button>
          {/* <button
            onClick={generateAiPreview}
            disabled={isGeneratingReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {isGeneratingReport ? 'Generating...' : 'AI Preview'}
          </button> */}
          <button
            onClick={async () => {
              // Refresh patient data before opening modal
              try {
                const patientResponse = await axios.get(`https://emr-h.onrender.com/api/patients/${id}`);
                setPatient(patientResponse.data);
              } catch (error) {
                console.error('Error refreshing patient data:', error);
              }
              setModalIsOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Chief Complaint
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'visits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visits ({visits.length})
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing ({invoiceCount})

            </button>
          </nav>
        </div>
      </div>

      <div ref={printRef}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              </div>
              {expandedSections.personalInfo && (
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.firstName} {patient.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(patient.dateOfBirth).toLocaleDateString()} ({calculateAge(patient.dateOfBirth)} years)
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{patient.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            patient.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : patient.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {patient.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Assigned Doctor</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        Dr. {patient.assignedDoctor?.firstName} {patient.assignedDoctor?.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Patient Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Accident</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {patient.accidentDate ? new Date(patient.accidentDate).toLocaleDateString() : 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type of Accident</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {patient.accidentType || 'Not provided'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
              </div>
              {expandedSections.contactInfo && (
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-y-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {patient.address.street && <p>{patient.address.street}</p>}
                        {(patient.address.city || patient.address.state) && (
                          <p>
                            {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                          </p>
                        )}
                        {patient.address.country && <p>{patient.address.country}</p>}
                      </dd>
                    </div>
                    
                  </dl>
                </div>
              )}
            </div>

            {/* Medical History */}
            <div className="bg-white shadow rounded-lg overflow-hidden md:col-span-2">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Medical History</h2>
              </div>
              {expandedSections.medicalHistory && (
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Allergies</h3>
                      {patient.medicalHistory.allergies.length > 0 && patient.medicalHistory.allergies[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.allergies.map((allergy, index) => (
                            allergy && <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No known allergies</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Current Medications</h3>
                      {patient.medicalHistory.medications.length > 0 && patient.medicalHistory.medications[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.medications.map((medication, index) => (
                            medication && <li key={index}>{medication}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No current medications</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Medical Conditions</h3>
                      {patient.medicalHistory.conditions.length > 0 && patient.medicalHistory.conditions[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.conditions.map((condition, index) => (
                            condition && <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No known medical conditions</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Past Surgeries</h3>
                      {patient.medicalHistory.surgeries.length > 0 && patient.medicalHistory.surgeries[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.surgeries.map((surgery, index) => (
                            surgery && <li key={index}>{surgery}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No past surgeries</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Family History</h3>
                      {patient.medicalHistory.familyHistory.length > 0 && patient.medicalHistory.familyHistory[0] ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {patient.medicalHistory.familyHistory.map((history, index) => (
                            history && <li key={index}>{history}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No family history provided</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

{/* Subjective Intake */}
<div className="bg-white shadow rounded-lg overflow-hidden md:col-span-2">
  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
    <h2 className="text-lg font-medium text-gray-900">Subjective Intake</h2>
  </div>
  <div className="px-6 py-4">
    {/* Display body parts summary */}
    <div className="mb-4">
      <h3 className="text-md font-medium text-gray-800 mb-2">Body Parts</h3>
      <div className="text-sm text-gray-900">
        {patient.subjective?.bodyPart?.length
          ? patient.subjective.bodyPart.map(bp => `${bp.part} (${bp.side})`).join(', ')
          : 'No body parts recorded'}
      </div>
    </div>

    {/* Display detailed subjective intakes for each body part */}
    {patient.subjective?.bodyPart && patient.subjective.bodyPart.length > 0 ? (
      <div className="space-y-6">
        {patient.subjective.bodyPart.map((bp, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold text-blue-700 mb-3">
              {bp.part} - {bp.side}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {/* Severity */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Severity</dt>
                <dd className="mt-1 text-sm text-gray-900">{bp.severity || 'N/A'}</dd>
              </div>
              
              {/* Quality */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Quality</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {bp.quality?.length
                    ? bp.quality.join(', ')
                    : 'N/A'}
                </dd>
              </div>
              
              {/* Timing */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Timing</dt>
                <dd className="mt-1 text-sm text-gray-900">{bp.timing || 'N/A'}</dd>
              </div>
              
              {/* Context */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Context</dt>
                <dd className="mt-1 text-sm text-gray-900">{bp.context || 'N/A'}</dd>
              </div>
              
              {/* Exacerbated By */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Exacerbated By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {bp.exacerbatedBy?.length
                    ? bp.exacerbatedBy.join(', ')
                    : 'N/A'}
                </dd>
              </div>
              
              {/* Symptoms */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {bp.symptoms?.length
                    ? bp.symptoms.join(', ')
                    : 'N/A'}
                </dd>
              </div>
              
              {/* Radiating To */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Radiating To</dt>
                <dd className="mt-1 text-sm text-gray-900">{bp.radiatingTo || 'N/A'}</dd>
              </div>
              
              {/* Radiating Pain */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Radiating Pain</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {[
                    bp.radiatingLeft && 'Left',
                    bp.radiatingRight && 'Right',
                  ].filter(Boolean).join(', ') || 'None'}
                </dd>
              </div>
              
              {/* Sciatica */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Sciatica</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {[
                    bp.sciaticaLeft && 'Left',
                    bp.sciaticaRight && 'Right',
                  ].filter(Boolean).join(', ') || 'None'}
                </dd>
              </div>
              
              {/* Notes */}
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{bp.notes || 'N/A'}</dd>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : patient.subjective?.intakes && patient.subjective.intakes.length > 0 ? (
      <div className="space-y-6">
        {patient.subjective.intakes.map((intake, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold text-blue-700 mb-3">
              {intake.bodyPart} - {intake.side}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {/* Headache */}
              {intake.headache?.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Headache</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.headache.join(', ')}</dd>
                </div>
              )}
              
              {/* Severity */}
              {intake.severity && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Severity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.severity}</dd>
                </div>
              )}
              
              {/* Quality */}
              {intake.quality?.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quality</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.quality.join(', ')}</dd>
                </div>
              )}
              
              {/* Timing */}
              {intake.timing && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timing</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.timing}</dd>
                </div>
              )}
              
              {/* Context */}
              {intake.context && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Context</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.context}</dd>
                </div>
              )}
              
              {/* Exacerbated By */}
              {intake.exacerbatedBy?.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Exacerbated By</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.exacerbatedBy.join(', ')}</dd>
                </div>
              )}
              
              {/* Symptoms */}
              {intake.symptoms?.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.symptoms.join(', ')}</dd>
                </div>
              )}
              
              {/* Radiating To */}
              {intake.radiatingTo && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Radiating To</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.radiatingTo}</dd>
                </div>
              )}
              
              {/* Radiating Pain */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Radiating Pain</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {[
                    intake.radiatingLeft && 'Left',
                    intake.radiatingRight && 'Right',
                  ].filter(Boolean).join(', ') || 'None'}
                </dd>
              </div>
              
              {/* Sciatica */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Sciatica</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {[
                    intake.sciaticaLeft && 'Left',
                    intake.sciaticaRight && 'Right',
                  ].filter(Boolean).join(', ') || 'None'}
                </dd>
              </div>
              
              {/* Notes */}
              {intake.notes && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{intake.notes}</dd>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No subjective intake data recorded</p>
    )}

    {/* Legacy subjective data display for backward compatibility */}
    {(!patient.subjective?.intakes || patient.subjective.intakes.length === 0) && 
     (!patient.subjective?.bodyPart || patient.subjective.bodyPart.length === 0) && 
     (patient.subjective?.severity || patient.subjective?.timing || patient.subjective?.context || patient.subjective?.quality || patient.subjective?.exacerbatedBy || patient.subjective?.symptoms || patient.subjective?.radiatingTo || patient.subjective?.radiatingLeft || patient.subjective?.radiatingRight || patient.subjective?.sciaticaLeft || patient.subjective?.sciaticaRight || patient.subjective?.notes) && (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">Legacy Subjective Data</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Severity</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.severity || 'N/A'}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Timing</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.timing || 'N/A'}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Context</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.context || 'N/A'}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Quality</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {patient.subjective?.quality?.length
                ? patient.subjective.quality.join(', ')
                : 'N/A'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Exacerbated By</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {patient.subjective?.exacerbatedBy?.length
                ? patient.subjective.exacerbatedBy.join(', ')
                : 'N/A'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {patient.subjective?.symptoms?.length
                ? patient.subjective.symptoms.join(', ')
                : 'N/A'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Radiating To</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.subjective?.radiatingTo || 'N/A'}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Radiating Pain</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {[
                patient.subjective?.radiatingLeft && 'Left',
                patient.subjective?.radiatingRight && 'Right',
              ].filter(Boolean).join(', ') || 'None'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Sciatica</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {[
                patient.subjective?.sciaticaLeft && 'Left',
                patient.subjective?.sciaticaRight && 'Right',
              ].filter(Boolean).join(', ') || 'None'}
            </dd>
          </div>

          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{patient.subjective?.notes || 'N/A'}</dd>
          </div>
        </dl>
      </div>
    )}
  </div>
</div>


            {/* Attorney Information */}
<div className="bg-white shadow rounded-lg overflow-hidden md:col-span-2">
  <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-lg font-medium text-gray-900">Attorney Information</h2>
  </div>
  <div className="px-6 py-4">
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
      <div>
        <dt className="text-sm font-medium text-gray-500">Attorney Name</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.name || 'Not provided'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Firm Name</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.firm || 'Not provided'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Phone</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.phone || 'Not provided'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Email</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.email || 'Not provided'}
        </dd>
      </div>
      <div className="md:col-span-2">
        <dt className="text-sm font-medium text-gray-500">Address</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {patient.attorney?.address?.street ? (
            <>
              <p>{patient.attorney.address.street}</p>
              <p>{patient.attorney.address.city}, {patient.attorney.address.state} {patient.attorney.address.zipCode}</p>
              {patient.attorney.address.country && <p>{patient.attorney.address.country}</p>}
            </>
          ) : (
            'Not provided'
          )}
        </dd>
      </div>
                          <div>
                      <dt className="text-sm font-medium text-gray-500">Case Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {patient.attorney?.caseNumber || 'Not provided'}
                      </dd>
                    </div>
    </dl>
  </div>
</div>

          </div>
        )}

        {activeTab === 'visits' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Visit History</h2>
              {user?.role === 'doctor' && (
                <div className="flex space-x-2">
                  {visits.length > 0 ? (
                    <>
                      <Link
                        to={`/patients/${id}/visits/followup`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        New Follow-up
                      </Link>
                      <button
                        onClick={generateFullReport}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FileArchive className="mr-2 h-4 w-4" />
                        Full Report
                      </button>
                      {patient.status !== 'discharged' && (
                        <Link
                          to={`/patients/${id}/visits/discharge`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Discharge
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      to={`/patients/${id}/visits/initial`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Initial Visit
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <tr key={visit._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(visit.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              visit.visitType === 'initial'
                                ? 'bg-blue-100 text-blue-800'
                                : visit.visitType === 'followup'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {visit.visitType === 'initial'
                              ? 'Initial Visit'
                              : visit.visitType === 'followup'
                              ? 'Follow-up'
                              : 'Discharge'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Dr. {visit.doctor.firstName} {visit.doctor.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {(visit.notes ||
                           visit.otherNotes ||
                           visit.referralsNotes ||
                           'No notes provided') as string}
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
  to={`/visits/${visit._id}`} 
  className="text-blue-600 hover:text-blue-900 underline"
>
  View Details
</Link>

                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No visits recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {selectedVisit && (
  <div className="p-6 mt-6 bg-gray-50 border border-gray-200 rounded-lg shadow">
    <h2 className="text-lg font-semibold mb-2">Assessment and Plan</h2>
    <h3 className="text-base font-bold mb-2 underline">Treatment Plans/Rationale</h3>
    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
    {selectedVisit.plan?.diagnosis && (
  <li>
    <strong>Diagnosis:</strong> {selectedVisit.plan.diagnosis.join(', ')}
  </li>
)}


{selectedVisit.plan?.medications && (
  <li>
    <strong>Medications:</strong>
    <ul className="list-disc pl-5">
      {selectedVisit.plan.medications.map((med, index) => (
        <li key={index}>
          {med.name} - {med.dosage}, {med.frequency}
        </li>
      ))}
    </ul>
  </li>
)}
<li>{selectedVisit.scheduleOfCare || 'Schedule of care not provided.'}</li>
<li>{selectedVisit.physicalModality || 'Physical modality not specified.'}</li>
<li>{selectedVisit.reevaluation || 'Re-evaluation plan not specified.'}</li>
<li>{selectedVisit.returnFrequency || 'Visit frequency not mentioned.'}</li>
<li>{selectedVisit.referral || 'Referral notes not added.'}</li>
{selectedVisit.restrictions ? (
  <li>
    <strong>Restrictions:</strong>
    <ul>
      {selectedVisit.restrictions.avoidActivityWeeks && <li>Avoid Activity: {selectedVisit.restrictions.avoidActivityWeeks} week(s)</li>}
      {selectedVisit.restrictions.liftingLimitLbs && <li>Lifting Limit: {selectedVisit.restrictions.liftingLimitLbs} lbs</li>}
      {selectedVisit.restrictions.avoidProlongedSitting && <li>Avoid prolonged sitting/standing</li>}
    </ul>
  </li>
) : (
  <li>No activity restrictions recorded.</li>
)}



{selectedVisit.plan?.medications && (
  <li>
    <strong>Medications:</strong>{' '}
    <ul className="list-disc pl-5">
      {selectedVisit.plan.medications.map((med, index) => (
        <li key={index}>
          {med.name} - {med.dosage}, {med.frequency}
        </li>
      ))}
    </ul>
  </li>
)}

      <li>{selectedVisit.scheduleOfCare || 'Schedule of care not provided.'}</li>
      <li>{selectedVisit.physicalModality || 'Physical modality not specified.'}</li>
      <li>{selectedVisit.reevaluation || 'Re-evaluation plan not specified.'}</li>
      <li>{selectedVisit.returnFrequency || 'Visit frequency not mentioned.'}</li>
      <li>{selectedVisit.referral || 'Referral notes not added.'}</li>
      {selectedVisit.restrictions ? (
        <li>
          <strong>Restrictions:</strong>
          <ul>
            {selectedVisit.restrictions.avoidActivityWeeks && <li>Avoid Activity: {selectedVisit.restrictions.avoidActivityWeeks} week(s)</li>}
            {selectedVisit.restrictions.liftingLimitLbs && <li>Lifting Limit: {selectedVisit.restrictions.liftingLimitLbs} lbs</li>}
            {selectedVisit.restrictions.avoidProlongedSitting && <li>Avoid prolonged sitting/standing</li>}
          </ul>
        </li>
      ) : (
        <li>No activity restrictions recorded.</li>
      )}
    </ul>
    <div className="mt-4">
      <button
        onClick={() => setSelectedVisit(null)}
        className="text-sm text-blue-500 underline"
      >
        Close Details
      </button>
    </div>
  </div>
)}

            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Appointments</h2>
              <Link
                to={`/appointments/new?patient=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(appointment.date).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {appointment.time.start} - {appointment.time.end}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {appointment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {appointment.notes || 'No notes provided'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/appointments/${appointment._id}/edit`} className="text-blue-600 hover:text-blue-900">
                            View/Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No appointments scheduled
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Billing & Invoices</h2>
              <Link
                to={`/billing/new?patient=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </div>
            <div className="p-4">
            <BillingList 
  patientId={id} 
  showPatientColumn={false} 
  showHeader={true} 
/>

            </div>
          </div>
        )}
      </div>

      {/* Chief Complaint Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Chief Complaint Modal"
        className="bg-white rounded-lg shadow-lg max-w-lg mx-auto mt-20 p-0 overflow-hidden"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
      >
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
          <h2 className="text-xl font-bold text-white">Chief Complaint Info</h2>
        </div>

        {isLoading ? (
          <div className="p-6 flex justify-center items-center h-40">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                    <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : patient?.subjective ? (
          <div className="p-6">
            {/* Main content area */}
            <div className="text-sm text-gray-700 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Body Part section */}
              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 mb-4">
                <h3 className="text-md font-semibold text-blue-700 mb-2">Body Part Information</h3>
                <div className="font-medium">
                  {patient.subjective.bodyPart && Array.isArray(patient.subjective.bodyPart) && patient.subjective.bodyPart.length > 0 ? 
                    patient.subjective.bodyPart.map((bp) => 
                      typeof bp === 'object' && bp.part ? 
                        `${bp.part}${bp.side ? ` (${bp.side})` : ''}` : 
                        String(bp)
                    ).join(', ') : 
                    'No body parts specified'
                  }
                </div>
              </div>

              {/* Basic Subjective Data */}
              <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500 mb-4">
                <h3 className="text-md font-semibold text-green-700 mb-2">Basic Information</h3>
                <div className="bg-white p-3 rounded shadow-sm space-y-2">
                  <div><strong>Full Name:</strong> {patient.subjective.fullName || 'N/A'}</div>
                  <div><strong>Date:</strong> {patient.subjective.date || 'N/A'}</div>
                  <div><strong>Severity:</strong> {patient.subjective.severity || 'N/A'}</div>
                  <div><strong>Timing:</strong> {patient.subjective.timing || 'N/A'}</div>
                  <div><strong>Context:</strong> {patient.subjective.context || 'N/A'}</div>
                  <div><strong>Notes:</strong> {patient.subjective.notes || 'N/A'}</div>
                </div>
              </div>

              {/* Symptoms and Quality */}
              <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500 mb-4">
                <h3 className="text-md font-semibold text-purple-700 mb-2">Symptoms & Quality</h3>
                <div className="bg-white p-3 rounded shadow-sm space-y-2">
                  <div><strong>Quality:</strong> {patient.subjective.quality && Array.isArray(patient.subjective.quality) ? patient.subjective.quality.join(', ') : 'N/A'}</div>
                  <div><strong>Exacerbated By:</strong> {patient.subjective.exacerbatedBy && Array.isArray(patient.subjective.exacerbatedBy) ? patient.subjective.exacerbatedBy.join(', ') : 'N/A'}</div>
                  <div><strong>Symptoms:</strong> {patient.subjective.symptoms && Array.isArray(patient.subjective.symptoms) ? patient.subjective.symptoms.join(', ') : 'N/A'}</div>
                  <div><strong>Radiating To:</strong> {patient.subjective.radiatingTo || 'N/A'}</div>
                  <div><strong>Radiating Pain:</strong> {
                    (patient.subjective.radiatingLeft || patient.subjective.radiatingRight) ? 
                      [patient.subjective.radiatingLeft && 'Left', patient.subjective.radiatingRight && 'Right'].filter(Boolean).join(', ') : 
                      'None'
                  }</div>
                  <div><strong>Sciatica:</strong> {
                    (patient.subjective.sciaticaLeft || patient.subjective.sciaticaRight) ? 
                      [patient.subjective.sciaticaLeft && 'Left', patient.subjective.sciaticaRight && 'Right'].filter(Boolean).join(', ') : 
                      'None'
                  }</div>
                </div>
              </div>

              {/* Detailed Intakes */}
              {patient.subjective.intakes && Array.isArray(patient.subjective.intakes) && patient.subjective.intakes.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500 mb-4">
                  <h3 className="text-md font-semibold text-orange-700 mb-2">Detailed Intakes</h3>
                  <div className="space-y-3">
                    {patient.subjective.intakes.map((intake, index) => (
                      <div key={index} className="bg-white p-3 rounded shadow-sm border-l-4 border-orange-300">
                        <h4 className="font-semibold text-orange-600 mb-2">
                          {intake.bodyPart} - {intake.side}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div><strong>Severity:</strong> {intake.severity || 'N/A'}</div>
                          <div><strong>Timing:</strong> {intake.timing || 'N/A'}</div>
                          <div><strong>Context:</strong> {intake.context || 'N/A'}</div>
                          <div><strong>Quality:</strong> {intake.quality && Array.isArray(intake.quality) ? intake.quality.join(', ') : 'N/A'}</div>
                          <div><strong>Exacerbated By:</strong> {intake.exacerbatedBy && Array.isArray(intake.exacerbatedBy) ? intake.exacerbatedBy.join(', ') : 'N/A'}</div>
                          <div><strong>Symptoms:</strong> {intake.symptoms && Array.isArray(intake.symptoms) ? intake.symptoms.join(', ') : 'N/A'}</div>
                          <div><strong>Radiating To:</strong> {intake.radiatingTo || 'N/A'}</div>
                          <div><strong>Radiating Pain:</strong> {
                            (intake.radiatingLeft || intake.radiatingRight) ? 
                              [intake.radiatingLeft && 'Left', intake.radiatingRight && 'Right'].filter(Boolean).join(', ') : 
                              'None'
                          }</div>
                          <div><strong>Sciatica:</strong> {
                            (intake.sciaticaLeft || intake.sciaticaRight) ? 
                              [intake.sciaticaLeft && 'Left', intake.sciaticaRight && 'Right'].filter(Boolean).join(', ') : 
                              'None'
                          }</div>
                          <div className="md:col-span-2"><strong>Notes:</strong> {intake.notes || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data for Debugging */}
              <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-500 mb-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Raw Subjective Data</h3>
                <div className="bg-white p-3 rounded shadow-sm">
                  <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(patient.subjective, null, 2)}
                  </pre>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Has intakes array:</strong> {patient.subjective.intakes ? 'Yes' : 'No'}</p>
                  <p><strong>Intakes length:</strong> {patient.subjective.intakes?.length || 0}</p>
                  <p><strong>Has bodyPart array:</strong> {patient.subjective.bodyPart ? 'Yes' : 'No'}</p>
                  <p><strong>BodyPart length:</strong> {patient.subjective.bodyPart?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No subjective data found. Please ensure subjective intake data has been saved for this patient.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
          <button
            onClick={() => setModalIsOpen(false)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* AI Narrative Preview Modal */}
      <Modal
        isOpen={showAiPreview}
        onRequestClose={() => setShowAiPreview(false)}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        contentLabel="AI Narrative Preview"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="mr-2 h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Medical Narrative Preview
            </h2>
            <button
              onClick={() => setShowAiPreview(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {aiNarrativePreview && typeof aiNarrativePreview === 'object' && aiNarrativePreview.sections ? (
              <div className="space-y-6">
                {/* Title and Summary */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {aiNarrativePreview.title}
                  </h1>
                  {aiNarrativePreview.summary && (
                    <p className="text-gray-600 italic max-w-3xl mx-auto">
                      {aiNarrativePreview.summary}
                    </p>
                  )}
                  {aiNarrativePreview.generatedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Generated: {new Date(aiNarrativePreview.generatedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Sections */}
                {aiNarrativePreview.sections.map((section: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-purple-700 mb-3 flex items-center">
                      <span className="mr-2 text-xl">{getIconForSection(section.icon, section.heading)}</span>
                      {section.heading}
                    </h2>
                    <div className="space-y-2">
                      {section.content && Array.isArray(section.content) && section.content.map((item: string, itemIndex: number) => (
                        <div key={itemIndex} className="mb-4">
                          <div className="flex items-start">
                            <span className="text-purple-500 mr-3 mt-1 flex-shrink-0 text-lg">•</span>
                            <p className="text-gray-700 text-sm leading-relaxed text-justify">{item}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  {aiNarrativePreview ? (
                    <div className="whitespace-pre-wrap text-left bg-gray-50 p-4 rounded-lg">
                      {typeof aiNarrativePreview === 'string' ? aiNarrativePreview : JSON.stringify(aiNarrativePreview, null, 2)}
                    </div>
                  ) : (
                    <p>No AI narrative generated yet. Click "AI Preview" to generate one.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setShowAiPreview(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowAiPreview(false);
                generateFullReport();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Generate Full PDF Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientDetails;
