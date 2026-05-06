import React, { useState, useEffect } from 'react';
import { Building, Home, FileText, Zap, Shield, MapPin, Users, Settings, Plus, Upload, Calendar, AlertCircle, CheckCircle, Edit2, Trash2, Download, X, Info, Menu, Wrench, MessageSquare, DoorOpen, Mail, Search, RefreshCw, ChevronDown } from 'lucide-react';

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
          // Start at home view showing all blocks
          setShowAllBlocks(true);
          setActiveSection('home');
          
          // Load or initialize block-specific data
          const dataResult = await window.storage.get('bps_pro_block_data');
          if (dataResult) {
            setBlockData(JSON.parse(dataResult.value));
          } else {
            // Initialize empty data structure for each block
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
          // Start at home view showing all blocks
          setShowAllBlocks(true);
          setActiveSection('home');
          
          // Initialize empty data for each sample block
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
        <div className="p-8">
          <div className="max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">All blocks</h2>
              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    if (confirm('Clear all blocks and start fresh? This cannot be undone.')) {
                      setBlocks([]);
                      setBlockData({});
                      await window.storage.set('bps_pro_blocks', JSON.stringify([]));
                      await window.storage.set('bps_pro_block_data', JSON.stringify({}));
                    }
                  }}
                  className="border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
                >
                  Clear all blocks
                </button>
                <button 
                  onClick={() => {
                    setModalType('add-block');
                    setShowModal(true);
                  }}
                  className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add new block
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blocks.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-slate-500">
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
                    className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:bps-blue-border hover:shadow-lg transition-all relative"
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
                      className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded"
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
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bps-blue-bg-circle rounded-full flex items-center justify-center flex-shrink-0">
                        <Building className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{block.shortName || block.name}</h3>
                        <p className="text-xs text-slate-500">{block.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {taskCount > 0 ? (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{taskCount} tasks</span>
                      ) : (
                        <span className="bg-slate-300 text-slate-600 text-xs px-2 py-1 rounded-full">0 tasks</span>
                      )}
                      {taskCount > 0 && (
                        <>
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">⚠️</span>
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">🔴</span>
                        </>
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
      
      // Calculate task counts
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
      
      // Calculate set-up required count from H&S, Utilities, Insurance, Documents
      const setups = currentBlockData.setups || {};
      const allSetupKeys = [];
      
      // H&S setup keys
      hsItems.forEach(item => {
        if (item.subItems) {
          item.subItems.forEach(sub => {
            allSetupKeys.push(`hs-${item.id}-${sub.id}`);
          });
        }
      });
      // Utilities
      utilityItems.forEach(item => {
        allSetupKeys.push(`utilities-${item.id}`);
      });
      // Insurance
      [...insuranceCategories.policy, ...insuranceCategories.other].forEach(item => {
        allSetupKeys.push(`insurance-${item.id}`);
      });
      // Documents
      documentCategories[0].items.forEach(item => {
        allSetupKeys.push(`documents-${item.id}`);
      });
      
      const setupRequiredCount = allSetupKeys.filter(key => !setups[key]?.completed).length;
      
      // Helper to get item name from setup key
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
      
      // Find overdue setup items (setup completed but next due date passed)
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
      
      // Combine overdue tasks with overdue setups
      const allOverdueItems = [
        ...overdueOrHighPriorityTasks,
        ...overdueSetups
      ];
      
      // Filter tasks based on selected tab and search
      let filteredTasks = allTasks;
      if (taskFilter === 'upcoming') {
        filteredTasks = upcomingTasks;
      } else if (taskFilter === 'overdue') {
        filteredTasks = allOverdueItems;
      } else if (taskFilter === 'setup') {
        filteredTasks = []; // Setup items shown separately
      }
      
      if (taskSearch) {
        filteredTasks = filteredTasks.filter(t => 
          t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase())) ||
          (t.category && t.category.toLowerCase().includes(taskSearch.toLowerCase()))
        );
      }

      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All tasks</h2>
            <button 
              onClick={() => {
                setModalType('add-task');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New task
            </button>
          </div>
          
          <div className="flex gap-6 mb-6 border-b overflow-x-auto">
            <button 
              onClick={() => setTaskFilter('all')}
              className={`pb-3 px-1 text-sm whitespace-nowrap ${
                taskFilter === 'all' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setTaskFilter('upcoming')}
              className={`pb-3 px-1 text-sm flex items-center gap-2 whitespace-nowrap ${
                taskFilter === 'upcoming' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              Upcoming/ Outstanding
              {upcomingTasks.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center">
                  {upcomingTasks.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setTaskFilter('overdue')}
              className={`pb-3 px-1 text-sm flex items-center gap-2 whitespace-nowrap ${
                taskFilter === 'overdue' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              Overdue/ High Priority
              {allOverdueItems.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center">
                  {allOverdueItems.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setTaskFilter('setup')}
              className={`pb-3 px-1 text-sm flex items-center gap-2 whitespace-nowrap ${
                taskFilter === 'setup' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
              }`}
            >
              Set-up required
              {setupRequiredCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center">
                  {setupRequiredCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                type="text" 
                placeholder="Search" 
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" 
              />
            </div>
          </div>
          
          {/* Set-up required view */}
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
                        // Navigate to the relevant section
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
                      <div className="flex-1">
                        <div className="font-medium group-hover:bps-blue-text">{itemName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{sectionName}</span>
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Set-up required</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bps-blue-text text-sm font-medium ml-4 flex-shrink-0">
                        <span>Set up</span>
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
                // If this is an overdue setup item, render it as a clickable card
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
                      className="bg-white border-2 border-red-200 rounded-lg p-4 flex items-center justify-between w-full text-left hover-bps-border hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-red-700 group-hover:text-blue-600">⚠️ {task.title}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-red-500">
                            <Calendar className="w-3 h-3" />
                            Was due: {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                        <span>Review</span>
                        <span className="text-lg">→</span>
                      </div>
                    </button>
                  );
                }
                
                // Regular task rendering
                const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
                return (
                  <div 
                    key={task.id} 
                    className={`bg-white border rounded-lg p-4 flex items-center gap-4 ${
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
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-slate-600 mt-1">{task.description}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
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
                      className="text-red-500 hover:bg-red-50 p-2 rounded"
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

    // BLOCK INFO
    if (activeSection === 'block-info') {
      return (
        <div className="p-8">
          <div className="max-w-4xl">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-32 h-32 bps-blue-bg-circle rounded-full flex items-center justify-center flex-shrink-0">
                <Building className="w-16 h-16 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{currentBlock?.shortName || currentBlock?.name}</h2>
                    <p className="text-slate-600 mb-3">Also known as {currentBlock?.name}</p>
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
                    className="bps-blue-text text-sm hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Address:</span> {currentBlock?.address}</p>
                <p className="text-sm text-slate-600"><span className="font-medium">Height category:</span> {currentBlock?.height}</p>
              </div>
            </div>

            <div className="border-2 border-red-300 rounded-lg p-6 mb-8">
              <h3 className="font-bold mb-4">Evacuation strategy:</h3>
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
                    className="mt-1" 
                  />
                  <span>Simultaneous</span>
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
                    className="mt-1" 
                  />
                  <div>
                    <div className="font-medium">Stay put</div>
                    <div className="text-sm text-slate-600 mt-1">
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
                    className="mt-1" 
                  />
                  <span>Phased</span>
                </label>
              </div>
              <button 
                onClick={() => alert('Evacuation strategy saved successfully!')}
                className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
              >
                Set evacuation strategy
              </button>
            </div>

            <div className="border-2 border-red-300 rounded-lg p-6 mb-8">
              <h3 className="font-bold mb-4">Responsible Person (RP)</h3>
              {(blockData[selectedBlock]?.responsiblePersons || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {(blockData[selectedBlock]?.responsiblePersons || []).map((rp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded">
                      <div>
                        <div className="font-medium">{rp.name}</div>
                        <div className="text-xs text-slate-600">{rp.role}</div>
                        <div className="text-xs text-slate-500">{rp.email} • {rp.phone}</div>
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
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
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
                className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
              >
                Add
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Managing agent</h3>
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
              <p className="text-sm mb-1"><span className="font-medium">Managing agent:</span> {currentBlock?.managingAgent?.name}</p>
              <p className="text-sm mb-1"><span className="font-medium">Address:</span> {currentBlock?.managingAgent?.address}</p>
              <p className="text-sm mb-1"><span className="font-medium">Property manager:</span> {currentBlock?.managingAgent?.manager}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {currentBlock?.managingAgent?.email}</p>
            </div>
          </div>
        </div>
      );
    }

    // BLOCK SETTINGS
    if (activeSection === 'block-settings') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Settings</h2>
          <div className="flex gap-8">
            <div className="w-64">
              <p className="text-xs text-slate-500 uppercase mb-3">Select</p>
              <button 
                onClick={() => setSettingsTab('assets')}
                className={`flex items-center gap-2 w-full px-4 py-2 rounded mb-2 text-sm ${
                  settingsTab === 'assets' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Add/ remove assets
              </button>
              <button 
                onClick={() => setSettingsTab('auto-chase')}
                className={`flex items-center gap-2 w-full px-4 py-2 rounded mb-2 text-sm ${
                  settingsTab === 'auto-chase' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Contractor auto-chase
              </button>
              <button 
                onClick={() => setSettingsTab('resident')}
                className={`flex items-center gap-2 w-full px-4 py-2 rounded mb-2 text-sm ${
                  settingsTab === 'resident' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Resident settings
              </button>
              <button 
                onClick={() => setSettingsTab('site-staff')}
                className={`flex items-center gap-2 w-full px-4 py-2 rounded mb-2 text-sm ${
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
                  <h3 className="text-xl font-bold mb-4">Add/ remove assets</h3>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        type="text" 
                        placeholder="Search" 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" 
                      />
                    </div>
                  </div>
                  <h4 className="font-medium mb-3">Service and maintenance (H&S items)</h4>
                  <div className="space-y-2">
                    {blockAssets
                      .filter(asset => asset.name.toLowerCase().includes(assetSearch.toLowerCase()))
                      .map(asset => {
                        const blockAssetState = blockData[selectedBlock]?.assets?.[asset.id];
                        const isActive = blockAssetState !== undefined ? blockAssetState : asset.active;
                        return (
                          <div key={asset.id} className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm">{asset.name}</span>
                            <div className="flex items-center gap-2">
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
                                    className="text-red-500 text-xs hover:underline"
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
                                    className="bps-blue-text text-sm hover:underline"
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
                  <h3 className="text-xl font-bold mb-4">Contractor auto-chase</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Automated email chasers sent to the contractor/ supplier for upcoming or overdue actions.
                  </p>
                  <div className="text-slate-500">No contractors configured yet</div>
                </>
              )}
              
              {settingsTab === 'resident' && (
                <>
                  <h3 className="text-xl font-bold mb-4">Resident settings</h3>
                  <p className="text-sm text-slate-600 mb-4">Configure resident communication preferences.</p>
                  <div className="text-slate-500">Coming soon</div>
                </>
              )}
              
              {settingsTab === 'site-staff' && (
                <>
                  <h3 className="text-xl font-bold mb-4">Site staff</h3>
                  <p className="text-sm text-slate-600 mb-4">Manage site staff members.</p>
                  <button 
                    onClick={() => alert('Add site staff coming soon!')}
                    className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
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

    // ISSUES/COMPLAINTS
    if (activeSection === 'issues') {
      const issues = blockData[selectedBlock]?.issues || [];
      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Reported issues/complaints</h2>
            <div className="flex gap-3">
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
                className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${issue.resolved ? 'line-through' : ''}`}>{issue.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          issue.priority === 'High' ? 'bg-red-100 text-red-700' :
                          issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {issue.priority}
                        </span>
                      </div>
                      {issue.location && <div className="text-xs text-slate-600 mb-2">📍 {issue.location}</div>}
                      <p className="text-sm text-slate-600">{issue.description}</p>
                      <div className="text-xs text-slate-400 mt-2">Reported: {new Date(issue.createdAt).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="flex gap-2">
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

    // H&S, UTILITIES, INSURANCE, DOCUMENTS WITH ITEMS
    if ((activeSection === 'hs' || activeSection === 'utilities' || activeSection === 'insurance' || activeSection === 'documents') && activeSubItem) {
      const hasTabs = activeSection !== 'insurance';
      const tabs = hasTabs ? ['Home', 'O&Ms', 'Asset register', 'Notes', 'Settings'] : ['Home', 'Settings'];

      return (
        <div className="p-8">
          {/* Tabs */}
          <div className="mb-6 flex gap-6 border-b">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'))}
                className={`pb-3 text-sm ${
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
                  <h2 className="text-2xl font-bold mb-6">{activeSubItem.name}</h2>
                  <div className="space-y-2">
                    {activeSubItem.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveSubSubItem(subItem)}
                        className="flex items-center justify-between w-full px-4 py-3 bg-white rounded border hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{subItem.name}</span>
                        </div>
                        {subItem.badge && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{subItem.badge}</span>}
                        {subItem.complete && <CheckCircle className="w-5 h-5 text-green-500" />}
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
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setHsViewType('surveys')}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
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
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm ${
                        hsViewType === 'remedials' ? 'bg-slate-900 text-white' : 'border'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Remedials
                      <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-2xl font-bold">{activeSubSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
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

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-6'} inline-block`}>
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
                      className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
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
                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {activeSubItem.name}
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </h2>
                  </div>

                  <h3 className="text-lg mb-6">{activeSubItem.fullName}</h3>
                  {isSetUp ? (
                    <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium inline-block mb-6">Set up</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium inline-block mb-6">Set-up required</span>
                  )}

                  <div className="space-y-4 mb-8">
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

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-6'} inline-block mb-8`}>
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
                      className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Meter readings</h3>
                      <button 
                        onClick={() => {
                          setCurrentSetupKey(`meter-${activeSubItem.id}`);
                          setMeterReadingForm({ date: '', reading: '', notes: '' });
                          setModalType('add-meter');
                          setShowModal(true);
                        }}
                        className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
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
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded">
                              <div>
                                <div className="font-medium">{r.reading}</div>
                                <div className="text-xs text-slate-600">{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                {r.notes && <div className="text-xs text-slate-500">{r.notes}</div>}
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
                                className="text-red-500 hover:bg-red-50 p-2 rounded"
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
                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-2xl font-bold">{activeSubItem.name === 'Terrorism insurance' ? 'Terrorism insurance renewal' : activeSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div><span className="font-medium">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div className="flex items-center gap-2">
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
                    className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
                  >
                    {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                  </button>
                </div>
                );
              })()}

              {/* INSURANCE - Claims workflow */}
              {activeSection === 'insurance' && activeClaim && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">Identify source</h2>
                      <button className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium">
                        Complete
                      </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
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
                          className={`flex items-center justify-between w-full px-4 py-2 rounded text-sm ${
                            idx < 2 ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{step.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
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
                    <div className="mb-4">
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
                      Delete insurance claim</button>
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
                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-2xl font-bold">{activeSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div><span className="font-medium">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-6'} inline-block`}>
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
                      className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>
                </div>
                );
              })()}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <button 
                    onClick={() => alert('Showing Auto-chase settings')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium mb-4"
                  >
                    <Settings className="w-4 h-4" />
                    Auto-chase
                  </button>
                  <button 
                    onClick={() => alert('Showing General settings')}
                    className="flex items-center gap-2 px-4 py-2 border rounded text-sm mb-4 hover:bg-slate-50"
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
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">- Dry riser(s) contract renewal</span>
                      <button 
                        onClick={() => alert('Add contract first - feature coming soon')}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Add contract first
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">- Dry riser (annual pressure test)</span>
                      <button 
                        onClick={() => alert('Add contractor first - feature coming soon')}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Add contractor first
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">- Dry riser (6-monthly inspection)</span>
                      <button 
                        onClick={() => alert('Finish set-up first to enable auto-chase')}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Finish set-up first
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
                        onClick={() => alert('Add another Terrorism insurance feature coming soon')}
                        className="bps-blue-text text-sm hover:underline"
                      >
                        Add another Terrorism insurance
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

          {/* ASSET REGISTER TAB */}
          {activeTab === 'asset-register' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Asset register</h2>
                <button 
                  onClick={() => alert('Add asset register item - feature coming soon')}
                  className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add item
                </button>
              </div>
              <h3 className="font-medium mb-4">Assets</h3>
              <div className="text-slate-500">None</div>
            </div>
          )}
          
          {activeTab === 'oand-ms' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">O&Ms</h2>
                <button 
                  onClick={() => alert('Upload O&M document - feature coming soon')}
                  className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload document
                </button>
              </div>
              <div className="text-slate-500">No O&M documents</div>
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Notes</h2>
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
                  className="bps-blue px-6 py-2 rounded-lg  text-sm font-medium"
                >
                  Save notes
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // UNITS section
    if (activeSection === 'units') {
      const units = blockData[selectedBlock]?.units || [];
      const occupiedCount = units.filter(u => u.residentName).length;
      const vacantCount = units.filter(u => !u.residentName).length;
      
      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Units</h2>
              {units.length > 0 && (
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-slate-600">Total: <strong>{units.length}</strong></span>
                  <span className="text-green-600">Occupied: <strong>{occupiedCount}</strong></span>
                  <span className="text-slate-500">Vacant: <strong>{vacantCount}</strong></span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setBulkImportPreview([]);
                  setBulkImportError('');
                  setModalType('bulk-import-units');
                  setShowModal(true);
                }}
                className="border border-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50"
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
                className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add unit
              </button>
            </div>
          </div>
          
          {units.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No units yet</p>
              <p className="text-sm mt-1">Add units like Flat 1, Flat 2, Penthouse, etc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{unit.type} {unit.number}</h3>
                      {unit.floor && <div className="text-xs text-slate-500">Floor: {unit.floor}</div>}
                      {unit.bedrooms && <div className="text-xs text-slate-500">{unit.bedrooms} bed</div>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setUnitForm(unit);
                          setCurrentSetupKey(unit.id);
                          setModalType('edit-unit');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete ${unit.type} ${unit.number}?`)) {
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
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    {unit.residentName ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{unit.residentName}</span>
                          {unit.isOwner ? (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Owner</span>
                          ) : (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Tenant</span>
                          )}
                        </div>
                        {unit.residentEmail && (
                          <div className="text-xs text-slate-600 truncate">📧 {unit.residentEmail}</div>
                        )}
                        {unit.residentPhone && (
                          <div className="text-xs text-slate-600">📞 {unit.residentPhone}</div>
                        )}
                        {unit.moveInDate && (
                          <div className="text-xs text-slate-500 mt-1">
                            Move-in: {new Date(unit.moveInDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-slate-400 italic">Vacant</div>
                    )}
                    {unit.notes && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                        {unit.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // CORRESPONDENCE section
    if (activeSection === 'correspondence') {
      const correspondences = blockData[selectedBlock]?.correspondences || [];
      
      // Filter by direction
      let filtered = correspondences;
      if (correspondenceFilter === 'incoming') {
        filtered = correspondences.filter(c => c.direction === 'Incoming');
      } else if (correspondenceFilter === 'outgoing') {
        filtered = correspondences.filter(c => c.direction === 'Outgoing');
      }
      
      // Filter by search
      if (correspondenceSearch) {
        const s = correspondenceSearch.toLowerCase();
        filtered = filtered.filter(c => 
          c.subject?.toLowerCase().includes(s) ||
          c.recipientName?.toLowerCase().includes(s) ||
          c.recipientEmail?.toLowerCase().includes(s) ||
          c.content?.toLowerCase().includes(s) ||
          c.unitNumber?.toLowerCase().includes(s)
        );
      }
      
      // Sort by date (newest first)
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      const incomingCount = correspondences.filter(c => c.direction === 'Incoming').length;
      const outgoingCount = correspondences.filter(c => c.direction === 'Outgoing').length;
      
      const typeIcons = {
        'Email': '📧',
        'Letter': '✉️',
        'Phone Call': '📞',
        'Meeting': '🤝',
        'SMS': '💬',
        'Notice': '📋',
        'Other': '📄'
      };
      
      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Correspondence</h2>
              {correspondences.length > 0 && (
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-slate-600">Total: <strong>{correspondences.length}</strong></span>
                  <span className="text-blue-600">📥 Incoming: <strong>{incomingCount}</strong></span>
                  <span className="text-green-600">📤 Outgoing: <strong>{outgoingCount}</strong></span>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setCorrespondenceForm({
                  type: 'Email',
                  direction: 'Outgoing',
                  subject: '',
                  recipientName: '',
                  recipientEmail: '',
                  unitNumber: '',
                  date: new Date().toISOString().split('T')[0],
                  content: '',
                  status: 'Sent',
                  notes: ''
                });
                setModalType('add-correspondence');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New correspondence
            </button>
          </div>
          
          {correspondences.length > 0 && (
            <>
              {/* Filter tabs */}
              <div className="flex gap-6 mb-6 border-b">
                <button 
                  onClick={() => setCorrespondenceFilter('all')}
                  className={`pb-3 px-1 text-sm ${
                    correspondenceFilter === 'all' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
                  }`}
                >
                  All ({correspondences.length})
                </button>
                <button 
                  onClick={() => setCorrespondenceFilter('incoming')}
                  className={`pb-3 px-1 text-sm ${
                    correspondenceFilter === 'incoming' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
                  }`}
                >
                  📥 Incoming ({incomingCount})
                </button>
                <button 
                  onClick={() => setCorrespondenceFilter('outgoing')}
                  className={`pb-3 px-1 text-sm ${
                    correspondenceFilter === 'outgoing' ? 'border-b-2 bps-blue-border font-medium' : 'text-slate-600'
                  }`}
                >
                  📤 Outgoing ({outgoingCount})
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={correspondenceSearch}
                    onChange={(e) => setCorrespondenceSearch(e.target.value)}
                    type="text" 
                    placeholder="Search by subject, recipient, content..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" 
                  />
                </div>
              </div>
            </>
          )}
          
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              {correspondences.length === 0 ? (
                <>
                  <p>No correspondence yet</p>
                  <p className="text-sm mt-1">Track emails, letters, calls, and meetings with residents</p>
                </>
              ) : (
                <p>No correspondence matches your filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(corr => (
                <div key={corr.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-lg">{typeIcons[corr.type] || '📄'}</span>
                        <h3 className="font-medium">{corr.subject || '(No subject)'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          corr.direction === 'Incoming' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {corr.direction === 'Incoming' ? '📥 Incoming' : '📤 Outgoing'}
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                          {corr.type}
                        </span>
                        {corr.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            corr.status === 'Sent' ? 'bg-green-100 text-green-700' :
                            corr.status === 'Received' ? 'bg-blue-100 text-blue-700' :
                            corr.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            corr.status === 'Replied' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {corr.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-2">
                        {corr.direction === 'Incoming' ? 'From: ' : 'To: '}
                        <strong>{corr.recipientName || 'Unknown'}</strong>
                        {corr.recipientEmail && <span className="text-slate-500"> &lt;{corr.recipientEmail}&gt;</span>}
                        {corr.unitNumber && <span className="text-slate-500"> • Unit {corr.unitNumber}</span>}
                      </div>
                      
                      {corr.content && (
                        <div className="text-sm text-slate-700 bg-slate-50 rounded p-3 mb-2 whitespace-pre-wrap">
                          {corr.content}
                        </div>
                      )}
                      
                      {corr.notes && (
                        <div className="text-xs text-slate-500 italic">
                          📝 {corr.notes}
                        </div>
                      )}
                      
                      <div className="text-xs text-slate-400 mt-2">
                        {corr.date ? new Date(corr.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setCorrespondenceForm(corr);
                          setCurrentSetupKey(corr.id);
                          setModalType('edit-correspondence');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this correspondence?')) {
                            const updatedCorr = correspondences.filter(c => c.id !== corr.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                correspondences: updatedCorr
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

    // JOBS/PROJECTS section
    if (activeSection === 'jobs') {
      const jobs = blockData[selectedBlock]?.jobs || [];
      const activeJobs = jobs.filter(j => j.status !== 'Completed');
      const completedJobs = jobs.filter(j => j.status === 'Completed');
      
      const statusColors = {
        'Quote requested': 'bg-yellow-100 text-yellow-700',
        'Quote received': 'bg-blue-100 text-blue-700',
        'Approved': 'bg-purple-100 text-purple-700',
        'In progress': 'bg-orange-100 text-orange-700',
        'Awaiting invoice': 'bg-indigo-100 text-indigo-700',
        'Completed': 'bg-green-100 text-green-700',
        'On hold': 'bg-slate-100 text-slate-700',
        'Cancelled': 'bg-red-100 text-red-700'
      };
      
      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Jobs/projects</h2>
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
              className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New job
            </button>
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No jobs or projects yet</p>
              <p className="text-sm mt-1">Track maintenance, repairs, and improvements</p>
            </div>
          ) : (
            <>
              {activeJobs.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-sm uppercase text-slate-500 mb-3">Active ({activeJobs.length})</h3>
                  <div className="space-y-3">
                    {activeJobs.map(job => (
                      <div key={job.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-lg">{job.title}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[job.status] || 'bg-slate-100 text-slate-700'}`}>
                                {job.status}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                                {job.type}
                              </span>
                            </div>
                            {job.description && (
                              <p className="text-sm text-slate-600 mb-2">{job.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                              {job.location && <div>📍 {job.location}</div>}
                              {job.contractor && <div>👷 {job.contractor}</div>}
                              {job.cost && <div>💰 £{job.cost}</div>}
                              {job.startDate && <div>📅 Start: {new Date(job.startDate).toLocaleDateString('en-GB')}</div>}
                              {job.completionDate && <div>🎯 Target: {new Date(job.completionDate).toLocaleDateString('en-GB')}</div>}
                            </div>
                            {job.notes && (
                              <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                                <strong>Notes:</strong> {job.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <select
                              value={job.status}
                              onChange={async (e) => {
                                const updatedJobs = jobs.map(j => 
                                  j.id === job.id ? { ...j, status: e.target.value } : j
                                );
                                const updatedBlockData = {
                                  ...blockData,
                                  [selectedBlock]: {
                                    ...(blockData[selectedBlock] || {}),
                                    jobs: updatedJobs
                                  }
                                };
                                setBlockData(updatedBlockData);
                                await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                              }}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option>Quote requested</option>
                              <option>Quote received</option>
                              <option>Approved</option>
                              <option>In progress</option>
                              <option>Awaiting invoice</option>
                              <option>Completed</option>
                              <option>On hold</option>
                              <option>Cancelled</option>
                            </select>
                            <button
                              onClick={() => {
                                setJobForm(job);
                                setCurrentSetupKey(job.id);
                                setModalType('edit-job');
                                setShowModal(true);
                              }}
                              className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete "${job.title}"?`)) {
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
                </div>
              )}
              
              {completedJobs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase text-slate-500 mb-3">Completed ({completedJobs.length})</h3>
                  <div className="space-y-3">
                    {completedJobs.map(job => (
                      <div key={job.id} className="bg-white border rounded-lg p-4 opacity-60">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-lg line-through">{job.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                ✓ {job.status}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                                {job.type}
                              </span>
                            </div>
                            {job.description && (
                              <p className="text-sm text-slate-600 mb-2">{job.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                              {job.contractor && <div>👷 {job.contractor}</div>}
                              {job.cost && <div>💰 £{job.cost}</div>}
                              {job.completionDate && <div>✅ Completed: {new Date(job.completionDate).toLocaleDateString('en-GB')}</div>}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete "${job.title}"?`)) {
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
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // PORTAL section
    if (activeSection === 'portal') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Portal</h2>
          <div className="bg-white border rounded-lg p-8 text-center">
            <DoorOpen className="w-16 h-16 mx-auto mb-4 bps-blue-text" />
            <h3 className="text-lg font-semibold mb-2">Resident Portal</h3>
            <p className="text-sm text-slate-600 mb-4">Access the resident-facing portal at:</p>
            <a 
              href="https://www.myblockonline.co.uk/rel3/BlockLogin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bps-blue-text hover:underline font-medium"
            >
              myblockonline.co.uk
            </a>
          </div>
        </div>
      );
    }

    // O&Ms section
    if (activeSection === 'oms') {
      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Operations & Maintenance</h2>
            <button 
              onClick={() => alert('Upload O&M document - feature coming soon')}
              className="bps-blue px-4 py-2 rounded-lg flex items-center gap-2  text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload document
            </button>
          </div>
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p>No O&M documents yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p>Select an item from the left</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-600">Loading...</div>;
  }

  const currentBlock = blocks.find(b => b.id === selectedBlock);
  const subNavItems = renderSubNav();

  const getBadgeColor = (item) => {
    if (item.badgeColor === 'yellow') return 'bg-yellow-500';
    if (item.badgeColor === 'green') return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; }
        .bps-blue { background-color: #3B82F6 !important; color: white !important; }
        .bps-blue:hover { background-color: #2563EB !important; }
        .bps-blue-text { color: #3B82F6 !important; }
        .bps-blue-text:hover { color: #2563EB !important; }
        .bps-blue-border { border-color: #3B82F6 !important; }
        .bps-blue-bg-circle { background-color: #2563EB !important; }
        .hover-bps-border:hover { border-color: #3B82F6 !important; }
        .hover-bps-text:hover { color: #2563EB !important; }
      `}</style>

      {/* Left Main Navigation */}
      <div className="w-52 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 border-2 border-white rounded flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold">BPS PRO</div>
          </div>
          <div className="text-xs text-slate-400">Block Property Solutions</div>
          <div className="text-sm font-medium mt-1">
 {typeof window !== 'undefined' && window.__bps_user_email}
</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>👑</span> Admin
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.__bps_logout) {
  window.__bps_logout();
      }
            }}
            className="mt-2 w-full text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2 py-1 rounded"
          >
            Log Out
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Home Button - Always visible */}
          <button
            onClick={() => {
              setShowAllBlocks(true);
              setActiveSection('home');
              setActiveSubItem(null);
              setActiveSubSubItem(null);
              setActiveClaim(null);
              setActiveTab('home');
            }}
            className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
              showAllBlocks ? 'bg-slate-700' : 'hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </div>
          </button>

          {/* Other sections - Only show when a block is selected */}
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
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
                  isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && item.badgeColor === 'multi' && (
                  <div className="flex items-center gap-1">
                    <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">1</span>
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>
                  </div>
                )}
                {item.badge && item.badgeColor !== 'multi' && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>
                )}
                {item.complete && <CheckCircle className="w-4 h-4 text-green-500" />}
              </button>
            );
          })}

          {/* Residents section - Only show when a block is selected */}
          {!showAllBlocks && selectedBlock && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs text-slate-500 uppercase tracking-wide">Residents</div>
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
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
                      isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>}
                  </button>
                );
              })}
            </>
          )}

          {/* Block info section - Only show when a block is selected */}
          {!showAllBlocks && selectedBlock && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs text-slate-500 uppercase tracking-wide">Block info</div>
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
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
                      isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>}
                  </button>
                );
              })}
            </>
          )}

          {/* Settings section - Only show when a block is selected */}
          {!showAllBlocks && selectedBlock && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs text-slate-500 uppercase tracking-wide">Settings</div>
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
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
                      isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
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

        {/* All blocks selector - Only show when a block is selected */}
        {!showAllBlocks && selectedBlock && (
          <div className="border-t border-slate-700 p-3">
            <div className="text-xs text-slate-500 mb-2">All blocks</div>
            <button 
              onClick={() => {
                setShowAllBlocks(true);
                setActiveSection('home');
              }}
              className="flex items-center justify-between w-full px-3 py-2 bg-slate-700 rounded text-sm hover:bg-slate-600"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span className="truncate">{currentBlock?.shortName}</span>
              </div>
              {(() => {
                const currentBlockData = blockData[selectedBlock] || { tasks: [] };
                const taskCount = currentBlockData.tasks?.length || 0;
                return taskCount > 0 ? (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{taskCount}</span>
                ) : (
                  <span className="bg-slate-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
                );
              })()}
            </button>
          </div>
        )}
      </div>

      {/* Middle Sidebar */}
      {subNavItems.length > 0 && (
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4">
              {activeSection === 'hs' ? 'Health & Safety' : 
               activeSection === 'utilities' ? 'Utilities' : 
               activeSection === 'insurance' ? 'Insurance' :
               activeSection === 'documents' ? 'Documents' :
               activeSection === 'issues' ? 'Reported issues/complaints' : 'Section'}
            </h2>

            {activeSection === 'issues' && (
              <div className="flex gap-3 mb-4">
                <button className="bps-blue-text text-xs hover:underline">Recipient settings</button>
                <button className="bps-blue px-3 py-1.5 rounded flex items-center gap-2  text-xs font-medium">
                  <Plus className="w-3 h-3" />
                  New issue or complaint
                </button>
              </div>
            )}

            <p className="text-xs text-slate-500 uppercase mb-3 tracking-wide">Select</p>
            
            {activeSection === 'insurance' && subNavItems.map((item, idx) => {
              const showCategory = idx === 0 || subNavItems[idx - 1].category !== item.category;
              return (
                <React.Fragment key={`${item.category}-${item.id}`}>
                  {showCategory && (
                    <div className="text-xs text-slate-500 uppercase mb-2 mt-4 tracking-wide">{item.category}</div>
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
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
                      activeSubItem?.id === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{item.name || 'Item'}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                        activeSubItem?.id === item.id 
                          ? item.badgeColor === 'yellow' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                          : item.badgeColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
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
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm mb-1 ${
                  activeSubItem?.id === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                    activeSubItem?.id === item.id ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.complete && <CheckCircle className="w-4 h-4 text-green-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          {showAllBlocks ? (
            <h1 className="text-lg font-bold">All Blocks</h1>
          ) : (
            <h1 className="text-lg font-bold">
              {currentBlock?.name}
            </h1>
          )}
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <button 
              onClick={() => alert('Presentation mode coming soon!')}
              className="hover-bps-text flex items-center gap-1"
            >
              📺 Pres. mode
            </button>
            <button 
              onClick={() => alert('Request a feature: Email keanu@blockpropertysolutions.co.uk')}
              className="hover-bps-text flex items-center gap-1"
            >
              👤 Req. feature
            </button>
            <button 
              onClick={() => alert('Help: Contact 0800 001 6646 or info@blockpropertysolutions.co.uk')}
              className="hover-bps-text flex items-center gap-1"
            >
              ❓ Help
            </button>
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to log out?')) {
                  alert('You have been logged out');
                }
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              🚪 Log out
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          {renderContent()}
        </div>
      </div>

      {/* Setup Modal */}
      {showModal && modalType === 'setup' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Finish set-up</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frequency *</label>
                <select 
                  value={setupForm.frequency}
                  onChange={(e) => setSetupForm({...setupForm, frequency: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Next due by *</label>
                <input 
                  value={setupForm.nextDue}
                  onChange={(e) => setSetupForm({...setupForm, nextDue: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assigned to</label>
                <input 
                  value={setupForm.assignedTo}
                  onChange={(e) => setSetupForm({...setupForm, assignedTo: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Name of contractor or person" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auto-chase</label>
                <select 
                  value={setupForm.autoChase}
                  onChange={(e) => setSetupForm({...setupForm, autoChase: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option>Disabled</option>
                  <option>7 days before</option>
                  <option>14 days before</option>
                  <option>30 days before</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
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
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add new block</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Block name *</label>
                <input 
                  value={newBlockForm.name}
                  onChange={(e) => setNewBlockForm({...newBlockForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Riverside Apartments" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short name (for sidebar) *</label>
                <input 
                  value={newBlockForm.shortName}
                  onChange={(e) => setNewBlockForm({...newBlockForm, shortName: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Riverside Apt" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input 
                  value={newBlockForm.address}
                  onChange={(e) => setNewBlockForm({...newBlockForm, address: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Full address" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height category</label>
                <select 
                  value={newBlockForm.height}
                  onChange={(e) => setNewBlockForm({...newBlockForm, height: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option>Under 11m</option>
                  <option>11m - 18m</option>
                  <option>Over 18m</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
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
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task title *</label>
                <input 
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Schedule fire alarm test" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Add details about this task..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due date</label>
                <input 
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({...newTaskForm, dueDate: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
            <div className="flex gap-3 mt-6">
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
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Responsible Person</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input 
                  value={rpForm.name}
                  onChange={(e) => setRpForm({...rpForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Full name" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <input 
                  value={rpForm.role}
                  onChange={(e) => setRpForm({...rpForm, role: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Property Manager, Director" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  value={rpForm.email}
                  onChange={(e) => setRpForm({...rpForm, email: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="email@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  value={rpForm.phone}
                  onChange={(e) => setRpForm({...rpForm, phone: e.target.value})}
                  type="tel" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="0800 000 0000" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setRpForm({ name: '', role: '', email: '', phone: '' });
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add meter reading</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input 
                  value={meterReadingForm.date}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, date: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reading *</label>
                <input 
                  value={meterReadingForm.reading}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, reading: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., 12345 kWh" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={meterReadingForm.notes}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Optional notes" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setMeterReadingForm({ date: '', reading: '', notes: '' });
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New issue or complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input 
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Broken communal door" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  value={issueForm.location}
                  onChange={(e) => setIssueForm({...issueForm, location: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Ground floor lobby, Flat 3" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Describe the issue..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit block details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Block name *</label>
                <input 
                  value={editBlockForm.name}
                  onChange={(e) => setEditBlockForm({...editBlockForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short name (sidebar/header) *</label>
                <input 
                  value={editBlockForm.shortName}
                  onChange={(e) => setEditBlockForm({...editBlockForm, shortName: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input 
                  value={editBlockForm.address}
                  onChange={(e) => setEditBlockForm({...editBlockForm, address: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height category</label>
                <select 
                  value={editBlockForm.height}
                  onChange={(e) => setEditBlockForm({...editBlockForm, height: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option>Under 11m</option>
                  <option>11m - 18m</option>
                  <option>Over 18m</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Correspondence Modal */}
      {showModal && (modalType === 'add-correspondence' || modalType === 'edit-correspondence') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{modalType === 'edit-correspondence' ? 'Edit correspondence' : 'New correspondence'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select 
                    value={correspondenceForm.type}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Email</option>
                    <option>Letter</option>
                    <option>Phone Call</option>
                    <option>Meeting</option>
                    <option>SMS</option>
                    <option>Notice</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Direction *</label>
                  <select 
                    value={correspondenceForm.direction}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, direction: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Service charge update, Maintenance notice" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {correspondenceForm.direction === 'Incoming' ? 'From (Name)' : 'To (Name)'}
                  </label>
                  <input 
                    value={correspondenceForm.recipientName}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, recipientName: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    placeholder="Recipient name" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit number</label>
                  <input 
                    value={correspondenceForm.unitNumber}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, unitNumber: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    placeholder="e.g., Flat 5" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email address</label>
                <input 
                  value={correspondenceForm.recipientEmail}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, recipientEmail: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="email@example.com" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input 
                    value={correspondenceForm.date}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, date: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select 
                    value={correspondenceForm.status}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, status: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Sent</option>
                    <option>Received</option>
                    <option>Pending</option>
                    <option>Replied</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Content/Message</label>
                <textarea 
                  value={correspondenceForm.content}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, content: e.target.value})}
                  rows="5"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="The email body, letter content, or call summary..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Internal notes</label>
                <textarea 
                  value={correspondenceForm.notes}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Private notes (not part of the message)..." 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setCurrentSetupKey(null);
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!correspondenceForm.subject) {
                    alert('Please enter a subject');
                    return;
                  }
                  
                  const existingCorr = blockData[selectedBlock]?.correspondences || [];
                  let updatedCorr;
                  
                  if (modalType === 'edit-correspondence' && currentSetupKey) {
                    updatedCorr = existingCorr.map(c => 
                      c.id === currentSetupKey ? { ...correspondenceForm, id: currentSetupKey } : c
                    );
                  } else {
                    const newCorr = {
                      id: String(Date.now()),
                      ...correspondenceForm,
                      createdAt: new Date().toISOString()
                    };
                    updatedCorr = [...existingCorr, newCorr];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      correspondences: updatedCorr
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setCurrentSetupKey(null);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm"
              >
                {modalType === 'edit-correspondence' ? 'Save changes' : 'Add correspondence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Units Modal */}
      {showModal && modalType === 'bulk-import-units' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Bulk import units</h3>
            
            {bulkImportPreview.length === 0 ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-sm mb-2">📋 How to import from Excel/Sheets</h4>
                  <ol className="text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                    <li>Open your Excel or Google Sheets</li>
                    <li>Make sure the columns match the format below</li>
                    <li><strong>Select all your data</strong> (including header row) and copy (Ctrl+C / Cmd+C)</li>
                    <li><strong>Paste it into the box below</strong> (Ctrl+V / Cmd+V)</li>
                    <li>Click "Preview"</li>
                  </ol>
                </div>

                <div className="bg-slate-50 border rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-xs mb-2">Required columns (in any order):</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                    <div>• <strong>Type</strong> (Flat, Penthouse, etc.)</div>
                    <div>• <strong>Number</strong> (1, 2A, etc.) <span className="text-red-500">*required</span></div>
                    <div>• <strong>Floor</strong></div>
                    <div>• <strong>Bedrooms</strong></div>
                    <div>• <strong>Resident Name</strong></div>
                    <div>• <strong>Email</strong></div>
                    <div>• <strong>Phone</strong></div>
                    <div>• <strong>Move-in Date</strong></div>
                    <div>• <strong>Is Owner</strong> (yes/no)</div>
                    <div>• <strong>Notes</strong></div>
                  </div>
                </div>

                <div className="mb-4">
                  <button 
                    onClick={() => {
                      const sampleData = `Type	Number	Floor	Bedrooms	Resident Name	Email	Phone	Move-in Date	Is Owner	Notes
Flat	1	Ground	2	John Smith	john@example.com	07700 900123	2024-01-15	yes	
Flat	2	Ground	1					no	Vacant
Flat	3	1st	2	Sarah Williams	sarah@example.com	07700 900789	2023-09-01	no	
Penthouse	PH1	5th	3	Jane Doe	jane@example.com	07700 900456	2023-06-01	no	Long-term tenant`;
                      const textarea = document.getElementById('bulk-paste-area');
                      if (textarea) textarea.value = sampleData;
                    }}
                    className="text-xs bps-blue-text hover:underline"
                  >
                    📋 Insert sample data to test
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Paste your spreadsheet data here:</label>
                  <textarea 
                    id="bulk-paste-area"
                    rows="10"
                    className="w-full border rounded-lg px-3 py-2 text-xs font-mono"
                    placeholder="Paste copied cells from Excel or Google Sheets here..."
                  />
                  <p className="text-xs text-slate-500 mt-2">💡 Tip: When you paste from Excel/Sheets, columns are separated by tabs automatically</p>
                </div>
                
                {bulkImportError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    ❌ {bulkImportError}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setBulkImportPreview([]);
                      setBulkImportError('');
                    }}
                    className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const text = document.getElementById('bulk-paste-area')?.value || '';
                      if (!text.trim()) {
                        setBulkImportError('Please paste some data first');
                        return;
                      }
                      
                      setBulkImportError('');
                      
                      try {
                        const lines = text.split(/\r?\n/).filter(line => line.trim());
                        if (lines.length < 2) {
                          setBulkImportError('Need a header row and at least one data row');
                          return;
                        }
                        
                        // Auto-detect separator: tab (from Excel/Sheets paste) or comma (CSV)
                        const firstLine = lines[0];
                        const separator = firstLine.includes('\t') ? '\t' : ',';
                        
                        const parseLine = (line) => {
                          if (separator === '\t') {
                            return line.split('\t').map(v => v.trim());
                          }
                          // Handle CSV with quotes
                          const result = [];
                          let current = '';
                          let inQuotes = false;
                          for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                              inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                              result.push(current.trim());
                              current = '';
                            } else {
                              current += char;
                            }
                          }
                          result.push(current.trim());
                          return result;
                        };
                        
                        const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
                        const rows = lines.slice(1).map(line => {
                          const values = parseLine(line);
                          const row = {};
                          headers.forEach((h, i) => {
                            row[h] = values[i] || '';
                          });
                          return row;
                        });
                        
                        const parsed = rows.map((row, idx) => {
                          const getField = (...keys) => {
                            for (const key of keys) {
                              if (row[key] !== undefined && row[key] !== '') return row[key];
                            }
                            return '';
                          };
                          
                          return {
                            id: String(Date.now() + idx),
                            type: getField('type') || 'Flat',
                            number: getField('number', 'unit number', 'unit'),
                            floor: getField('floor'),
                            bedrooms: getField('bedrooms', 'beds'),
                            residentName: getField('resident name', 'resident', 'name'),
                            residentEmail: getField('email'),
                            residentPhone: getField('phone', 'telephone'),
                            moveInDate: getField('move-in date', 'movein date', 'move in date'),
                            isOwner: ['yes', 'y', 'true', '1', 'owner'].includes(String(getField('is owner', 'owner', 'is owner (yes/no)')).toLowerCase()),
                            notes: getField('notes'),
                            valid: !!getField('number', 'unit number', 'unit')
                          };
                        });
                        
                        const validRows = parsed.filter(r => r.valid);
                        if (validRows.length === 0) {
                          setBulkImportError('No valid units found. Make sure you have a "Number" column with values.');
                          return;
                        }
                        
                        setBulkImportPreview(parsed);
                      } catch (err) {
                        setBulkImportError('Error parsing data: ' + err.message);
                      }
                    }}
                    className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm"
                  >
                    Preview
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm">
                    Found <strong>{bulkImportPreview.filter(r => r.valid).length}</strong> valid units
                    {bulkImportPreview.filter(r => !r.valid).length > 0 && (
                      <span className="text-red-600">
                        {' '}• <strong>{bulkImportPreview.filter(r => !r.valid).length}</strong> invalid (missing number)
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="border rounded-lg overflow-hidden mb-4 max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Number</th>
                        <th className="text-left p-2">Floor</th>
                        <th className="text-left p-2">Beds</th>
                        <th className="text-left p-2">Resident</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Owner</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkImportPreview.map((row, idx) => (
                        <tr key={idx} className={`border-t ${!row.valid ? 'bg-red-50' : ''}`}>
                          <td className="p-2">{row.type}</td>
                          <td className="p-2 font-medium">{row.number || '⚠️ Missing'}</td>
                          <td className="p-2">{row.floor}</td>
                          <td className="p-2">{row.bedrooms}</td>
                          <td className="p-2">{row.residentName || <span className="text-slate-400">Vacant</span>}</td>
                          <td className="p-2 truncate max-w-[150px]">{row.residentEmail}</td>
                          <td className="p-2">{row.isOwner ? '✓' : '-'}</td>
                          <td className="p-2 text-center">
                            {row.valid ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setBulkImportPreview([]);
                      setBulkImportError('');
                    }}
                    className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setBulkImportPreview([]);
                      setBulkImportError('');
                    }}
                    className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      const validUnits = bulkImportPreview.filter(r => r.valid).map(({valid, ...unit}) => unit);
                      
                      if (validUnits.length === 0) {
                        alert('No valid units to import');
                        return;
                      }
                      
                      const existingUnits = blockData[selectedBlock]?.units || [];
                      const updatedUnits = [...existingUnits, ...validUnits];
                      
                      updatedUnits.sort((a, b) => {
                        const aNum = parseInt(a.number) || 999;
                        const bNum = parseInt(b.number) || 999;
                        if (aNum !== bNum) return aNum - bNum;
                        return String(a.number).localeCompare(String(b.number));
                      });
                      
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          units: updatedUnits
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                      
                      alert(`✅ Successfully imported ${validUnits.length} units!`);
                      setShowModal(false);
                      setBulkImportPreview([]);
                      setBulkImportError('');
                    }}
                    className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm"
                  >
                    Import {bulkImportPreview.filter(r => r.valid).length} units
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Unit Modal */}
      {showModal && (modalType === 'add-unit' || modalType === 'edit-unit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{modalType === 'edit-unit' ? 'Edit unit' : 'Add new unit'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select 
                    value={unitForm.type}
                    onChange={(e) => setUnitForm({...unitForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Flat</option>
                    <option>Apartment</option>
                    <option>Penthouse</option>
                    <option>House</option>
                    <option>Maisonette</option>
                    <option>Duplex</option>
                    <option>Studio</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number/Name *</label>
                  <input 
                    value={unitForm.number}
                    onChange={(e) => setUnitForm({...unitForm, number: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    placeholder="e.g., 1, 2A, Penthouse" 
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
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    placeholder="e.g., Ground, 1st, 2nd" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input 
                    value={unitForm.bedrooms}
                    onChange={(e) => setUnitForm({...unitForm, bedrooms: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    placeholder="e.g., 1, 2, 3" 
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Resident details (optional)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Resident name</label>
                    <input 
                      value={unitForm.residentName}
                      onChange={(e) => setUnitForm({...unitForm, residentName: e.target.value})}
                      type="text" 
                      className="w-full border rounded-lg px-3 py-2 text-sm" 
                      placeholder="Leave blank if vacant" 
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={unitForm.isOwner}
                        onChange={(e) => setUnitForm({...unitForm, isOwner: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">This resident is the owner (not tenant)</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                      value={unitForm.residentEmail}
                      onChange={(e) => setUnitForm({...unitForm, residentEmail: e.target.value})}
                      type="email" 
                      className="w-full border rounded-lg px-3 py-2 text-sm" 
                      placeholder="resident@example.com" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input 
                      value={unitForm.residentPhone}
                      onChange={(e) => setUnitForm({...unitForm, residentPhone: e.target.value})}
                      type="tel" 
                      className="w-full border rounded-lg px-3 py-2 text-sm" 
                      placeholder="0800 000 0000" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Move-in date</label>
                    <input 
                      value={unitForm.moveInDate}
                      onChange={(e) => setUnitForm({...unitForm, moveInDate: e.target.value})}
                      type="date" 
                      className="w-full border rounded-lg px-3 py-2 text-sm" 
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={unitForm.notes}
                  onChange={(e) => setUnitForm({...unitForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Any additional notes about this unit..." 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setCurrentSetupKey(null);
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!unitForm.number) {
                    alert('Please enter a unit number/name');
                    return;
                  }
                  
                  const existingUnits = blockData[selectedBlock]?.units || [];
                  let updatedUnits;
                  
                  if (modalType === 'edit-unit' && currentSetupKey) {
                    updatedUnits = existingUnits.map(u => 
                      u.id === currentSetupKey ? { ...unitForm, id: currentSetupKey } : u
                    );
                  } else {
                    const newUnit = {
                      id: String(Date.now()),
                      ...unitForm,
                      createdAt: new Date().toISOString()
                    };
                    updatedUnits = [...existingUnits, newUnit];
                  }
                  
                  // Sort units by number
                  updatedUnits.sort((a, b) => {
                    const aNum = parseInt(a.number) || 999;
                    const bNum = parseInt(b.number) || 999;
                    if (aNum !== bNum) return aNum - bNum;
                    return a.number.localeCompare(b.number);
                  });
                  
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
                  setCurrentSetupKey(null);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm"
              >
                {modalType === 'edit-unit' ? 'Save changes' : 'Add unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {showModal && (modalType === 'add-job' || modalType === 'edit-job') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{modalType === 'edit-job' ? 'Edit job' : 'New job/project'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job title *</label>
                <input 
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Replace communal door, Repaint hallway" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select 
                    value={jobForm.type}
                    onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Maintenance</option>
                    <option>Repair</option>
                    <option>Improvement</option>
                    <option>Cleaning</option>
                    <option>Inspection</option>
                    <option>Compliance</option>
                    <option>Emergency</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select 
                    value={jobForm.status}
                    onChange={(e) => setJobForm({...jobForm, status: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Quote requested</option>
                    <option>Quote received</option>
                    <option>Approved</option>
                    <option>In progress</option>
                    <option>Awaiting invoice</option>
                    <option>Completed</option>
                    <option>On hold</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Describe the work to be done..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  value={jobForm.location}
                  onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Ground floor lobby, Roof, Flat 5" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contractor/Supplier</label>
                <input 
                  value={jobForm.contractor}
                  onChange={(e) => setJobForm({...jobForm, contractor: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Company or person doing the work" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Cost (£)</label>
                <input 
                  value={jobForm.cost}
                  onChange={(e) => setJobForm({...jobForm, cost: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., 1500" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start date</label>
                  <input 
                    value={jobForm.startDate}
                    onChange={(e) => setJobForm({...jobForm, startDate: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target completion</label>
                  <input 
                    value={jobForm.completionDate}
                    onChange={(e) => setJobForm({...jobForm, completionDate: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={jobForm.notes}
                  onChange={(e) => setJobForm({...jobForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Additional notes..." 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setCurrentSetupKey(null);
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!jobForm.title) {
                    alert('Please enter a job title');
                    return;
                  }
                  
                  const existingJobs = blockData[selectedBlock]?.jobs || [];
                  let updatedJobs;
                  
                  if (modalType === 'edit-job' && currentSetupKey) {
                    updatedJobs = existingJobs.map(j => 
                      j.id === currentSetupKey ? { ...jobForm, id: currentSetupKey } : j
                    );
                  } else {
                    const newJob = {
                      id: String(Date.now()),
                      ...jobForm,
                      createdAt: new Date().toISOString()
                    };
                    updatedJobs = [...existingJobs, newJob];
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
                  setCurrentSetupKey(null);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm"
              >
                {modalType === 'edit-job' ? 'Save changes' : 'Add job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Managing Agent Modal */}
      {showModal && modalType === 'edit-agent' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit managing agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Managing agent name *</label>
                <input 
                  value={editAgentForm.name}
                  onChange={(e) => setEditAgentForm({...editAgentForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g., Block Property Solutions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea 
                  value={editAgentForm.address}
                  onChange={(e) => setEditAgentForm({...editAgentForm, address: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Full business address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property manager *</label>
                <input 
                  value={editAgentForm.manager}
                  onChange={(e) => setEditAgentForm({...editAgentForm, manager: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input 
                  value={editAgentForm.email}
                  onChange={(e) => setEditAgentForm({...editAgentForm, email: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="manager@example.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-slate-50"
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
                className="flex-1 bps-blue rounded-lg px-4 py-2 text-sm "
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
