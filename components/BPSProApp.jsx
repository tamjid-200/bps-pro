import React, { useState, useEffect } from 'react';
import { Building, Home, FileText, Zap, Shield, MapPin, Users, Settings, Plus, Upload, Calendar, AlertCircle, CheckCircle, Edit2, Trash2, Download, X, Info, Menu, Wrench, MessageSquare, DoorOpen, Mail, Search, RefreshCw, ChevronDown, GraduationCap } from 'lucide-react';

export default function BPSPro() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeSection, setActiveSection] = useState('all-tasks');
  const [activeSubItem, setActiveSubItem] = useState(null);
  const [activeSubSubItem, setActiveSubSubItem] = useState(null);
  const [activeClaim, setActiveClaim] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  const [blockData, setBlockData] = useState({});
  
  // Mobile menu states
  const [showMainNav, setShowMainNav] = useState(false);
  const [showSubNav, setShowSubNav] = useState(false);
  const [showHelpSection, setShowHelpSection] = useState(false); // For collapsible Help & Support
  const [showTrainingSection, setShowTrainingSection] = useState(false); // For collapsible Training
  const [showModule1, setShowModule1] = useState(false); // For collapsible Module 1
  const [showTrainingModal, setShowTrainingModal] = useState(false); // For training module modal
  const [selectedModule, setSelectedModule] = useState(null); // Selected training module
  const [selectedVideo, setSelectedVideo] = useState(null); // Selected video within module
  
  // Info modal state (for Pres. mode, Feature, Help buttons)
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ title: '', message: '' });
  
  const [newBlockForm, setNewBlockForm] = useState({
    name: '',
    shortName: '',
    address: '',
    height: 'Under 11m'
  });
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    dueDate: '',
    priority: 'Medium',
    category: 'General',
    description: ''
  });
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [setupForm, setSetupForm] = useState({
    frequency: 'Annual',
    lastCompleted: '',
    nextDue: '',
    assignedTo: '',
    autoChase: 'Disabled'
  });
  const [currentSetupKey, setCurrentSetupKey] = useState(null);
  const [rpForm, setRpForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  });
  const [meterReadingForm, setMeterReadingForm] = useState({
    date: '',
    reading: '',
    notes: ''
  });
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    location: ''
  });
  const [settingsTab, setSettingsTab] = useState('assets');
  const [assetSearch, setAssetSearch] = useState('');
  const [hsViewType, setHsViewType] = useState('surveys');
  const [editBlockForm, setEditBlockForm] = useState({
    name: '',
    shortName: '',
    alsoKnownAs: '',
    address: '',
    height: 'Under 11m'
  });
  const [editAgentForm, setEditAgentForm] = useState({
    name: '',
    address: '',
    manager: '',
    email: ''
  });
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    type: 'Maintenance',
    contractor: '',
    cost: '',
    startDate: '',
    completionDate: '',
    status: 'Quote requested',
    location: '',
    notes: ''
  });
  const [unitForm, setUnitForm] = useState({
    type: 'Flat',
    number: '',
    floor: '',
    bedrooms: '',
    residentName: '',
    residentEmail: '',
    residentPhone: '',
    moveInDate: '',
    isOwner: false,
    notes: ''
  });
  const [bulkImportPreview, setBulkImportPreview] = useState([]);
  const [bulkImportError, setBulkImportError] = useState('');
  const [bulkImportFileName, setBulkImportFileName] = useState('');
  const [correspondenceForm, setCorrespondenceForm] = useState({
    type: 'Email',
    direction: 'Outgoing',
    subject: '',
    recipientName: '',
    recipientEmail: '',
    unitNumber: '',
    date: '',
    content: '',
    status: 'Sent',
    notes: ''
  });
  const [correspondenceFilter, setCorrespondenceFilter] = useState('all');
  const [correspondenceSearch, setCorrespondenceSearch] = useState('');
  
  // Custom modal state
  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '' });

  // Helper functions for task counting and status
  const getTotalTasksForBlock = (blockId) => {
    const currentBlockData = blockData[blockId] || { tasks: [] };
    return currentBlockData.tasks?.length || 0;
  };

  const hasOverdueTasks = (blockId) => {
    const currentBlockData = blockData[blockId] || { tasks: [] };
    const tasks = currentBlockData.tasks || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.some(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  };

  // Check if all tasks are completed for a block
  const areAllTasksCompleted = (blockId) => {
    const currentBlockData = blockData[blockId] || { tasks: [] };
    const tasks = currentBlockData.tasks || [];
    
    if (tasks.length === 0) return false; // No tasks = no green checkmark
    
    // All tasks must be completed
    return tasks.every(task => task.completed === true);
  };

  // Get count for each navigation section
  const getNavCount = (sectionId) => {
    if (!selectedBlock || !blockData[selectedBlock]) return 0;
    const currentBlockData = blockData[selectedBlock];
    
    switch(sectionId) {
      case 'documents':
        return (currentBlockData.documents || []).length;
      case 'hs':
        return (currentBlockData.hsItems || []).length;
      case 'insurance':
        return (currentBlockData.insurance || []).length;
      case 'utilities':
        return (currentBlockData.utilities || []).length;
      case 'jobs':
        return (currentBlockData.jobs || []).length;
      case 'issues':
        return (currentBlockData.issues || []).length;
      case 'units':
        return (currentBlockData.units || []).length;
      case 'correspondence':
        return (currentBlockData.correspondence || []).length;
      case 'all-tasks':
        return (currentBlockData.tasks || []).length;
      default:
        return 0;
    }
  };

  // Check if section has no overdue/incomplete items (show green checkmark)
  const isNavComplete = (sectionId) => {
    if (!selectedBlock || !blockData[selectedBlock]) return true;
    const count = getNavCount(sectionId);
    return count === 0;
  };

  // Main navigation
  const mainNav = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'all-tasks', name: 'All tasks', icon: Menu },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'hs', name: 'H&S', icon: Shield },
    { id: 'insurance', name: 'Insurance', icon: AlertCircle },
    { id: 'utilities', name: 'Utilities', icon: Zap },
    { id: 'jobs', name: 'Jobs/projects', icon: Wrench },
    { id: 'issues', name: 'Issues/complaints', icon: MessageSquare },
    { id: 'portal', name: 'Portal', icon: DoorOpen }
  ];

  const residentNav = [
    { id: 'units', name: 'Units', icon: Building },
    { id: 'correspondence', name: 'Correspondence', icon: Mail }
  ];

  const blockInfoNav = [
    { id: 'block-info', name: 'Block info', icon: Info },
    { id: 'oms', name: 'O&Ms', icon: FileText }
  ];

  const settingsNav = [
    { id: 'block-settings', name: 'Block settings', icon: Settings }
  ];

  // H&S items with complete sub-structure
  const hsItems = [
    { 
      id: 'asbestos', 
      name: 'Asbestos survey',
      subItems: [
        { id: 'survey', name: 'Survey' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'combined-fire', 
      name: 'Combined fire/general',
      subItems: [
        { id: 'survey', name: 'Survey' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'dry-riser', 
      name: 'Dry riser(s)',
      subItems: [
        { id: 'annual-test', name: 'Annual pressure test' },
        { id: 'monthly-inspections', name: '6-monthly inspections' },
        { id: 'callouts', name: 'Callouts' }
      ]
    },
    { 
      id: 'eicr', 
      name: 'EICR (communal)',
      subItems: [
        { id: 'inspection', name: 'Inspection' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'fire-alarm', 
      name: 'Fire alarm',
      subItems: [
        { id: 'weekly-test', name: 'Weekly test' },
        { id: 'annual-service', name: 'Annual service' }
      ]
    },
    { 
      id: 'fire-risk', 
      name: 'Fire risk assessment',
      subItems: [
        { id: 'assessment', name: 'Assessment' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'general-hs', 
      name: 'General H&S assessment',
      subItems: [
        { id: 'assessment', name: 'Assessment' },
        { id: 'remedials', name: 'Remedials' }
      ]
    }
  ];

  // Utilities
  const utilityItems = [
    { id: 'electricity-comm', name: 'Electricity (comm)', fullName: 'Electricity (communal) meter read' },
    { id: 'water-comm', name: 'Water (comm)', fullName: 'Water (communal) meter read' },
    { id: 'gas-comm', name: 'Gas (comm)', fullName: 'Gas (communal) meter read' }
  ];

  // Insurance categories
  const insuranceCategories = {
    policy: [
      { id: 'building', name: 'Building insurance' },
      { id: 'terrorism-1', name: 'Terrorism insurance' }
    ],
    other: [
      { id: 'reinstatement', name: 'Reinstatement cost assessment' }
    ],
    claims: []
  };

  // Insurance claim workflow
  const claimWorkflow = [
    { id: 'notify', name: 'Notify insurer/ broker', badge: 1 },
    { id: 'identify', name: 'Identify source', badge: 1 },
    { id: 'fix', name: 'Fix source', badge: 1 },
    { id: 'compile', name: 'Compile quotes', badge: 1 },
    { id: 'send', name: 'Send quotes to insurer', badge: 1 },
    { id: 'approved', name: 'Quotes approved', badge: 1 },
    { id: 'instructed', name: 'Remedials instructed', badge: 1 },
    { id: 'complete', name: 'Remedials complete', badge: 1 },
    { id: 'received', name: 'Invoice(s) received', badge: 1 },
    { id: 'submitted', name: 'Invoice(s) submitted', badge: 1 },
    { id: 'funds', name: 'Funds received', badge: 1 },
    { id: 'settled', name: 'Invoice(s) settled', badge: 1 }
  ];

  // Documents categories
  const documentCategories = [
    {
      section: 'Fire Safety (England) Regulations 2022',
      items: [
        { id: 'fire-doors', name: 'Fire doors (annual advice)' },
        { id: 'fire-instructions', name: 'Fire safety instructions' }
      ]
    }
  ];

  // Block settings assets
  const blockAssets = [
    { id: 'aov', name: 'AOV(s)', active: false },
    { id: 'asbestos', name: 'Asbestos survey', active: true },
    { id: 'bin-chute', name: 'Bin chute', active: false },
    { id: 'building-condition', name: 'Building condition survey', active: false },
    { id: 'car-park', name: 'Car park ventilation system', active: false },
    { id: 'combined-risk', name: 'Risk assessment (combined fire/general H&S)', active: true },
    { id: 'compartmentation', name: 'Compartmentation survey', active: false },
    { id: 'disabled-refuge', name: 'Disabled refuge system', active: false },
    { id: 'dry-riser', name: 'Dry riser(s)', active: true },
    { id: 'dsear', name: 'DSEAR Risk Assessment', active: false },
    { id: 'edge-protection', name: 'Edge protection', active: false },
    { id: 'eicr', name: 'EICR (communal)', active: true },
    { id: 'emergency-lighting', name: 'Emergency lighting', active: false },
    { id: 'fire-alarm', name: 'Fire alarm', active: true },
    { id: 'fire-doors', name: 'Fire doors', active: false },
    { id: 'fire-extinguishers', name: 'Fire extinguishers', active: false },
    { id: 'fire-risk', name: 'Fire risk assessment', active: true },
    { id: 'general-hs', name: 'General H&S assessment', active: true }
  ];

  // Issues/Complaints
  const issuesItems = [];

  useEffect(() => {
    async function loadData() {
      try {
        const blocksResult = await window.storage.get('bps_pro_blocks');
        
        if (blocksResult) {
          const loadedBlocks = JSON.parse(blocksResult.value);
          setBlocks(loadedBlocks);
          setShowAllBlocks(true);
          setActiveSection('home');
          
          const dataResult = await window.storage.get('bps_pro_block_data');
          if (dataResult) {
            setBlockData(JSON.parse(dataResult.value));
          } else {
            const initialData = {};
            loadedBlocks.forEach(block => {
              initialData[block.id] = {
                tasks: [],
                documents: [],
                hsItems: [],
                utilities: [],
                insurance: [],
                issues: []
              };
            });
            setBlockData(initialData);
            await window.storage.set('bps_pro_block_data', JSON.stringify(initialData));
          }
        } else {
          const sampleBlocks = [
            { 
              id: '1', 
              name: 'Jack Hardy Close - Castledine Court (Demo Block)',
              shortName: 'Jack Hardy Clo',
              address: 'Demo Street, DEM 01',
              height: 'Under 11m',
              evacuationStrategy: 'stay-put',
              managingAgent: {
                name: 'Block Property Solutions',
                address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                manager: 'Keanu Billones',
                email: 'keanu@blockpropertysolutions.co.uk'
              }
            },
            { 
              id: '2', 
              name: 'Riverside Apartments - Building A',
              shortName: 'Riverside Apt',
              address: '123 River Road, London, SW1A 1AA',
              height: '11m - 18m',
              evacuationStrategy: 'stay-put',
              managingAgent: {
                name: 'Block Property Solutions',
                address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                manager: 'Keanu Billones',
                email: 'keanu@blockpropertysolutions.co.uk'
              }
            },
            { 
              id: '3', 
              name: 'Oak Tree Gardens - Phase 1',
              shortName: 'Oak Tree Gdn',
              address: '45 Oak Street, Manchester, M1 1AA',
              height: 'Under 11m',
              evacuationStrategy: 'simultaneous',
              managingAgent: {
                name: 'Block Property Solutions',
                address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                manager: 'Keanu Billones',
                email: 'keanu@blockpropertysolutions.co.uk'
              }
            }
          ];
          setBlocks(sampleBlocks);
          setShowAllBlocks(true);
          setActiveSection('home');
          
          const initialData = {};
          sampleBlocks.forEach(block => {
            initialData[block.id] = {
              tasks: [],
              documents: [],
              hsItems: [],
              utilities: [],
              insurance: [],
              issues: []
            };
          });
          setBlockData(initialData);
          
          await window.storage.set('bps_pro_blocks', JSON.stringify(sampleBlocks));
          await window.storage.set('bps_pro_block_data', JSON.stringify(initialData));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMainNav) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showMainNav]);

  const renderSubNav = () => {
    if (activeSection === 'hs') return hsItems;
    if (activeSection === 'utilities') return utilityItems;
    if (activeSection === 'documents') return documentCategories[0].items;
    if (activeSection === 'issues') return issuesItems;
    
    if (activeSection === 'insurance') {
      const items = [];
      insuranceCategories.policy.forEach(i => items.push({ ...i, category: 'Policy documents' }));
      insuranceCategories.other.forEach(i => items.push({ ...i, category: 'Other' }));
      insuranceCategories.claims.forEach(i => items.push({ ...i, category: 'Claims' }));
      return items;
    }
    return [];
  };

  const renderContent = () => {
    const currentBlock = blocks.find(b => b.id === selectedBlock);

    // HOME - ALL BLOCKS VIEW
    if (activeSection === 'home' || showAllBlocks) {
      return (
        <div className="p-4 md:p-8">
          <div className="max-w-6xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h2 className="text-xl md:text-2xl font-bold">All blocks</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={async () => {
                    if (confirm('Clear all blocks and start fresh? This cannot be undone.')) {
                      setBlocks([]);
                      setBlockData({});
                      await window.storage.set('bps_pro_blocks', JSON.stringify([]));
                      await window.storage.set('bps_pro_block_data', JSON.stringify({}));
                    }
                  }}
                  className="border border-red-500 text-red-500 px-4 py-2.5 rounded-lg hover:bg-red-50 text-sm font-medium w-full sm:w-auto"
                >
                  Clear all blocks
                </button>
                <button 
                  onClick={() => {
                    setModalType('add-block');
                    setShowModal(true);
                  }}
                  className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add new block
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {blocks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg mb-2">No blocks yet</p>
                  <p className="text-sm">Click "Add new block" to get started</p>
                </div>
              ) : (
                blocks.map(block => {
                const currentBlockData = blockData[block.id] || { tasks: [] };
                const taskCount = currentBlockData.tasks?.length || 0;
                
                return (
                  <div
                    key={block.id}
                    className="bg-white border-2 border-slate-200 rounded-lg p-4 md:p-6 hover:bps-blue-border hover:shadow-lg transition-all relative"
                  >
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${block.name}?`)) {
                          const updatedBlocks = blocks.filter(b => b.id !== block.id);
                          setBlocks(updatedBlocks);
                          
                          const updatedBlockData = { ...blockData };
                          delete updatedBlockData[block.id];
                          setBlockData(updatedBlockData);
                          
                          await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                          await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                        }
                      }}
                      className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedBlock(block.id);
                        setShowAllBlocks(false);
                        setActiveSection('all-tasks');
                        setActiveSubItem(null);
                        setActiveSubSubItem(null);
                        setActiveClaim(null);
                        setActiveTab('home');
                      }}
                      className="w-full text-left"
                    >
                    <div className="flex items-start gap-3 md:gap-4 mb-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bps-blue-bg-circle rounded-full flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base md:text-lg mb-1 truncate">{block.shortName || block.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{block.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                      {/* Small badge: green checkmark if all done, red count if incomplete */}
                      {taskCount > 0 && (
                        areAllTasksCompleted(block.id) ? (
                          <div className="flex-shrink-0 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                            {taskCount}
                          </div>
                        )
                      )}
                    </div>
                    </button>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      );
    }

    // ALL TASKS
    if (activeSection === 'all-tasks') {
      const currentBlockData = blockData[selectedBlock] || { tasks: [], setups: {} };
      const allTasks = currentBlockData.tasks || [];
      const today = new Date().toISOString().split('T')[0];
      
      const upcomingTasks = allTasks.filter(t => 
        !t.completed && 
        t.dueDate && 
        t.dueDate >= today &&
        t.priority !== 'High'
      );
      
      const overdueOrHighPriorityTasks = allTasks.filter(t => 
        !t.completed && 
        ((t.dueDate && t.dueDate < today) || t.priority === 'High')
      );
      
      const setups = currentBlockData.setups || {};
      const allSetupKeys = [];
      
      hsItems.forEach(item => {
        if (item.subItems) {
          item.subItems.forEach(sub => {
            allSetupKeys.push(`hs-${item.id}-${sub.id}`);
          });
        }
      });
      utilityItems.forEach(item => {
        allSetupKeys.push(`utilities-${item.id}`);
      });
      [...insuranceCategories.policy, ...insuranceCategories.other].forEach(item => {
        allSetupKeys.push(`insurance-${item.id}`);
      });
      documentCategories[0].items.forEach(item => {
        allSetupKeys.push(`documents-${item.id}`);
      });
      
      const setupRequiredCount = allSetupKeys.filter(key => !setups[key]?.completed).length;
      
      const getSetupItemName = (key) => {
        const parts = key.split('-');
        const section = parts[0];
        const itemId = parts.slice(1).join('-');
        let itemName = '';
        let sectionName = '';
        
        if (section === 'hs') {
          sectionName = 'H&S';
          const parentItem = hsItems.find(h => itemId.startsWith(h.id + '-'));
          if (parentItem) {
            const subItemId = itemId.substring(parentItem.id.length + 1);
            const sub = parentItem.subItems?.find(s => s.id === subItemId);
            itemName = `${parentItem.name} → ${sub?.name || subItemId}`;
          }
        } else if (section === 'utilities') {
          sectionName = 'Utilities';
          const item = utilityItems.find(u => u.id === itemId);
          itemName = item?.fullName || itemId;
        } else if (section === 'insurance') {
          sectionName = 'Insurance';
          const allInsurance = [...insuranceCategories.policy, ...insuranceCategories.other];
          const item = allInsurance.find(i => i.id === itemId);
          itemName = item?.name || itemId;
        } else if (section === 'documents') {
          sectionName = 'Documents';
          const item = documentCategories[0].items.find(d => d.id === itemId);
          itemName = item?.name || itemId;
        }
        return { itemName, sectionName, section, itemId };
      };
      
      const overdueSetups = Object.entries(setups)
        .filter(([key, setup]) => setup.completed && setup.nextDue && setup.nextDue < today)
        .map(([key, setup]) => {
          const { itemName, sectionName, section, itemId } = getSetupItemName(key);
          return {
            id: `setup-${key}`,
            key,
            section,
            itemId,
            title: itemName,
            sectionName,
            dueDate: setup.nextDue,
            isOverdueSetup: true
          };
        });
      
      const allOverdueItems = [
        ...overdueOrHighPriorityTasks,
        ...overdueSetups
      ];
      
      let filteredTasks = allTasks;
      if (taskFilter === 'upcoming') {
        filteredTasks = upcomingTasks;
      } else if (taskFilter === 'overdue') {
        filteredTasks = allOverdueItems;
      } else if (taskFilter === 'setup') {
        filteredTasks = [];
      }
      
      if (taskSearch) {
        filteredTasks = filteredTasks.filter(t => 
          t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase())) ||
          (t.category && t.category.toLowerCase().includes(taskSearch.toLowerCase()))
        );
      }

      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold">All tasks</h2>
            <button 
              onClick={() => {
                setModalType('add-task');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New task
            </button>
          </div>
          
          <div className="flex gap-3 md:gap-6 mb-4 md:mb-6 border-b overflow-x-auto pb-0">
            <button 
              onClick={() => setTaskFilter('all')}
              className={`pb-3 px-1 text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'all' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setTaskFilter('upcoming')}
              className={`pb-3 px-1 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'upcoming' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              Upcoming
              {upcomingTasks.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {upcomingTasks.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setTaskFilter('overdue')}
              className={`pb-3 px-1 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'overdue' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              Overdue
              {allOverdueItems.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {allOverdueItems.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setTaskFilter('setup')}
              className={`pb-3 px-1 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'setup' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              Set-up
              {setupRequiredCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {setupRequiredCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="mb-4 md:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                type="text" 
                placeholder="Search" 
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm" 
              />
            </div>
          </div>
          
          {taskFilter === 'setup' ? (
            setupRequiredCount === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                <p className="font-medium">All items are set up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">The following items require setup:</p>
                {allSetupKeys.filter(key => !setups[key]?.completed).map(key => {
                  const parts = key.split('-');
                  const section = parts[0];
                  const itemId = parts.slice(1).join('-');
                  
                  let itemName = '';
                  let sectionName = '';
                  
                  if (section === 'hs') {
                    sectionName = 'H&S';
                    const subParts = itemId.split('-');
                    const parentItem = hsItems.find(h => itemId.startsWith(h.id + '-'));
                    if (parentItem) {
                      const subItemId = itemId.substring(parentItem.id.length + 1);
                      const sub = parentItem.subItems?.find(s => s.id === subItemId);
                      itemName = `${parentItem.name} → ${sub?.name || subItemId}`;
                    }
                  } else if (section === 'utilities') {
                    sectionName = 'Utilities';
                    const item = utilityItems.find(u => u.id === itemId);
                    itemName = item?.fullName || itemId;
                  } else if (section === 'insurance') {
                    sectionName = 'Insurance';
                    const allInsurance = [...insuranceCategories.policy, ...insuranceCategories.other];
                    const item = allInsurance.find(i => i.id === itemId);
                    itemName = item?.name || itemId;
                  } else if (section === 'documents') {
                    sectionName = 'Documents';
                    const item = documentCategories[0].items.find(d => d.id === itemId);
                    itemName = item?.name || itemId;
                  }
                  
                  if (taskSearch && !itemName.toLowerCase().includes(taskSearch.toLowerCase())) {
                    return null;
                  }
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (section === 'hs') {
                          const parentItem = hsItems.find(h => itemId.startsWith(h.id + '-'));
                          if (parentItem) {
                            setActiveSection('hs');
                            setActiveSubItem(parentItem);
                            const subItemId = itemId.substring(parentItem.id.length + 1);
                            const sub = parentItem.subItems?.find(s => s.id === subItemId);
                            if (sub) setActiveSubSubItem(sub);
                          }
                        } else if (section === 'utilities') {
                          const item = utilityItems.find(u => u.id === itemId);
                          if (item) {
                            setActiveSection('utilities');
                            setActiveSubItem(item);
                          }
                        } else if (section === 'insurance') {
                          const allInsurance = [
                            ...insuranceCategories.policy.map(i => ({...i, category: 'Policy documents'})),
                            ...insuranceCategories.other.map(i => ({...i, category: 'Other'}))
                          ];
                          const item = allInsurance.find(i => i.id === itemId);
                          if (item) {
                            setActiveSection('insurance');
                            setActiveSubItem(item);
                          }
                        } else if (section === 'documents') {
                          const item = documentCategories[0].items.find(d => d.id === itemId);
                          if (item) {
                            setActiveSection('documents');
                            setActiveSubItem(item);
                          }
                        }
                        setActiveTab('home');
                      }}
                      className="bg-white border rounded-lg p-4 flex items-center justify-between w-full text-left hover:bps-blue-border hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium group-hover:bps-blue-text truncate">{itemName}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{sectionName}</span>
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">Set-up required</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bps-blue-text text-sm font-medium ml-4 flex-shrink-0">
                        <span className="hidden sm:inline">Set up</span>
                        <span className="text-lg">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">⏳</div>
              <div>{taskSearch ? 'No tasks match your search' : 'None'}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => {
                if (task.isOverdueSetup) {
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        if (task.section === 'hs') {
                          const parentItem = hsItems.find(h => task.itemId.startsWith(h.id + '-'));
                          if (parentItem) {
                            setActiveSection('hs');
                            setActiveSubItem(parentItem);
                            const subItemId = task.itemId.substring(parentItem.id.length + 1);
                            const sub = parentItem.subItems?.find(s => s.id === subItemId);
                            if (sub) setActiveSubSubItem(sub);
                          }
                        } else if (task.section === 'utilities') {
                          const item = utilityItems.find(u => u.id === task.itemId);
                          if (item) {
                            setActiveSection('utilities');
                            setActiveSubItem(item);
                          }
                        } else if (task.section === 'insurance') {
                          const allInsurance = [
                            ...insuranceCategories.policy.map(i => ({...i, category: 'Policy documents'})),
                            ...insuranceCategories.other.map(i => ({...i, category: 'Other'}))
                          ];
                          const item = allInsurance.find(i => i.id === task.itemId);
                          if (item) {
                            setActiveSection('insurance');
                            setActiveSubItem(item);
                          }
                        } else if (task.section === 'documents') {
                          const item = documentCategories[0].items.find(d => d.id === task.itemId);
                          if (item) {
                            setActiveSection('documents');
                            setActiveSubItem(item);
                          }
                        }
                        setActiveTab('home');
                      }}
                      className="bg-white border-2 border-red-200 rounded-lg p-4 flex items-center justify-between w-full text-left hover:bps-blue-border hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-700 group-hover:text-blue-600 truncate">⚠️ {task.title}</div>
                        <div className="flex items-center gap-2 md:gap-3 mt-2 text-xs flex-wrap">
                          <span className="flex items-center gap-1 text-red-500 whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {task.sectionName}
                          </span>
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Overdue
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bps-blue-text text-sm font-medium ml-4 flex-shrink-0">
                        <span className="hidden sm:inline">Review</span>
                        <span className="text-lg">→</span>
                      </div>
                    </button>
                  );
                }
                
                const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
                return (
                  <div 
                    key={task.id} 
                    className={`bg-white border rounded-lg p-4 flex items-start gap-3 md:gap-4 ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={task.completed || false}
                      onChange={async () => {
                        const updatedTasks = allTasks.map(t => 
                          t.id === task.id ? { ...t, completed: !t.completed } : t
                        );
                        const updatedBlockData = {
                          ...blockData,
                          [selectedBlock]: {
                            ...currentBlockData,
                            tasks: updatedTasks
                          }
                        };
                        setBlockData(updatedBlockData);
                        await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                      }}
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${task.completed ? 'line-through' : ''} break-words`}>{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-slate-600 mt-1 break-words">{task.description}</div>
                      )}
                      <div className="flex items-center gap-2 md:gap-3 mt-2 text-xs flex-wrap">
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 whitespace-nowrap ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this task?')) {
                          const updatedTasks = allTasks.filter(t => t.id !== task.id);
                          const updatedBlockData = {
                            ...blockData,
                            [selectedBlock]: {
                              ...currentBlockData,
                              tasks: updatedTasks
                            }
                          };
                          setBlockData(updatedBlockData);
                          await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                        }
                      }}
                      className="text-red-500 hover:bg-red-50 p-2 rounded flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // BLOCK INFO - COMPLETE
    if (activeSection === 'block-info') {
      return (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="w-20 h-20 md:w-32 md:h-32 bps-blue-bg-circle rounded-full flex items-center justify-center flex-shrink-0">
                <Building className="w-10 h-10 md:w-16 md:h-16 text-white" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl md:text-2xl font-bold break-words">{currentBlock?.shortName || currentBlock?.name}</h2>
                      {/* Task count badge */}
                      {(() => {
                        const totalTasks = getTotalTasksForBlock(selectedBlock);
                        if (totalTasks > 0) {
                          return (
                            <div className="flex-shrink-0 bg-red-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold">
                              {totalTasks}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-sm md:text-base text-slate-600 mb-3">Also known as {currentBlock?.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditBlockForm({
                        name: currentBlock?.name || '',
                        shortName: currentBlock?.shortName || '',
                        alsoKnownAs: currentBlock?.name || '',
                        address: currentBlock?.address || '',
                        height: currentBlock?.height || 'Under 11m'
                      });
                      setModalType('edit-block');
                      setShowModal(true);
                    }}
                    className="bps-blue-text text-sm hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Address:</span> {currentBlock?.address}</p>
                <p className="text-sm text-slate-600"><span className="font-medium">Height category:</span> {currentBlock?.height}</p>
              </div>
            </div>

            <div className="border-2 border-red-300 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="font-bold mb-4 text-base md:text-lg">Evacuation strategy:</h3>
              <div className="space-y-3 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="evac" 
                    value="simultaneous" 
                    checked={(blockData[selectedBlock]?.evacuationStrategy || currentBlock?.evacuationStrategy) === 'simultaneous'}
                    onChange={async () => {
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          evacuationStrategy: 'simultaneous'
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    }}
                    className="mt-1 flex-shrink-0" 
                  />
                  <span className="text-sm md:text-base">Simultaneous</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="evac" 
                    value="stay-put" 
                    checked={(blockData[selectedBlock]?.evacuationStrategy || currentBlock?.evacuationStrategy) === 'stay-put'}
                    onChange={async () => {
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          evacuationStrategy: 'stay-put'
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    }}
                    className="mt-1 flex-shrink-0" 
                  />
                  <div>
                    <div className="font-medium text-sm md:text-base">Stay put</div>
                    <div className="text-xs md:text-sm text-slate-600 mt-1">
                      (Also called defend in place) Residents in flats not directly affected by the fire remain in their own homes
                      unless instructed otherwise by the fire and rescue service (FRS) or they feel unsafe.
                      <br /><br />
                      Only the occupants of the flat where the fire started (or anyone in the common parts) evacuate
                      immediately, close doors behind them, and call 999.
                      <br /><br />
                      Residents in other flats are expected to stay put, close doors and windows, and wait for FRS advice.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="evac" 
                    value="phased"
                    checked={(blockData[selectedBlock]?.evacuationStrategy || currentBlock?.evacuationStrategy) === 'phased'}
                    onChange={async () => {
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          evacuationStrategy: 'phased'
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    }}
                    className="mt-1 flex-shrink-0" 
                  />
                  <span className="text-sm md:text-base">Phased</span>
                </label>
              </div>
              <button 
                onClick={() => alert('Evacuation strategy saved successfully!')}
                className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
              >
                Set evacuation strategy
              </button>
            </div>

            <div className="border-2 border-red-300 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="font-bold mb-4 text-base md:text-lg">Responsible Person (RP)</h3>
              {(blockData[selectedBlock]?.responsiblePersons || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {(blockData[selectedBlock]?.responsiblePersons || []).map((rp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm md:text-base truncate">{rp.name}</div>
                        <div className="text-xs text-slate-600">{rp.role}</div>
                        <div className="text-xs text-slate-500 break-words">{rp.email} • {rp.phone}</div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (confirm(`Remove ${rp.name}?`)) {
                            const updatedRPs = (blockData[selectedBlock]?.responsiblePersons || []).filter((_, i) => i !== idx);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                responsiblePersons: updatedRPs
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => {
                  setModalType('add-rp');
                  setShowModal(true);
                }}
                className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
              >
                Add
              </button>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h3 className="font-bold text-base md:text-lg">Managing agent</h3>
                <button
                  onClick={() => {
                    setEditAgentForm({
                      name: currentBlock?.managingAgent?.name || '',
                      address: currentBlock?.managingAgent?.address || '',
                      manager: currentBlock?.managingAgent?.manager || '',
                      email: currentBlock?.managingAgent?.email || ''
                    });
                    setModalType('edit-agent');
                    setShowModal(true);
                  }}
                  className="bps-blue-text text-sm hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
              <p className="text-sm mb-1 break-words"><span className="font-medium">Managing agent:</span> {currentBlock?.managingAgent?.name}</p>
              <p className="text-sm mb-1 break-words"><span className="font-medium">Address:</span> {currentBlock?.managingAgent?.address}</p>
              <p className="text-sm mb-1 break-words"><span className="font-medium">Property manager:</span> {currentBlock?.managingAgent?.manager}</p>
              <p className="text-sm break-words"><span className="font-medium">Email:</span> {currentBlock?.managingAgent?.email}</p>
            </div>
          </div>
        </div>
      );
    }

    // BLOCK SETTINGS - COMPLETE
    if (activeSection === 'block-settings') {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Settings</h2>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-64">
              <p className="text-xs uppercase mb-3">Select</p>
              <button 
                onClick={() => setSettingsTab('assets')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'assets' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Add/ remove assets
              </button>
              <button 
                onClick={() => setSettingsTab('auto-chase')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'auto-chase' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Contractor auto-chase
              </button>
              <button 
                onClick={() => setSettingsTab('resident')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'resident' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Resident settings
              </button>
              <button 
                onClick={() => setSettingsTab('site-staff')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'site-staff' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Site staff
              </button>
            </div>
            <div className="flex-1">
              {settingsTab === 'assets' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold mb-4">Add/ remove assets</h3>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        type="text" 
                        placeholder="Search" 
                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm" 
                      />
                    </div>
                  </div>
                  <h4 className="font-medium mb-3 text-sm md:text-base">Service and maintenance (H&S items)</h4>
                  <div className="space-y-2">
                    {blockAssets
                      .filter(asset => asset.name.toLowerCase().includes(assetSearch.toLowerCase()))
                      .map(asset => {
                        const blockAssetState = blockData[selectedBlock]?.assets?.[asset.id];
                        const isActive = blockAssetState !== undefined ? blockAssetState : asset.active;
                        return (
                          <div key={asset.id} className="flex items-center justify-between py-2 border-b gap-3">
                            <span className="text-sm flex-1 min-w-0 break-words">{asset.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <button 
                                    onClick={async () => {
                                      const updatedBlockData = {
                                        ...blockData,
                                        [selectedBlock]: {
                                          ...(blockData[selectedBlock] || {}),
                                          assets: {
                                            ...(blockData[selectedBlock]?.assets || {}),
                                            [asset.id]: false
                                          }
                                        }
                                      };
                                      setBlockData(updatedBlockData);
                                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                                    }}
                                    className="text-red-500 text-xs hover:underline whitespace-nowrap"
                                  >
                                    Deactivate
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={async () => {
                                      const updatedBlockData = {
                                        ...blockData,
                                        [selectedBlock]: {
                                          ...(blockData[selectedBlock] || {}),
                                          assets: {
                                            ...(blockData[selectedBlock]?.assets || {}),
                                            [asset.id]: true
                                          }
                                        }
                                      };
                                      setBlockData(updatedBlockData);
                                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                                    }}
                                    className="bps-blue-text text-sm hover:underline whitespace-nowrap"
                                  >
                                    + Activate
                                  </button>
                                  <span className="text-slate-400 text-sm">or</span>
                                  <span className="text-slate-400 text-sm">n/a</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
              
              {settingsTab === 'auto-chase' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold mb-4">Contractor auto-chase</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Automated email chasers sent to the contractor/ supplier for upcoming or overdue actions.
                  </p>
                  <div className="text-slate-500">No contractors configured yet</div>
                </>
              )}
              
              {settingsTab === 'resident' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold mb-4">Resident settings</h3>
                  <p className="text-sm text-slate-600 mb-4">Configure resident communication preferences.</p>
                  <div className="text-slate-500">Coming soon</div>
                </>
              )}
              
              {settingsTab === 'site-staff' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold mb-4">Site staff</h3>
                  <p className="text-sm text-slate-600 mb-4">Manage site staff members.</p>
                  <button 
                    onClick={() => alert('Add site staff coming soon!')}
                    className="bps-blue px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add staff member
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ISSUES/COMPLAINTS - COMPLETE
    if (activeSection === 'issues') {
      const issues = blockData[selectedBlock]?.issues || [];
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold">Reported issues/complaints</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => alert('Recipient settings: Configure who receives issue notifications')}
                className="bps-blue-text text-sm hover:underline"
              >
                Recipient settings
              </button>
              <button 
                onClick={() => {
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                  setModalType('add-issue');
                  setShowModal(true);
                }}
                className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                New issue or complaint
              </button>
            </div>
          </div>
          {issues.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No issues reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className={`bg-white border rounded-lg p-4 ${issue.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-medium ${issue.resolved ? 'line-through' : ''} break-words`}>{issue.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          issue.priority === 'High' ? 'bg-red-100 text-red-700' :
                          issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {issue.priority}
                        </span>
                      </div>
                      {issue.location && <div className="text-xs text-slate-600 mb-2">📍 {issue.location}</div>}
                      <p className="text-sm text-slate-600 break-words">{issue.description}</p>
                      <div className="text-xs text-slate-400 mt-2">Reported: {new Date(issue.createdAt).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          const updatedIssues = issues.map(i => 
                            i.id === issue.id ? { ...i, resolved: !i.resolved } : i
                          );
                          const updatedBlockData = {
                            ...blockData,
                            [selectedBlock]: {
                              ...(blockData[selectedBlock] || {}),
                              issues: updatedIssues
                            }
                          };
                          setBlockData(updatedBlockData);
                          await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                        }}
                        className={`p-2 rounded ${issue.resolved ? 'text-slate-400' : 'text-green-500 hover:bg-green-50'}`}
                        title={issue.resolved ? 'Reopen' : 'Mark resolved'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this issue?')) {
                            const updatedIssues = issues.filter(i => i.id !== issue.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                issues: updatedIssues
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // H&S, UTILITIES, INSURANCE, DOCUMENTS WITH ITEMS - COMPLETE WITH ALL TABS
    if ((activeSection === 'hs' || activeSection === 'utilities' || activeSection === 'insurance' || activeSection === 'documents') && activeSubItem) {
      const hasTabs = activeSection !== 'insurance';
      const tabs = hasTabs ? ['Home', 'O&Ms', 'Asset register', 'Notes', 'Settings'] : ['Home', 'Settings'];

      return (
        <div className="p-4 md:p-8">
          {/* Tabs */}
          <div className="mb-6 flex gap-3 md:gap-6 border-b overflow-x-auto pb-0">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'))}
                className={`pb-3 text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and')
                    ? 'border-b-2 border-slate-900 font-medium'
                    : 'text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div>
              {/* H&S Section */}
              {activeSection === 'hs' && activeSubItem.subItems && !activeSubSubItem && (
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-6">{activeSubItem.name}</h2>
                  <div className="space-y-2">
                    {activeSubItem.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveSubSubItem(subItem)}
                        className="flex items-center justify-between w-full px-4 py-3 bg-white rounded border hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{subItem.name}</span>
                        </div>
                        {subItem.complete && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* H&S Sub-sub-item (actual setup page) */}
              {activeSection === 'hs' && activeSubSubItem && (() => {
                const setupKey = `hs-${activeSubItem.id}-${activeSubSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex gap-2 md:gap-4 mb-6 flex-wrap">
                    <button 
                      onClick={() => setHsViewType('surveys')}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded text-xs md:text-sm font-medium ${
                        hsViewType === 'surveys' ? 'bg-slate-900 text-white' : 'border'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Surveys
                      {!isSetUp && <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs ml-1 text-white">1</span>}
                      {isSetUp && <CheckCircle className="w-4 h-4 text-green-500 ml-1" />}
                    </button>
                    <button 
                      onClick={() => setHsViewType('remedials')}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded text-xs md:text-sm ${
                        hsViewType === 'remedials' ? 'bg-slate-900 text-white' : 'border'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Remedials
                      <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold">{activeSubSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Assigned to:</span> {isSetUp ? <span className="text-slate-700">{setup.assignedTo || 'Unassigned'}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Auto-chase:</span>
                      {isSetUp ? <span className="text-slate-700">{setup.autoChase}</span> : <span className="text-slate-500">[set-up required]</span>}
                      <Info className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-4 md:p-6'} inline-block`}>
                    <button 
                      onClick={() => {
                        setCurrentSetupKey(setupKey);
                        if (isSetUp) {
                          setSetupForm({
                            frequency: setup.frequency,
                            lastCompleted: setup.lastCompleted || '',
                            nextDue: setup.nextDue,
                            assignedTo: setup.assignedTo || '',
                            autoChase: setup.autoChase
                          });
                        } else {
                          setSetupForm({
                            frequency: 'Annual',
                            lastCompleted: '',
                            nextDue: '',
                            assignedTo: '',
                            autoChase: 'Disabled'
                          });
                        }
                        setModalType('setup');
                        setShowModal(true);
                      }}
                      className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>
                </div>
                );
              })()}

              {/* UTILITIES */}
              {activeSection === 'utilities' && (() => {
                const setupKey = `utilities-${activeSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                      {activeSubItem.name}
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </h2>
                  </div>

                  <h3 className="text-base md:text-lg mb-4 md:mb-6">{activeSubItem.fullName}</h3>
                  {isSetUp ? (
                    <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium inline-block mb-4 md:mb-6">Set up</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium inline-block mb-4 md:mb-6">Set-up required</span>
                  )}

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Assigned to:</span> {isSetUp ? <span className="text-slate-700">{setup.assignedTo || 'Unassigned'}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Auto-chase:</span>
                      {isSetUp ? <span className="text-slate-700">{setup.autoChase}</span> : <span className="text-slate-500">[set-up required]</span>}
                      <Info className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-4 md:p-6'} inline-block mb-6 md:mb-8`}>
                    <button 
                      onClick={() => {
                        setCurrentSetupKey(setupKey);
                        if (isSetUp) {
                          setSetupForm({
                            frequency: setup.frequency,
                            lastCompleted: setup.lastCompleted || '',
                            nextDue: setup.nextDue,
                            assignedTo: setup.assignedTo || '',
                            autoChase: setup.autoChase
                          });
                        } else {
                          setSetupForm({
                            frequency: 'Annual',
                            lastCompleted: '',
                            nextDue: '',
                            assignedTo: '',
                            autoChase: 'Disabled'
                          });
                        }
                        setModalType('setup');
                        setShowModal(true);
                      }}
                      className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>

                  <div className="border-t pt-4 md:pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <h3 className="text-base md:text-lg font-semibold">Meter readings</h3>
                      <button 
                        onClick={() => {
                          setCurrentSetupKey(`meter-${activeSubItem.id}`);
                          setMeterReadingForm({ date: '', reading: '', notes: '' });
                          setModalType('add-meter');
                          setShowModal(true);
                        }}
                        className="bps-blue px-4 py-2 md:py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    {(() => {
                      const meterKey = `meter-${activeSubItem.id}`;
                      const readings = blockData[selectedBlock]?.meterReadings?.[meterKey] || [];
                      if (readings.length === 0) return <div className="text-slate-500">None</div>;
                      return (
                        <div className="space-y-2">
                          {readings.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium break-words">{r.reading}</div>
                                <div className="text-xs text-slate-600">{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                {r.notes && <div className="text-xs text-slate-500 break-words">{r.notes}</div>}
                              </div>
                              <button 
                                onClick={async () => {
                                  if (confirm('Delete this reading?')) {
                                    const updatedReadings = readings.filter((_, i) => i !== idx);
                                    const updatedBlockData = {
                                      ...blockData,
                                      [selectedBlock]: {
                                        ...(blockData[selectedBlock] || {}),
                                        meterReadings: {
                                          ...(blockData[selectedBlock]?.meterReadings || {}),
                                          [meterKey]: updatedReadings
                                        }
                                      }
                                    };
                                    setBlockData(updatedBlockData);
                                    await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                                  }
                                }}
                                className="text-red-500 hover:bg-red-50 p-2 rounded flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}

              {/* INSURANCE - Regular items */}
              {activeSection === 'insurance' && !activeClaim && (() => {
                const setupKey = `insurance-${activeSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold">{activeSubItem.name === 'Terrorism insurance' ? 'Terrorism insurance renewal' : activeSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">Next due by:</span>
                      {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}
                      <button 
                        onClick={() => alert('Refreshed insurance status')}
                        className="bps-blue-text text-sm hover:underline flex items-center gap-1"
                      >
                        Refresh
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setCurrentSetupKey(setupKey);
                      if (isSetUp) {
                        setSetupForm({
                          frequency: setup.frequency,
                          lastCompleted: setup.lastCompleted || '',
                          nextDue: setup.nextDue,
                          assignedTo: setup.assignedTo || '',
                          autoChase: setup.autoChase
                        });
                      } else {
                        setSetupForm({
                          frequency: 'Annual',
                          lastCompleted: '',
                          nextDue: '',
                          assignedTo: '',
                          autoChase: 'Disabled'
                        });
                      }
                      setModalType('setup');
                      setShowModal(true);
                    }}
                    className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                  >
                    {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                  </button>
                </div>
                );
              })()}

              {/* INSURANCE - Claims workflow */}
              {activeSection === 'insurance' && activeClaim && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <h2 className="text-xl md:text-2xl font-bold">Identify source</h2>
                      <button className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto">
                        Complete
                      </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <h3 className="font-semibold">Subtasks</h3>
                      <button 
                        onClick={() => alert('Add custom subtasks feature coming soon')}
                        className="bps-blue-text text-sm hover:underline"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {claimWorkflow.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => alert(`${step.name} - Click to mark as complete`)}
                          className={`flex items-center justify-between w-full px-4 py-2.5 rounded text-sm ${
                            idx < 2 ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{step.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            idx < 2 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                          }`}>
                            {step.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Details</h3>
                    <div className="mb-4 text-sm md:text-base">
                      <span className="font-medium">Due date:</span> <span className="text-slate-600">21st Jan 2026</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <textarea 
                        id="claim-notes"
                        className="w-full border rounded-lg p-3 text-sm" 
                        rows="4" 
                        placeholder="Enter note"
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={() => {
                            const notes = document.getElementById('claim-notes').value;
                            if (notes.trim()) {
                              alert('Note saved: ' + notes);
                            } else {
                              alert('Please enter a note');
                            }
                          }}
                          className="bps-blue-text text-sm hover:underline"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-right">
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this insurance claim?')) {
                          alert('Insurance claim deleted');
                          setActiveClaim(null);
                          setActiveSubItem(null);
                        }
                      }}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Delete insurance claim
                    </button>
                  </div>
                </div>
              )}

              {/* DOCUMENTS */}
              {activeSection === 'documents' && (() => {
                const setupKey = `documents-${activeSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold">{activeSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-4 md:p-6'} inline-block`}>
                    <button 
                      onClick={() => {
                        setCurrentSetupKey(setupKey);
                        if (isSetUp) {
                          setSetupForm({
                            frequency: setup.frequency,
                            lastCompleted: setup.lastCompleted || '',
                            nextDue: setup.nextDue,
                            assignedTo: setup.assignedTo || '',
                            autoChase: setup.autoChase
                          });
                        } else {
                          setSetupForm({
                            frequency: 'Annual',
                            lastCompleted: '',
                            nextDue: '',
                            assignedTo: '',
                            autoChase: 'Disabled'
                          });
                        }
                        setModalType('setup');
                        setShowModal(true);
                      }}
                      className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>
                </div>
                );
              })()}
            </div>
          )}

          {/* O&MS TAB */}
          {activeTab === 'oand-ms' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-xl md:text-2xl font-bold">O&Ms</h2>
                <button 
                  onClick={() => alert('Upload O&M document - feature coming soon')}
                  className="bps-blue px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Upload document
                </button>
              </div>
              <div className="text-slate-500">No O&M documents</div>
            </div>
          )}

          {/* ASSET REGISTER TAB */}
          {activeTab === 'asset-register' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-xl md:text-2xl font-bold">Asset register</h2>
                <button 
                  onClick={() => alert('Add asset register item - feature coming soon')}
                  className="bps-blue px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add item
                </button>
              </div>
              <h3 className="font-medium mb-4">Assets</h3>
              <div className="text-slate-500">None</div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6">Notes</h2>
              <textarea 
                id={`notes-${activeSubItem?.id}`}
                rows="10"
                className="w-full border rounded-lg p-3 text-sm" 
                placeholder="Enter notes..."
                defaultValue={blockData[selectedBlock]?.notes?.[activeSubItem?.id] || ''}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={async () => {
                    const noteValue = document.getElementById(`notes-${activeSubItem?.id}`).value;
                    const updatedBlockData = {
                      ...blockData,
                      [selectedBlock]: {
                        ...(blockData[selectedBlock] || {}),
                        notes: {
                          ...(blockData[selectedBlock]?.notes || {}),
                          [activeSubItem?.id]: noteValue
                        }
                      }
                    };
                    setBlockData(updatedBlockData);
                    await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    alert('Notes saved!');
                  }}
                  className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                >
                  Save notes
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <button 
                    onClick={() => alert('Showing Auto-chase settings')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded text-sm font-medium mb-4 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Settings className="w-4 h-4" />
                    Auto-chase
                  </button>
                  <button 
                    onClick={() => alert('Showing General settings')}
                    className="flex items-center gap-2 px-4 py-2.5 border rounded text-sm mb-4 hover:bg-slate-50 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Settings className="w-4 h-4" />
                    General
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Contractor auto-chase</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Automated email chasers sent to the contractor/ supplier for upcoming or overdue actions. 
                    You'll be CC'd to each email. If they reply, it'll be sent directly to to your email address.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-2">
                      <span className="text-sm">- {activeSubItem?.name} contract renewal</span>
                      <button 
                        onClick={() => alert('Add contract first - feature coming soon')}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Add contract first
                      </button>
                    </div>
                  </div>
                </div>

                {activeSection === 'insurance' && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-semibold">Settings</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    <div className="space-y-2">
                      <button 
                        onClick={() => alert('Add another asset - feature coming soon')}
                        className="bps-blue-text text-sm hover:underline"
                      >
                        Add another {activeSubItem?.name}
                      </button>
                      <div>
                        <button 
                          onClick={() => {
                            if (confirm('Delete this asset? This action cannot be undone.')) {
                              alert('Asset deleted');
                              setActiveSubItem(null);
                            }
                          }}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Delete this asset
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // UNITS SECTION - COMPLETE
    if (activeSection === 'units') {
      const units = blockData[selectedBlock]?.units || [];
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold">Units</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setModalType('bulk-import');
                  setShowModal(true);
                }}
                className="border px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                Bulk import
              </button>
              <button 
                onClick={() => {
                  setUnitForm({
                    type: 'Flat',
                    number: '',
                    floor: '',
                    bedrooms: '',
                    residentName: '',
                    residentEmail: '',
                    residentPhone: '',
                    moveInDate: '',
                    isOwner: false,
                    notes: ''
                  });
                  setModalType('add-unit');
                  setShowModal(true);
                }}
                className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add unit
              </button>
            </div>
          </div>
          {units.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No units added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(unit => (
                <div key={unit.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{unit.type} {unit.number}</h3>
                      <p className="text-sm text-slate-600">Floor {unit.floor} • {unit.bedrooms} bed</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setUnitForm(unit);
                          setModalType('add-unit');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this unit?')) {
                            const updatedUnits = units.filter(u => u.id !== unit.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                units: updatedUnits
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {unit.residentName && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium">{unit.residentName}</p>
                      <p className="text-xs text-slate-600">{unit.isOwner ? 'Owner' : 'Tenant'}</p>
                      {unit.residentEmail && <p className="text-xs text-slate-500 break-words">{unit.residentEmail}</p>}
                      {unit.residentPhone && <p className="text-xs text-slate-500">{unit.residentPhone}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // CORRESPONDENCE SECTION - COMPLETE
    if (activeSection === 'correspondence') {
      const correspondence = blockData[selectedBlock]?.correspondence || [];
      let filteredCorrespondence = correspondence;
      
      if (correspondenceFilter !== 'all') {
        filteredCorrespondence = correspondence.filter(c => c.direction.toLowerCase() === correspondenceFilter);
      }
      
      if (correspondenceSearch) {
        filteredCorrespondence = filteredCorrespondence.filter(c =>
          c.subject.toLowerCase().includes(correspondenceSearch.toLowerCase()) ||
          c.recipientName.toLowerCase().includes(correspondenceSearch.toLowerCase()) ||
          c.content.toLowerCase().includes(correspondenceSearch.toLowerCase())
        );
      }

      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold">Correspondence</h2>
            <button 
              onClick={() => {
                setCorrespondenceForm({
                  type: 'Email',
                  direction: 'Outgoing',
                  subject: '',
                  recipientName: '',
                  recipientEmail: '',
                  unitNumber: '',
                  date: '',
                  content: '',
                  status: 'Sent',
                  notes: ''
                });
                setModalType('add-correspondence');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New correspondence
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setCorrespondenceFilter('all')}
                className={`px-3 py-1.5 rounded text-sm ${
                  correspondenceFilter === 'all' ? 'bg-slate-900 text-white' : 'border'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setCorrespondenceFilter('incoming')}
                className={`px-3 py-1.5 rounded text-sm ${
                  correspondenceFilter === 'incoming' ? 'bg-slate-900 text-white' : 'border'
                }`}
              >
                Incoming
              </button>
              <button 
                onClick={() => setCorrespondenceFilter('outgoing')}
                className={`px-3 py-1.5 rounded text-sm ${
                  correspondenceFilter === 'outgoing' ? 'bg-slate-900 text-white' : 'border'
                }`}
              >
                Outgoing
              </button>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={correspondenceSearch}
                  onChange={(e) => setCorrespondenceSearch(e.target.value)}
                  type="text" 
                  placeholder="Search correspondence" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" 
                />
              </div>
            </div>
          </div>

          {filteredCorrespondence.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No correspondence yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCorrespondence.map(item => (
                <div key={item.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium truncate">{item.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          item.direction === 'Incoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.direction}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        {item.direction === 'Incoming' ? 'From' : 'To'}: {item.recipientName}
                        {item.unitNumber && ` (Unit ${item.unitNumber})`}
                      </p>
                      <p className="text-sm text-slate-500 break-words line-clamp-2">{item.content}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(item.date).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setCorrespondenceForm(item);
                          setModalType('add-correspondence');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this correspondence?')) {
                            const updated = correspondence.filter(c => c.id !== item.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                correspondence: updated
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // JOBS SECTION - COMPLETE
    if (activeSection === 'jobs') {
      const jobs = blockData[selectedBlock]?.jobs || [];
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold">Jobs/projects</h2>
            <button 
              onClick={() => {
                setJobForm({
                  title: '',
                  description: '',
                  type: 'Maintenance',
                  contractor: '',
                  cost: '',
                  startDate: '',
                  completionDate: '',
                  status: 'Quote requested',
                  location: '',
                  notes: ''
                });
                setModalType('add-job');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New job
            </button>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium truncate">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          job.status === 'Complete' ? 'bg-green-100 text-green-700' :
                          job.status === 'In progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                          {job.type}
                        </span>
                      </div>
                      {job.contractor && <p className="text-sm text-slate-600">Contractor: {job.contractor}</p>}
                      {job.cost && <p className="text-sm text-slate-600">Cost: £{job.cost}</p>}
                      {job.description && <p className="text-sm text-slate-500 mt-2 break-words">{job.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                        {job.startDate && <span>Start: {new Date(job.startDate).toLocaleDateString('en-GB')}</span>}
                        {job.completionDate && <span>Complete: {new Date(job.completionDate).toLocaleDateString('en-GB')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setJobForm(job);
                          setModalType('add-job');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this job?')) {
                            const updatedJobs = jobs.filter(j => j.id !== job.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                jobs: updatedJobs
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // PORTAL SECTION
    if (activeSection === 'portal') {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Portal</h2>
          <div className="bg-white border rounded-lg p-8 md:p-12 max-w-2xl mx-auto">
            <div className="text-center">
              <DoorOpen className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 text-blue-500" />
              <h3 className="text-xl md:text-2xl font-bold mb-4">Resident Portal</h3>
              <p className="text-slate-600 mb-4">Access the resident-facing portal at:</p>
              <a 
                href="https://myblockonline.co.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-lg md:text-xl font-medium hover:underline"
              >
                myblockonline.co.uk
              </a>
            </div>
          </div>
        </div>
      );
    }

    // O&MS SECTION
    if (activeSection === 'oms') {
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold">O&Ms (Operation & Maintenance Manuals)</h2>
            <button 
              onClick={() => alert('Upload O&M documents - feature coming soon')}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              Upload documents
            </button>
          </div>
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p>No O&M documents uploaded yet</p>
          </div>
        </div>
      );
    }

    // H&S SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'hs' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">H&S</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a category from the left sidebar</p>
          </div>
          
          {/* Mobile: Show categories as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a category:</p>
            <div className="space-y-2">
              {hsItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubItem(item);
                    setActiveTab('home');
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                >
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // INSURANCE SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'insurance' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Insurance</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a category from the left sidebar</p>
          </div>
          
          {/* Mobile: Show categories as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a category:</p>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide mb-2">Policy Documents</h3>
                <div className="space-y-2">
                  {insuranceCategories.policy.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSubItem({...item, category: 'Policy documents'});
                        setActiveClaim(null);
                        setActiveTab('home');
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide mb-2">Other</h3>
                <div className="space-y-2">
                  {insuranceCategories.other.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSubItem({...item, category: 'Other'});
                        setActiveClaim(null);
                        setActiveTab('home');
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // UTILITIES SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'utilities' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Utilities</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a utility from the left sidebar</p>
          </div>
          
          {/* Mobile: Show utilities as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a utility:</p>
            <div className="space-y-2">
              {utilityItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubItem(item);
                    setActiveTab('home');
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                >
                  <Zap className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">{item.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // DOCUMENTS SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'documents' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Documents</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a document category from the left sidebar</p>
          </div>
          
          {/* Mobile: Show categories as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a category:</p>
            <div className="space-y-2">
              {documentCategories[0].items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubItem(item);
                    setActiveTab('home');
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                >
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-full text-slate-500 p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-sm md:text-base">Select an item from the left</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-600">Loading...</div>;
  }

  const currentBlock = blocks.find(b => b.id === selectedBlock);
  const subNavItems = renderSubNav();

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; }
        .bps-blue { background-color: #1d89c6 !important; color: white !important; }
        .bps-blue:hover { background-color: #1670a8 !important; }
        .bps-blue-text { color: #1d89c6 !important; }
        .bps-blue-text:hover { color: #1670a8 !important; }
        .bps-blue-border { border-color: #1d89c6 !important; }
        .bps-blue-bg-circle { background-color: #1d89c6 !important; }
        .hover-bps-border:hover { border-color: #1d89c6 !important; }
        .hover-bps-text:hover { color: #1670a8 !important; }
      `}</style>

      {/* Mobile Overlay for Main Nav */}
      {showMainNav && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMainNav(false)}
        />
      )}

      {/* Left Main Navigation */}
      <div className={`fixed lg:relative inset-y-0 left-0 transform ${showMainNav ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 lg:w-52 text-white flex flex-col flex-shrink-0 z-50`} style={{ backgroundColor: '#1d89c6' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 border-2 border-white rounded flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">BPS PRO</div>
            </div>
            <button
              onClick={() => setShowMainNav(false)}
              className="lg:hidden text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs font-medium text-white">Block Property Solutions</div>
          <div className="text-xs font-medium text-white mt-1 flex items-center gap-1">
            <span>👑</span> Admin
          </div>
          <button
            onClick={() => {
              // Clear auth state
              localStorage.removeItem('bps_auth');
              localStorage.removeItem('bps_user');
              if (typeof window !== 'undefined') {
                delete window.__bps_user_email;
              }
              // Redirect to login
              window.location.href = '/login';
            }}
            className="mt-2 w-full text-xs text-white px-2 py-1 rounded transition-colors"
            style={{ backgroundColor: '#515152' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#515152'}
          >
            Log Out
          </button>
          
          {/* Mobile-only: Collapsible Help & Support Section */}
          <div className="mt-4 pt-4 lg:hidden" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <button 
              onClick={() => setShowHelpSection(!showHelpSection)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded transition-colors"
            >
              <span className="font-medium">Help & Support</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showHelpSection ? 'rotate-180' : ''}`} />
            </button>
            
            {showHelpSection && (
              <div className="mt-2 space-y-1 pl-3">
                <button 
                  onClick={() => {
                    setInfoModalContent({
                      title: 'Presentation Mode',
                      message: 'Coming Soon'
                    });
                    setShowInfoModal(true);
                    setShowMainNav(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <span>📺</span>
                  <span>Pres. mode</span>
                </button>
                <button 
                  onClick={() => {
                    setInfoModalContent({
                      title: 'Request a Feature',
                      message: 'Email: keanu@blockpropertysolutions.co.uk\n\nShare your ideas and suggestions with us.'
                    });
                    setShowInfoModal(true);
                    setShowMainNav(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <span>👤</span>
                  <span>Request Feature</span>
                </button>
                <button 
                  onClick={() => {
                    setInfoModalContent({
                      title: 'Need Help?',
                      message: 'Email: keanu@blockpropertysolutions.co.uk\n\nWe typically respond within 24 hours.'
                    });
                    setShowInfoModal(true);
                    setShowMainNav(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <span>❓</span>
                  <span>Help</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <button
            onClick={() => {
              setShowAllBlocks(true);
              setActiveSection('home');
              setActiveSubItem(null);
              setActiveSubSubItem(null);
              setActiveClaim(null);
              setActiveTab('home');
              setShowMainNav(false);
            }}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
              showAllBlocks ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </div>
          </button>

          {/* Training Section - Collapsible (HOME ONLY) */}
          {showAllBlocks && (
            <div className="mb-1">
              {/* Training Main Button */}
              <button 
                onClick={() => setShowTrainingSection(!showTrainingSection)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded text-sm hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Training</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTrainingSection ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Module 1 (Nested) */}
              {showTrainingSection && (
                <div className="ml-4 mt-1">
                  <button 
                    onClick={() => setShowModule1(!showModule1)}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded text-sm hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📚</span>
                      <span>Module 1</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showModule1 ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Videos under Module 1 */}
                  {showModule1 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {[
                        'How to use Blocks Online 1',
                        'How to use Blocks Online 2',
                        'How to use Blocks Online 3',
                        'How to use Blocks Online 4'
                      ].map((video, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowTrainingModal(true);
                            setShowMainNav(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-white/10 text-left"
                        >
                          <span className="text-xs">🎥</span>
                          <span className="text-xs">{video}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!showAllBlocks && selectedBlock && mainNav.slice(1).map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowAllBlocks(false);
                  setActiveSection(item.id);
                  setActiveSubItem(null);
                  setActiveSubSubItem(null);
                  setActiveClaim(null);
                  setActiveTab('home');
                  setShowMainNav(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {/* Count badge or checkmark */}
                {(() => {
                  const count = getNavCount(item.id);
                  const isComplete = isNavComplete(item.id);
                  
                  if (count > 0) {
                    return (
                      <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {count}
                      </div>
                    );
                  } else if (isComplete && item.id !== 'portal') {
                    return (
                      <div className="flex-shrink-0 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    );
                  }
                  return null;
                })()}
              </button>
            );
          })}

          {!showAllBlocks && selectedBlock && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Residents</div>
              {residentNav.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setActiveSubItem(null);
                      setActiveTab('home');
                      setShowMainNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {/* Count badge or checkmark */}
                    {(() => {
                      const count = getNavCount(item.id);
                      const isComplete = isNavComplete(item.id);
                      
                      if (count > 0) {
                        return (
                          <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {count}
                          </div>
                        );
                      } else if (isComplete) {
                        return (
                          <div className="flex-shrink-0 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </button>
                );
              })}

              <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Block info</div>
              {blockInfoNav.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setActiveSubItem(null);
                      setActiveTab('home');
                      setShowMainNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {/* Count badge or checkmark */}
                    {(() => {
                      const count = getNavCount(item.id);
                      
                      if (count > 0) {
                        return (
                          <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {count}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </button>
                );
              })}

              <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Settings</div>
              {settingsNav.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setActiveSubItem(null);
                      setActiveTab('home');
                      setShowMainNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {!showAllBlocks && selectedBlock && (
          <div className="border-t border-slate-700 p-3">
            <div className="text-xs text-white mb-2">All blocks</div>
            <button 
              onClick={() => {
                setShowAllBlocks(true);
                setActiveSection('home');
                setShowMainNav(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2 bg-slate-700 rounded text-sm hover:bg-slate-600"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{currentBlock?.shortName}</span>
              </div>
              {(() => {
                const currentBlockData = blockData[selectedBlock] || { tasks: [] };
                const taskCount = currentBlockData.tasks?.length || 0;
                return taskCount > 0 ? (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">{taskCount}</span>
                ) : (
                  <span className="bg-slate-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">0</span>
                );
              })()}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Overlay for Sub Nav */}
      {showSubNav && subNavItems.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSubNav(false)}
        />
      )}

      {/* Middle Sidebar - Mobile friendly */}
      {subNavItems.length > 0 && (
        <div className={`fixed lg:relative inset-y-0 left-0 transform ${showSubNav ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white border-r border-slate-200 overflow-y-auto overscroll-contain flex-shrink-0 z-40`} style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold">
                {activeSection === 'hs' ? 'H&S' : 
                 activeSection === 'utilities' ? 'Utilities' : 
                 activeSection === 'insurance' ? 'Insurance' :
                 activeSection === 'documents' ? 'Documents' :
                 activeSection === 'issues' ? 'Issues' : 'Section'}
              </h2>
              <button
                onClick={() => setShowSubNav(false)}
                className="lg:hidden text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs uppercase mb-3 tracking-wide">Select</p>
            
            {activeSection === 'insurance' && subNavItems.map((item, idx) => {
              const showCategory = idx === 0 || subNavItems[idx - 1].category !== item.category;
              return (
                <React.Fragment key={`${item.category}-${item.id}`}>
                  {showCategory && (
                    <div className="text-xs uppercase mb-2 mt-4 tracking-wide">{item.category}</div>
                  )}
                  <button
                    onClick={() => {
                      setActiveSubItem(item);
                      if (item.category === 'Claims') {
                        setActiveClaim(item);
                      } else {
                        setActiveClaim(null);
                      }
                      setActiveTab('home');
                      setShowSubNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      activeSubItem?.id === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.name || 'Item'}</span>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}

            {activeSection !== 'insurance' && subNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubItem(item);
                  setActiveSubSubItem(null);
                  setActiveTab('home');
                  setShowSubNav(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                  activeSubItem?.id === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Mobile friendly */}
        <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => setShowMainNav(true)}
              className="lg:hidden text-slate-600 p-1.5"
            >
              <Menu className="w-5 h-5" />
            </button>
            {subNavItems.length > 0 && (
              <button
                onClick={() => setShowSubNav(true)}
                className="lg:hidden text-slate-600 p-1.5"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-base md:text-lg font-bold truncate">
                {showAllBlocks ? 'All Blocks' : currentBlock?.name}
              </h1>
              {/* Task count badge in header */}
              {!showAllBlocks && selectedBlock && (() => {
                const totalTasks = getTotalTasksForBlock(selectedBlock);
                if (totalTasks > 0) {
                  return (
                    <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                      {totalTasks}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-600">
            <button 
              onClick={() => {
                setInfoModalContent({
                  title: 'Presentation Mode',
                  message: 'Coming Soon'
                });
                setShowInfoModal(true);
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              📺 Pres. mode
            </button>
            <button 
              onClick={() => {
                setInfoModalContent({
                  title: 'Request a Feature',
                  message: 'Email: keanu@blockpropertysolutions.co.uk\n\nShare your ideas and suggestions with us.'
                });
                setShowInfoModal(true);
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              👤 Feature
            </button>
            <button 
              onClick={() => {
                setInfoModalContent({
                  title: 'Need Help?',
                  message: 'Email: keanu@blockpropertysolutions.co.uk\n\nWe typically respond within 24 hours.'
                });
                setShowInfoModal(true);
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              ❓ Help
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          {renderContent()}
        </div>
      </div>

      {/* MODALS SECTION - ALL MODALS */}
      
      {/* Setup Modal */}
      {showModal && modalType === 'setup' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Finish set-up</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frequency *</label>
                <select 
                  value={setupForm.frequency}
                  onChange={(e) => setSetupForm({...setupForm, frequency: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Annual</option>
                  <option>6-Monthly</option>
                  <option>Quarterly</option>
                  <option>Monthly</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last completed</label>
                <input 
                  value={setupForm.lastCompleted}
                  onChange={(e) => setSetupForm({...setupForm, lastCompleted: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Next due by *</label>
                <input 
                  value={setupForm.nextDue}
                  onChange={(e) => setSetupForm({...setupForm, nextDue: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assigned to</label>
                <input 
                  value={setupForm.assignedTo}
                  onChange={(e) => setSetupForm({...setupForm, assignedTo: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Name of contractor or person" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auto-chase</label>
                <select 
                  value={setupForm.autoChase}
                  onChange={(e) => setSetupForm({...setupForm, autoChase: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Disabled</option>
                  <option>7 days before</option>
                  <option>14 days before</option>
                  <option>30 days before</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSetupForm({
                    frequency: 'Annual',
                    lastCompleted: '',
                    nextDue: '',
                    assignedTo: '',
                    autoChase: 'Disabled'
                  });
                }} 
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!setupForm.frequency || !setupForm.nextDue) {
                    alert('Please fill in Frequency and Next due by');
                    return;
                  }
                  
                  const currentBlockData = blockData[selectedBlock] || { tasks: [], setups: {} };
                  const updatedSetups = {
                    ...(currentBlockData.setups || {}),
                    [currentSetupKey]: {
                      frequency: setupForm.frequency,
                      lastCompleted: setupForm.lastCompleted,
                      nextDue: setupForm.nextDue,
                      assignedTo: setupForm.assignedTo,
                      autoChase: setupForm.autoChase,
                      completed: true,
                      savedAt: new Date().toISOString()
                    }
                  };
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...currentBlockData,
                      setups: updatedSetups
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setSetupForm({
                    frequency: 'Annual',
                    lastCompleted: '',
                    nextDue: '',
                    assignedTo: '',
                    autoChase: 'Disabled'
                  });
                  setCurrentSetupKey(null);
                }} 
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {showModal && modalType === 'add-block' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Add new block</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Block name *</label>
                <input 
                  value={newBlockForm.name}
                  onChange={(e) => setNewBlockForm({...newBlockForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Riverside Apartments" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short name (for sidebar) *</label>
                <input 
                  value={newBlockForm.shortName}
                  onChange={(e) => setNewBlockForm({...newBlockForm, shortName: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Riverside Apt" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input 
                  value={newBlockForm.address}
                  onChange={(e) => setNewBlockForm({...newBlockForm, address: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Full address" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height category</label>
                <select 
                  value={newBlockForm.height}
                  onChange={(e) => setNewBlockForm({...newBlockForm, height: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Under 11m</option>
                  <option>11m - 18m</option>
                  <option>Over 18m</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setNewBlockForm({
                    name: '',
                    shortName: '',
                    address: '',
                    height: 'Under 11m'
                  });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newBlockForm.name || !newBlockForm.shortName || !newBlockForm.address) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  
                  const newBlock = {
                    id: String(Date.now()),
                    name: newBlockForm.name,
                    shortName: newBlockForm.shortName,
                    address: newBlockForm.address,
                    height: newBlockForm.height,
                    evacuationStrategy: 'stay-put',
                    managingAgent: {
                      name: 'Block Property Solutions',
                      address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                      manager: 'Keanu Billones',
                      email: 'keanu@blockpropertysolutions.co.uk'
                    }
                  };
                  const updatedBlocks = [...blocks, newBlock];
                  setBlocks(updatedBlocks);
                  
                  const updatedBlockData = {
                    ...blockData,
                    [newBlock.id]: {
                      tasks: [],
                      documents: [],
                      hsItems: [],
                      utilities: [],
                      insurance: [],
                      issues: []
                    }
                  };
                  setBlockData(updatedBlockData);
                  
                  await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setNewBlockForm({
                    name: '',
                    shortName: '',
                    address: '',
                    height: 'Under 11m'
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showModal && modalType === 'add-task' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">New task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task title *</label>
                <input 
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Schedule fire alarm test" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Add details about this task..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due date</label>
                <input 
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({...newTaskForm, dueDate: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  value={newTaskForm.category}
                  onChange={(e) => setNewTaskForm({...newTaskForm, category: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>General</option>
                  <option>Documents</option>
                  <option>H&S</option>
                  <option>Insurance</option>
                  <option>Utilities</option>
                  <option>Jobs/projects</option>
                  <option>Issues/complaints</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setNewTaskForm({
                    title: '',
                    dueDate: '',
                    priority: 'Medium',
                    category: 'General',
                    description: ''
                  });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newTaskForm.title) {
                    alert('Please enter a task title');
                    return;
                  }
                  
                  const newTask = {
                    id: String(Date.now()),
                    title: newTaskForm.title,
                    description: newTaskForm.description,
                    dueDate: newTaskForm.dueDate,
                    priority: newTaskForm.priority,
                    category: newTaskForm.category,
                    completed: false,
                    createdAt: new Date().toISOString()
                  };
                  
                  const currentBlockData = blockData[selectedBlock] || { tasks: [] };
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...currentBlockData,
                      tasks: [...(currentBlockData.tasks || []), newTask]
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setNewTaskForm({
                    title: '',
                    dueDate: '',
                    priority: 'Medium',
                    category: 'General',
                    description: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Responsible Person Modal */}
      {showModal && modalType === 'add-rp' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Add Responsible Person</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input 
                  value={rpForm.name}
                  onChange={(e) => setRpForm({...rpForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Full name" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <input 
                  value={rpForm.role}
                  onChange={(e) => setRpForm({...rpForm, role: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Property Manager, Director" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  value={rpForm.email}
                  onChange={(e) => setRpForm({...rpForm, email: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="email@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  value={rpForm.phone}
                  onChange={(e) => setRpForm({...rpForm, phone: e.target.value})}
                  type="tel" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="0800 000 0000" 
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setRpForm({ name: '', role: '', email: '', phone: '' });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!rpForm.name) {
                    alert('Please enter a name');
                    return;
                  }
                  const updatedRPs = [...(blockData[selectedBlock]?.responsiblePersons || []), { ...rpForm }];
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      responsiblePersons: updatedRPs
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setRpForm({ name: '', role: '', email: '', phone: '' });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Meter Reading Modal */}
      {showModal && modalType === 'add-meter' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Add meter reading</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input 
                  value={meterReadingForm.date}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, date: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reading *</label>
                <input 
                  value={meterReadingForm.reading}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, reading: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., 12345 kWh" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={meterReadingForm.notes}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Optional notes" 
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setMeterReadingForm({ date: '', reading: '', notes: '' });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!meterReadingForm.date || !meterReadingForm.reading) {
                    alert('Please fill in date and reading');
                    return;
                  }
                  const meterKey = currentSetupKey;
                  const existingReadings = blockData[selectedBlock]?.meterReadings?.[meterKey] || [];
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      meterReadings: {
                        ...(blockData[selectedBlock]?.meterReadings || {}),
                        [meterKey]: [...existingReadings, { ...meterReadingForm }]
                      }
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setMeterReadingForm({ date: '', reading: '', notes: '' });
                  setCurrentSetupKey(null);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Issue Modal */}
      {showModal && modalType === 'add-issue' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">New issue or complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input 
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Broken communal door" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  value={issueForm.location}
                  onChange={(e) => setIssueForm({...issueForm, location: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Ground floor lobby, Flat 3" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Describe the issue..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!issueForm.title) {
                    alert('Please enter a title');
                    return;
                  }
                  const newIssue = {
                    id: String(Date.now()),
                    ...issueForm,
                    resolved: false,
                    createdAt: new Date().toISOString()
                  };
                  const existingIssues = blockData[selectedBlock]?.issues || [];
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      issues: [...existingIssues, newIssue]
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Report issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {showModal && modalType === 'edit-block' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Edit block details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Block name *</label>
                <input 
                  value={editBlockForm.name}
                  onChange={(e) => setEditBlockForm({...editBlockForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short name (sidebar/header) *</label>
                <input 
                  value={editBlockForm.shortName}
                  onChange={(e) => setEditBlockForm({...editBlockForm, shortName: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input 
                  value={editBlockForm.address}
                  onChange={(e) => setEditBlockForm({...editBlockForm, address: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height category</label>
                <select 
                  value={editBlockForm.height}
                  onChange={(e) => setEditBlockForm({...editBlockForm, height: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Under 11m</option>
                  <option>11m - 18m</option>
                  <option>Over 18m</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!editBlockForm.name || !editBlockForm.shortName || !editBlockForm.address) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  const updatedBlocks = blocks.map(b => 
                    b.id === selectedBlock 
                      ? { ...b, name: editBlockForm.name, shortName: editBlockForm.shortName, address: editBlockForm.address, height: editBlockForm.height }
                      : b
                  );
                  setBlocks(updatedBlocks);
                  await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                  setShowModal(false);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Managing Agent Modal */}
      {showModal && modalType === 'edit-agent' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Edit managing agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Managing agent name *</label>
                <input 
                  value={editAgentForm.name}
                  onChange={(e) => setEditAgentForm({...editAgentForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Block Property Solutions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea 
                  value={editAgentForm.address}
                  onChange={(e) => setEditAgentForm({...editAgentForm, address: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Full business address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property manager *</label>
                <input 
                  value={editAgentForm.manager}
                  onChange={(e) => setEditAgentForm({...editAgentForm, manager: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input 
                  value={editAgentForm.email}
                  onChange={(e) => setEditAgentForm({...editAgentForm, email: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="manager@example.com"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!editAgentForm.name || !editAgentForm.address || !editAgentForm.manager || !editAgentForm.email) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  const updatedBlocks = blocks.map(b => 
                    b.id === selectedBlock 
                      ? { ...b, managingAgent: { ...editAgentForm } }
                      : b
                  );
                  setBlocks(updatedBlocks);
                  await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                  setShowModal(false);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Job Modal */}
      {showModal && modalType === 'add-job' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">{jobForm.id ? 'Edit job' : 'New job'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job title *</label>
                <input 
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Repair communal door"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  value={jobForm.type}
                  onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Maintenance</option>
                  <option>Repair</option>
                  <option>Installation</option>
                  <option>Inspection</option>
                  <option>Upgrade</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Describe the work required..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  value={jobForm.location}
                  onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Ground floor lobby"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contractor</label>
                <input 
                  value={jobForm.contractor}
                  onChange={(e) => setJobForm({...jobForm, contractor: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Contractor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost (£)</label>
                <input 
                  value={jobForm.cost}
                  onChange={(e) => setJobForm({...jobForm, cost: e.target.value})}
                  type="number" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start date</label>
                  <input 
                    value={jobForm.startDate}
                    onChange={(e) => setJobForm({...jobForm, startDate: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Completion date</label>
                  <input 
                    value={jobForm.completionDate}
                    onChange={(e) => setJobForm({...jobForm, completionDate: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={jobForm.status}
                  onChange={(e) => setJobForm({...jobForm, status: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Quote requested</option>
                  <option>Quote received</option>
                  <option>Approved</option>
                  <option>In progress</option>
                  <option>Complete</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={jobForm.notes}
                  onChange={(e) => setJobForm({...jobForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setJobForm({
                    title: '',
                    description: '',
                    type: 'Maintenance',
                    contractor: '',
                    cost: '',
                    startDate: '',
                    completionDate: '',
                    status: 'Quote requested',
                    location: '',
                    notes: ''
                  });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!jobForm.title) {
                    alert('Please enter a job title');
                    return;
                  }
                  
                  const jobs = blockData[selectedBlock]?.jobs || [];
                  let updatedJobs;
                  
                  if (jobForm.id) {
                    updatedJobs = jobs.map(j => j.id === jobForm.id ? jobForm : j);
                  } else {
                    const newJob = {
                      ...jobForm,
                      id: String(Date.now()),
                      createdAt: new Date().toISOString()
                    };
                    updatedJobs = [...jobs, newJob];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      jobs: updatedJobs
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setJobForm({
                    title: '',
                    description: '',
                    type: 'Maintenance',
                    contractor: '',
                    cost: '',
                    startDate: '',
                    completionDate: '',
                    status: 'Quote requested',
                    location: '',
                    notes: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {jobForm.id ? 'Save changes' : 'Add job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Unit Modal */}
      {showModal && modalType === 'add-unit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">{unitForm.id ? 'Edit unit' : 'Add unit'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select 
                    value={unitForm.type}
                    onChange={(e) => setUnitForm({...unitForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option>Flat</option>
                    <option>House</option>
                    <option>Studio</option>
                    <option>Penthouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit number *</label>
                  <input 
                    value={unitForm.number}
                    onChange={(e) => setUnitForm({...unitForm, number: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                    placeholder="e.g., 1A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Floor</label>
                  <input 
                    value={unitForm.floor}
                    onChange={(e) => setUnitForm({...unitForm, floor: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                    placeholder="e.g., 1, G"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input 
                    value={unitForm.bedrooms}
                    onChange={(e) => setUnitForm({...unitForm, bedrooms: e.target.value})}
                    type="number" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Resident information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input 
                      value={unitForm.residentName}
                      onChange={(e) => setUnitForm({...unitForm, residentName: e.target.value})}
                      type="text" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                      placeholder="Resident name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                      value={unitForm.residentEmail}
                      onChange={(e) => setUnitForm({...unitForm, residentEmail: e.target.value})}
                      type="email" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input 
                      value={unitForm.residentPhone}
                      onChange={(e) => setUnitForm({...unitForm, residentPhone: e.target.value})}
                      type="tel" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Move-in date</label>
                    <input 
                      value={unitForm.moveInDate}
                      onChange={(e) => setUnitForm({...unitForm, moveInDate: e.target.value})}
                      type="date" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={unitForm.isOwner}
                      onChange={(e) => setUnitForm({...unitForm, isOwner: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Owner (unchecked = tenant)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={unitForm.notes}
                  onChange={(e) => setUnitForm({...unitForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setUnitForm({
                    type: 'Flat',
                    number: '',
                    floor: '',
                    bedrooms: '',
                    residentName: '',
                    residentEmail: '',
                    residentPhone: '',
                    moveInDate: '',
                    isOwner: false,
                    notes: ''
                  });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!unitForm.type || !unitForm.number) {
                    alert('Please fill in unit type and number');
                    return;
                  }
                  
                  const units = blockData[selectedBlock]?.units || [];
                  let updatedUnits;
                  
                  if (unitForm.id) {
                    updatedUnits = units.map(u => u.id === unitForm.id ? unitForm : u);
                  } else {
                    const newUnit = {
                      ...unitForm,
                      id: String(Date.now()),
                      createdAt: new Date().toISOString()
                    };
                    updatedUnits = [...units, newUnit];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      units: updatedUnits
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setUnitForm({
                    type: 'Flat',
                    number: '',
                    floor: '',
                    bedrooms: '',
                    residentName: '',
                    residentEmail: '',
                    residentPhone: '',
                    moveInDate: '',
                    isOwner: false,
                    notes: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {unitForm.id ? 'Save changes' : 'Add unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Units Modal */}
      {showModal && modalType === 'bulk-import' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">Bulk import units</h3>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4">
                Upload a CSV file with the following columns: Type, Number, Floor, Bedrooms, ResidentName, ResidentEmail, ResidentPhone, MoveInDate, IsOwner (true/false)
              </p>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  setBulkImportFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const text = event.target.result;
                      const lines = text.split('\n').filter(l => l.trim());
                      const headers = lines[0].split(',').map(h => h.trim());
                      
                      const preview = [];
                      for (let i = 1; i < Math.min(6, lines.length); i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        const unit = {
                          type: values[0] || 'Flat',
                          number: values[1] || '',
                          floor: values[2] || '',
                          bedrooms: values[3] || '',
                          residentName: values[4] || '',
                          residentEmail: values[5] || '',
                          residentPhone: values[6] || '',
                          moveInDate: values[7] || '',
                          isOwner: values[8]?.toLowerCase() === 'true'
                        };
                        preview.push(unit);
                      }
                      
                      setBulkImportPreview(preview);
                      setBulkImportError('');
                    } catch (error) {
                      setBulkImportError('Error parsing CSV file. Please check the format.');
                      setBulkImportPreview([]);
                    }
                  };
                  reader.readAsText(file);
                }}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" 
              />
              {bulkImportFileName && (
                <p className="text-sm text-slate-600 mt-2">Selected: {bulkImportFileName}</p>
              )}
              {bulkImportError && (
                <p className="text-sm text-red-500 mt-2">{bulkImportError}</p>
              )}
            </div>
            
            {bulkImportPreview.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border px-2 py-1 text-left">Type</th>
                        <th className="border px-2 py-1 text-left">Number</th>
                        <th className="border px-2 py-1 text-left">Floor</th>
                        <th className="border px-2 py-1 text-left">Beds</th>
                        <th className="border px-2 py-1 text-left">Resident</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkImportPreview.map((unit, idx) => (
                        <tr key={idx}>
                          <td className="border px-2 py-1">{unit.type}</td>
                          <td className="border px-2 py-1">{unit.number}</td>
                          <td className="border px-2 py-1">{unit.floor}</td>
                          <td className="border px-2 py-1">{unit.bedrooms}</td>
                          <td className="border px-2 py-1">{unit.residentName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setBulkImportPreview([]);
                  setBulkImportError('');
                  setBulkImportFileName('');
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (bulkImportPreview.length === 0) {
                    alert('Please upload a CSV file first');
                    return;
                  }
                  
                  const units = blockData[selectedBlock]?.units || [];
                  const newUnits = bulkImportPreview.map(unit => ({
                    ...unit,
                    id: String(Date.now() + Math.random()),
                    createdAt: new Date().toISOString()
                  }));
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      units: [...units, ...newUnits]
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  alert(`Successfully imported ${newUnits.length} units`);
                  setShowModal(false);
                  setBulkImportPreview([]);
                  setBulkImportError('');
                  setBulkImportFileName('');
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
                disabled={bulkImportPreview.length === 0}
              >
                Import units
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Correspondence Modal */}
      {showModal && modalType === 'add-correspondence' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">{correspondenceForm.id ? 'Edit correspondence' : 'New correspondence'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select 
                    value={correspondenceForm.type}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option>Email</option>
                    <option>Letter</option>
                    <option>Phone call</option>
                    <option>Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Direction</label>
                  <select 
                    value={correspondenceForm.direction}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, direction: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option>Outgoing</option>
                    <option>Incoming</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input 
                  value={correspondenceForm.subject}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, subject: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="e.g., Noise complaint - Unit 3A"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient name *</label>
                  <input 
                    value={correspondenceForm.recipientName}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, recipientName: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit number</label>
                  <input 
                    value={correspondenceForm.unitNumber}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, unitNumber: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                    placeholder="e.g., 3A"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  value={correspondenceForm.recipientEmail}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, recipientEmail: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  value={correspondenceForm.date}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, date: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea 
                  value={correspondenceForm.content}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, content: e.target.value})}
                  rows="4"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Message content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={correspondenceForm.status}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, status: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Received</option>
                  <option>Pending reply</option>
                  <option>Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={correspondenceForm.notes}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" 
                  placeholder="Internal notes..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setCorrespondenceForm({
                    type: 'Email',
                    direction: 'Outgoing',
                    subject: '',
                    recipientName: '',
                    recipientEmail: '',
                    unitNumber: '',
                    date: '',
                    content: '',
                    status: 'Sent',
                    notes: ''
                  });
                }}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!correspondenceForm.subject || !correspondenceForm.recipientName || !correspondenceForm.content) {
                    alert('Please fill in subject, recipient name, and content');
                    return;
                  }
                  
                  const correspondence = blockData[selectedBlock]?.correspondence || [];
                  let updatedCorrespondence;
                  
                  if (correspondenceForm.id) {
                    updatedCorrespondence = correspondence.map(c => c.id === correspondenceForm.id ? correspondenceForm : c);
                  } else {
                    const newItem = {
                      ...correspondenceForm,
                      id: String(Date.now()),
                      date: correspondenceForm.date || new Date().toISOString().split('T')[0],
                      createdAt: new Date().toISOString()
                    };
                    updatedCorrespondence = [...correspondence, newItem];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      correspondence: updatedCorrespondence
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setCorrespondenceForm({
                    type: 'Email',
                    direction: 'Outgoing',
                    subject: '',
                    recipientName: '',
                    recipientEmail: '',
                    unitNumber: '',
                    date: '',
                    content: '',
                    status: 'Sent',
                    notes: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {correspondenceForm.id ? 'Save changes' : 'Add correspondence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Info Modal (Pres. mode, Feature, Help) - Click anywhere to close */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 md:p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{infoModalContent.title}</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-slate-600 whitespace-pre-line text-sm md:text-base leading-relaxed">
              {infoModalContent.message}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="bps-blue px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Module Modal */}
      {showTrainingModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowTrainingModal(false);
            setSelectedVideo(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 md:p-8 w-full max-w-4xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" style={{ color: '#1d89c6' }} />
                  {selectedVideo}
                </h3>
                <p className="text-sm text-slate-500 mt-1">BPS Pro Training - Module 1</p>
              </div>
              <button
                onClick={() => {
                  setShowTrainingModal(false);
                  setSelectedVideo(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Video Player */}
            <div className="bg-slate-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe
                src={`https://www.loom.com/embed/${
                  selectedVideo === 'How to use Blocks Online 1' ? '50f5a5255c154afb9dcff36215554ef4' :
                  selectedVideo === 'How to use Blocks Online 2' ? 'e9d5897256fb4cae8f2ca6a4e79763b6' :
                  selectedVideo === 'How to use Blocks Online 3' ? '18b6abf98a3b4bd1a4faa2c9b333e693' :
                  '85d0c596ca154e33b10ffde3acb20324'
                }?sid=training`}
                frameBorder="0"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTrainingModal(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#1d89c6' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
