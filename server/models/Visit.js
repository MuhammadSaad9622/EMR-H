import mongoose from 'mongoose';

// Base schema for all visits
const baseVisitSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  },
  {
    discriminatorKey: 'visitType', // ✅ Mongoose will add this automatically
    collection: 'visits',
    timestamps: true // ✅ for createdAt and updatedAt
  }
);

const Visit = mongoose.model('Visit', baseVisitSchema);

const initialVisitSchema = new mongoose.Schema({
  chiefComplaint: { type: String, required: true },
  diagnosis: [String],

  vitals: {
    heightFeet: String,
    heightInches: String,
    weight: String,
    temp: String,
    bpSystolic: String,
    bpDiastolic: String,
    pulse: String
  },

  grip: {
    right1: String,
    right2: String,
    right3: String,
    left1: String,
    left2: String,
    left3: String
  },

  appearance: [String],
  appearanceOther: String,

  orientation: {
    timePlacePerson: Boolean,
    otherChecked: Boolean,
    other: String
  },

  posture: [String],
  gait: [String],
  gaitDevice: String,

  dtr: [String],
  dtrOther: String,

  dermatomes: mongoose.Schema.Types.Mixed,

  muscleStrength: [String],
  strength: {
    C5: { right: String, left: String },
    'C5-C6': { right: String, left: String },
    C7: { right: String, left: String },
    C6: { right: String, left: String },
    'C8-T1': { right: String, left: String },
    'L2-L3': { right: String, left: String },
    'L3-L4': { right: String, left: String },
    'L4-L5': { right: String, left: String },
    S1: { right: String, left: String }
  },

  oriented: Boolean,
  neuroNote: String,
  coordination: Boolean,
  romberg: [String],
  rombergNotes: String,
  pronatorDrift: String,
  neuroTests: [String],
  walkTests: [String],
  painLocation: [String],
  radiatingTo: String,

  jointDysfunction: [String],
  jointOther: String,

  chiropracticAdjustment: [String],
  chiropracticOther: String,
  acupuncture: [String],
  acupunctureOther: String,
  physiotherapy: [String],
  rehabilitationExercises: [String],

  durationFrequency: {
    timesPerWeek: Number,
    reEvalInWeeks: Number
  },

  referrals: [String],

  imaging: {
    xray: [String],
    mri: [String],
    ct: [String]
  },

  diagnosticUltrasound: String,
  nerveStudy: [String],

  restrictions: {
    avoidActivityWeeks: Number,
    liftingLimitLbs: Number,
    avoidProlongedSitting: Boolean
  },

  disabilityDuration: String,
  otherNotes: String,

  arom: mongoose.Schema.Types.Mixed,  // object of { bodyPart: { movement: { wnl, exam, pain } } }
  ortho: mongoose.Schema.Types.Mixed, // object of { test: { left, right, ligLaxity? } }

  tenderness: mongoose.Schema.Types.Mixed, // object of { region: [labels] }
  spasm: mongoose.Schema.Types.Mixed,      // object of { region: [labels] }

  lumbarTouchingToesMovement: {
    pain: Boolean,
    painTS: Boolean,
    painLS: Boolean,
    acceleration: Boolean,
    accelerationTSPain: Boolean,
    accelerationLSPain: Boolean,
    deceleration: Boolean,
    decelerationTSPain: Boolean,
    decelerationLSPain: Boolean,
    gowersSign: Boolean,
    gowersSignTS: Boolean,
    gowersSignLS: Boolean,
    deviatingLumbopelvicRhythm: Boolean,
    deviatingFlexionRotation: Boolean,
    deviatingExtensionRotation: Boolean
  },

  cervicalAROMCheckmarks: {
    pain: Boolean,
    poorCoordination: Boolean,
    abnormalJointPlay: Boolean,
    motionNotSmooth: Boolean,
    hypomobilityThoracic: Boolean,
    fatigueHoldingHead: Boolean
  },

  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

}, { timestamps: true });




const followupVisitSchema = new mongoose.Schema({
  previousVisit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },

  // Reevaluation Form Fields
  areas: String,
  areasImproving: Boolean,
  areasExacerbated: Boolean,
  areasSame: Boolean,
  areasResolved: Boolean,
  musclePalpation: String,
  painRadiating: String,
  romWnlNoPain: Boolean,
  romWnlWithPain: Boolean,
  romImproved: Boolean,
  romDecreased: Boolean,
  romSame: Boolean,

  orthos: {
    tests: String,
    result: String
  },

  activitiesCausePain: String,
  activitiesCausePainOther: String,

  treatmentPlan: {
    treatments: String,
    timesPerWeek: String,
    chiropractic: Boolean,
    acupuncture: Boolean,
    mechanicalTraction: Boolean,
    myofascialRelease: Boolean,
    ultrasound: Boolean,
    infraredElectricMuscleStimulation: Boolean,
    therapeuticExercise: Boolean,
    neuromuscularReeducation: Boolean,
    other: String
  },

  overallResponse: {
    improving: Boolean,
    worse: Boolean,
    same: Boolean
  },

  referrals: String,

  diagnosticStudy: {
    study: String,
    bodyPart: String,
    result: String
  },

  homeCare: {
    coreProgram: Boolean,
    stretches: Boolean,
    icePackHotPack: Boolean,
    ligamentStabilityProgram: Boolean,
    other: String
  },

  notes: String, // ⬅️ if not included in base schema, add it here
  homeCareSuggestions: String, // AI-generated home care suggestions

  // ✅ ADDITIONS FOR MODAL-FETCHED DATA

  // Muscle Palpation Modal
  muscleStrength: [String],
  strength: mongoose.Schema.Types.Mixed,
  tenderness: mongoose.Schema.Types.Mixed,
  spasm: mongoose.Schema.Types.Mixed,

  // Ortho Tests Modal
  ortho: mongoose.Schema.Types.Mixed,
  arom: mongoose.Schema.Types.Mixed,

  // Activities/Treatment Plan Modal
  chiropracticAdjustment: [String],
  chiropracticOther: String,
  acupuncture: [String],
  acupunctureOther: String,
  physiotherapy: [String],
  rehabilitationExercises: [String],
  durationFrequency: {
    timesPerWeek: String,
    reEvalInWeeks: String
  },
  diagnosticUltrasound: String,
  disabilityDuration: String,

  // Treatment List Modal
  nerveStudy: [String],
  restrictions: {
    avoidActivityWeeks: String,
    liftingLimitLbs: String,
    avoidProlongedSitting: Boolean
  },
  otherNotes: String,

  // Imaging and Referrals Modal
  imaging: {
    xray: [String],
    mri: [String],
    ct: [String]
  }

}, { timestamps: true });


// Discharge Visit Schema
const dischargeVisitSchema = new mongoose.Schema({
  areasImproving: Boolean,
  areasExacerbated: Boolean,
  areasSame: Boolean,
  areasResolved: Boolean,

  musclePalpation: String,
  painRadiating: String,
  romPercent: Number,
  romWnlNoPain: Boolean,
  romWnlWithPain: Boolean,
  romImproved: Boolean,
  romDecreased: Boolean,
  romSame: Boolean,
  
  orthos: {
    tests: String,
    result: String
  },
  ortho: mongoose.Schema.Types.Mixed,
  arom: mongoose.Schema.Types.Mixed,
  
  activitiesCausePain: String,
  otherNotes: String,

  prognosis: String, // selected prognosis
  diagnosticStudy: {
    study: String,
    bodyPart: String,
    result: String
  },
  futureMedicalCare: [String],
  croftCriteria: String,
  amaDisability: String,
  homeCare: [String],
  referralsNotes: String,
  
  // Additional fields from followup data
  muscleStrength: [String],
  tenderness: mongoose.Schema.Types.Mixed,
  spasm: mongoose.Schema.Types.Mixed,
  homeCareSuggestions: String
});


// Discriminators (no `visitType` manually added here)
const InitialVisit = Visit.discriminator('initial', initialVisitSchema);
const FollowupVisit = Visit.discriminator('followup', followupVisitSchema);
const DischargeVisit = Visit.discriminator('discharge', dischargeVisitSchema);



export { Visit, InitialVisit, FollowupVisit, DischargeVisit };