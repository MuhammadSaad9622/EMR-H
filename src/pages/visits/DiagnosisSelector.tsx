import React, { useState } from 'react';
import Modal from 'react-modal';

// Exportable ICD-10 mapping for use by InitialVisitForm as well
// Codes are general/unspecified where laterality/severity isn't captured here.
// Extend or override as your coding policies require.
// eslint-disable-next-line @typescript-eslint/naming-convention
export const icd10Map: Record<string, string> = {
  // Cervical Spine
  'Cervical strain/sprain': 'S16.1XXA',
  'Cervical radiculopathy': 'M54.12',
  'Cervical disc herniation': 'M50.20',
  'Cervical facet syndrome': 'M53.82',
  'Cervical myelopathy': 'G95.9',
  'Whiplash injury': 'S13.4XXA',
  'Cervical degenerative disc disease': 'M50.30',
  'Cervical stenosis': 'M48.02',

  // Thoracic Spine
  'Thoracic strain/sprain': 'S29.012A',
  'Thoracic radiculopathy': 'M54.14',
  'Thoracic disc herniation': 'M51.24',
  'Thoracic facet syndrome': 'M53.84',
  'Thoracic degenerative disc disease': 'M51.34',
  'Costovertebral dysfunction': 'M99.08',
  'Intercostal neuralgia': 'G58.8',

  // Lumbar Spine
  'Lumbar strain/sprain': 'S39.012A',
  'Lumbar radiculopathy': 'M54.16',
  'Lumbar disc herniation': 'M51.26',
  'Lumbar facet syndrome': 'M53.86',
  'Lumbar degenerative disc disease': 'M51.36',
  'Lumbar stenosis': 'M48.061',
  'Spondylolisthesis': 'M43.10',
  'Spondylosis': 'M47.819',
  'Sciatica': 'M54.30',
  'Lumbar disc bulge': 'M51.26',
  'Lumbar disc protrusion': 'M51.26',
  'Lumbar disc extrusion': 'M51.26',

  // Sacral/Coccyx
  'Sacral dysfunction': 'M53.3',
  'Coccydynia': 'M53.3',
  'Sacral radiculopathy': 'M54.17',

  // Shoulder
  'Shoulder impingement syndrome': 'M75.40',
  'Rotator cuff tear': 'M75.100',
  'Rotator cuff tendinitis': 'M75.80',
  'Adhesive capsulitis (frozen shoulder)': 'M75.00',
  'Shoulder instability': 'M25.319',
  'Acromioclavicular joint sprain': 'S43.50XA',
  'Bicipital tendinitis': 'M75.20',
  'Labral tear': 'S43.439A',

  // Elbow
  'Lateral epicondylitis (tennis elbow)': 'M77.10',
  'Medial epicondylitis (golfer\'s elbow)': 'M77.00',
  'Cubital tunnel syndrome': 'G56.20',
  'Elbow bursitis': 'M70.20',
  'Elbow arthritis': 'M19.029',

  // Wrist/Hand
  'Carpal tunnel syndrome': 'G56.00',
  'De Quervain\'s tenosynovitis': 'M65.4',
  'Wrist sprain': 'S63.509A',
  'Trigger finger': 'M65.30',
  'Dupuytren\'s contracture': 'M72.0',
  'Wrist arthritis': 'M19.039',

  // Hip
  'Hip bursitis': 'M70.70',
  'Hip arthritis': 'M16.10',
  'Hip labral tear': 'S73.192A',
  'Hip impingement': 'M25.859',
  'Piriformis syndrome': 'G57.00',
  'Trochanteric bursitis': 'M70.60',
  'Iliotibial band syndrome': 'M76.30',

  // Knee
  'Knee sprain': 'S83.90XA',
  'Meniscal tear': 'S83.209A',
  'Anterior cruciate ligament tear': 'S83.519A',
  'Posterior cruciate ligament tear': 'S83.529A',
  'Medial collateral ligament sprain': 'S83.419A',
  'Lateral collateral ligament sprain': 'S83.429A',
  'Patellofemoral pain syndrome': 'M22.2X9',
  'Knee arthritis': 'M17.10',
  'Knee bursitis': 'M70.50',
  'Patellar tendinitis': 'M76.50',

  // Ankle/Foot
  'Ankle sprain': 'S93.409A',
  'Plantar fasciitis': 'M72.2',
  'Achilles tendinitis': 'M76.60',
  'Achilles tendon rupture': 'S86.019A',
  'Ankle arthritis': 'M19.079',
  'Tarsal tunnel syndrome': 'G57.50',
  'Metatarsalgia': 'M77.40',
  'Bunion': 'M20.10',
  'Hammertoe': 'M20.40',

  // Neurological
  'Peripheral neuropathy': 'G62.9',
  'Complex regional pain syndrome': 'G90.50',
  'Fibromyalgia': 'M79.7',
  'Myofascial pain syndrome': 'M79.18',
  'Chronic pain syndrome': 'G89.4',
  'Post-traumatic stress disorder': 'F43.10',
  'Depression': 'F32.A',
  'Anxiety': 'F41.9',

  // Other
  'Post-concussion syndrome': 'F07.81',
  'Traumatic brain injury': 'S06.9X9A',
  'Post-traumatic headache': 'G44.309',
  'Dizziness/vertigo': 'R42',
  'Tinnitus': 'H93.19',
  'Sleep disturbance': 'G47.9',
  'Fatigue': 'R53.83',
  'Memory problems': 'R41.3',
  'Concentration difficulties': 'R41.840'
};

interface DiagnosisSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDiagnoses: string[];
  onDiagnosesChange: (diagnoses: string[]) => void;
}

const DiagnosisSelector: React.FC<DiagnosisSelectorProps> = ({
  isOpen,
  onClose,
  selectedDiagnoses,
  onDiagnosesChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  

  const diagnoses = [
    // Cervical Spine
    'Cervical strain/sprain',
    'Cervical radiculopathy',
    'Cervical disc herniation',
    'Cervical facet syndrome',
    'Cervical myelopathy',
    'Whiplash injury',
    'Cervical degenerative disc disease',
    'Cervical stenosis',
    
    // Thoracic Spine
    'Thoracic strain/sprain',
    'Thoracic radiculopathy',
    'Thoracic disc herniation',
    'Thoracic facet syndrome',
    'Thoracic degenerative disc disease',
    'Costovertebral dysfunction',
    'Intercostal neuralgia',
    
    // Lumbar Spine
    'Lumbar strain/sprain',
    'Lumbar radiculopathy',
    'Lumbar disc herniation',
    'Lumbar facet syndrome',
    'Lumbar degenerative disc disease',
    'Lumbar stenosis',
    'Spondylolisthesis',
    'Spondylosis',
    'Sciatica',
    'Lumbar disc bulge',
    'Lumbar disc protrusion',
    'Lumbar disc extrusion',
    
    // Sacral/Coccyx
    'Sacral dysfunction',
    'Coccydynia',
    'Sacral radiculopathy',
    
    // Shoulder
    'Shoulder impingement syndrome',
    'Rotator cuff tear',
    'Rotator cuff tendinitis',
    'Adhesive capsulitis (frozen shoulder)',
    'Shoulder instability',
    'Acromioclavicular joint sprain',
    'Bicipital tendinitis',
    'Labral tear',
    
    // Elbow
    'Lateral epicondylitis (tennis elbow)',
    'Medial epicondylitis (golfer\'s elbow)',
    'Cubital tunnel syndrome',
    'Elbow bursitis',
    'Elbow arthritis',
    
    // Wrist/Hand
    'Carpal tunnel syndrome',
    'De Quervain\'s tenosynovitis',
    'Wrist sprain',
    'Trigger finger',
    'Dupuytren\'s contracture',
    'Wrist arthritis',
    
    // Hip
    'Hip bursitis',
    'Hip arthritis',
    'Hip labral tear',
    'Hip impingement',
    'Piriformis syndrome',
    'Trochanteric bursitis',
    'Iliotibial band syndrome',
    
    // Knee
    'Knee sprain',
    'Meniscal tear',
    'Anterior cruciate ligament tear',
    'Posterior cruciate ligament tear',
    'Medial collateral ligament sprain',
    'Lateral collateral ligament sprain',
    'Patellofemoral pain syndrome',
    'Knee arthritis',
    'Knee bursitis',
    'Patellar tendinitis',
    
    // Ankle/Foot
    'Ankle sprain',
    'Plantar fasciitis',
    'Achilles tendinitis',
    'Achilles tendon rupture',
    'Ankle arthritis',
    'Tarsal tunnel syndrome',
    'Metatarsalgia',
    'Bunion',
    'Hammertoe',
    
    // Neurological
    'Peripheral neuropathy',
    'Complex regional pain syndrome',
    'Fibromyalgia',
    'Myofascial pain syndrome',
    'Chronic pain syndrome',
    'Post-traumatic stress disorder',
    'Depression',
    'Anxiety',
    
    // Other
    'Post-concussion syndrome',
    'Traumatic brain injury',
    'Post-traumatic headache',
    'Dizziness/vertigo',
    'Tinnitus',
    'Sleep disturbance',
    'Fatigue',
    'Memory problems',
    'Concentration difficulties'
  ];

  const filteredDiagnoses = diagnoses.filter(diagnosis =>
    diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDiagnosisToggle = (diagnosis: string) => {
    const updated = selectedDiagnoses.includes(diagnosis)
      ? selectedDiagnoses.filter(d => d !== diagnosis)
      : [...selectedDiagnoses, diagnosis];
    onDiagnosesChange(updated);
  };

  const handleSelectAll = () => {
    onDiagnosesChange([...diagnoses]);
  };

  const handleClearAll = () => {
    onDiagnosesChange([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Diagnosis Selector"
      className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-20 p-6 max-h-[80vh] overflow-y-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Select Diagnoses</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search diagnoses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Select All
        </button>
        <button
          onClick={handleClearAll}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
        {filteredDiagnoses.map((diagnosis) => (
          <label key={diagnosis} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selectedDiagnoses.includes(diagnosis)}
              onChange={() => handleDiagnosisToggle(diagnosis)}
              className="rounded"
            />
            <span className="text-sm">
              {diagnosis}
              <span className="ml-2 text-xs text-gray-500">{icd10Map[diagnosis] || '—'}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-2">
          Selected: {selectedDiagnoses.length} diagnosis(es)
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiagnosisSelector; 