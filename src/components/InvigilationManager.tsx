import React, { useState, useMemo, useEffect } from 'react';
import { ExamCard } from '../types';
import { 
  Educator, 
  Room, 
  Hall, 
  InvigilationSession, 
  InvigilationSettings,
  InvigilationConflict,
  InvigilatorAbsence
} from '../types/invigilation';
import { 
  DEFAULT_INVIGILATION_SETTINGS,
  generateInvigilationSessions,
  assignEducatorsToSessions,
  validateInvigilationSchedule,
  generateFairnessReport,
  FairnessReport
} from '../utils/invigilation';
import { v4 as uuidv4 } from 'uuid';
import { 
  Users, 
  Building2, 
  Calendar, 
  Settings, 
  Upload, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  X
} from 'lucide-react';
import Papa from 'papaparse';

interface InvigilationManagerProps {
  examCards: ExamCard[];
  onExportInvigilationSchedule: (sessions: InvigilationSession[]) => void;
}

const InvigilationManager: React.FC<InvigilationManagerProps> = ({
  examCards,
  onExportInvigilationSchedule
}) => {
  const [educators, setEducators] = useState<Educator[]>(() => {
    const saved = localStorage.getItem('invigilation_educators');
    return saved ? JSON.parse(saved) : [];
  });
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('invigilation_rooms');
    return saved ? JSON.parse(saved) : [];
  });
  const [halls, setHalls] = useState<Hall[]>(() => {
    const saved = localStorage.getItem('invigilation_halls');
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<InvigilationSettings>(() => {
    const saved = localStorage.getItem('invigilation_settings');
    return saved ? JSON.parse(saved) : DEFAULT_INVIGILATION_SETTINGS;
  });
  const [sessions, setSessions] = useState<InvigilationSession[]>([]);
  const [conflicts, setConflicts] = useState<InvigilationConflict[]>([]);
  const [fairnessReport, setFairnessReport] = useState<FairnessReport | null>(null);
  const [activeTab, setActiveTab] = useState<'educators' | 'rooms' | 'settings' | 'schedule' | 'report' | 'absences'>('educators');
  const [absences, setAbsences] = useState<InvigilatorAbsence[]>(() => {
    const saved = localStorage.getItem('invigilation_absences');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<InvigilatorAbsence | null>(null);
  const [newAbsence, setNewAbsence] = useState({
    educatorId: '',
    date: '',
    reason: 'illness' as 'illness' | 'emergency' | 'personal' | 'other',
    description: ''
  });

  const scheduledExams = useMemo(() => {
    return examCards.filter(exam => exam.date && exam.startTime && exam.endTime);
  }, [examCards]);

  // Save educators to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_educators', JSON.stringify(educators));
  }, [educators]);

  // Save rooms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_rooms', JSON.stringify(rooms));
  }, [rooms]);

  // Save halls to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_halls', JSON.stringify(halls));
  }, [halls]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_settings', JSON.stringify(settings));
  }, [settings]);

  // Save absences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_absences', JSON.stringify(absences));
  }, [absences]);

  // Report a new absence
  const reportAbsence = () => {
    if (!newAbsence.educatorId || !newAbsence.date) {
      alert('Please select an educator and date');
      return;
    }

    const educator = educators.find(e => e.id === newAbsence.educatorId);
    if (!educator) return;

    const newAbsenceRecord: InvigilatorAbsence = {
      id: uuidv4(),
      educatorId: newAbsence.educatorId,
      educatorName: educator.name,
      date: newAbsence.date,
      reason: newAbsence.reason,
      description: newAbsence.description,
      status: 'pending',
      reportedAt: new Date().toISOString(),
      reviewedAt: undefined,
      reviewedBy: undefined,
      replacementEducatorId: undefined,
      replacementEducatorName: undefined,
      sessionsAffected: sessions
        .filter(s => s.educatorId === newAbsence.educatorId && s.examDate === newAbsence.date)
        .map(s => s.id)
    };

    setAbsences(prev => [...prev, newAbsenceRecord]);
    
    // Reset form
    setNewAbsence({
      educatorId: '',
      date: '',
      reason: 'illness',
      description: ''
    });
    
    setShowAbsenceModal(false);
    alert(`Absence reported for ${educator.name} on ${newAbsence.date}`);
  };

  // Approve an absence and find replacement
  const approveAbsence = (absenceId: string) => {
    const absence = absences.find(a => a.id === absenceId);
    if (!absence) return;

    // Find available replacement educators
    const availableEducators = educators.filter(educator => {
      // Check if educator is available on the absence date
      const hasConflict = sessions.some(session => 
        session.educatorId === educator.id && 
        session.examDate === absence.date
      );
      return !hasConflict;
    });

    if (availableEducators.length === 0) {
      alert('No available replacement educators found for this date.');
      return;
    }

    // For now, select the first available educator
    const replacement = availableEducators[0];
    
    // Update absence status
    const updatedAbsence: InvigilatorAbsence = {
      ...absence,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      replacementEducatorId: replacement.id,
      replacementEducatorName: replacement.name
    };

    setAbsences(prev => prev.map(a => a.id === absenceId ? updatedAbsence : a));
    
    // Update affected sessions with replacement educator
    setSessions(prev => prev.map(session => {
      if (absence.sessionsAffected.includes(session.id)) {
        return {
          ...session,
          educatorId: replacement.id,
          educatorName: replacement.name
        };
      }
      return session;
    }));

    alert(`Absence approved. ${replacement.name} will replace ${absence.educatorName} on ${absence.date}`);
  };

  // Reject an absence
  const rejectAbsence = (absenceId: string) => {
    const updatedAbsence: InvigilatorAbsence = {
      ...absences.find(a => a.id === absenceId)!,
      status: 'rejected',
      reviewedAt: new Date().toISOString()
    };

    setAbsences(prev => prev.map(a => a.id === absenceId ? updatedAbsence : a));
    alert('Absence rejected.');
  };

  // Remove an absence
  const removeAbsence = (absenceId: string) => {
    if (window.confirm('Are you sure you want to remove this absence?')) {
      setAbsences(prev => prev.filter(a => a.id !== absenceId));
    }
  };

  // Handle educator CSV upload
  const handleEducatorUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Uploading file:', file.name);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log('CSV parsing results:', results);
        
        const uploadedEducators: Educator[] = results.data.map((row: any) => ({
          id: uuidv4(),
          name: row.name || row.Name || row.NAME || '',
          phone: row.phone || row.Phone || row.PHONE || '',
          email: '',
          department: '',
          maxSessionsPerDay: 4,
          preferredTimes: [],
          unavailableDates: []
        })).filter(educator => educator.name.trim() !== '');

        console.log('Parsed educators:', uploadedEducators);
        setEducators(uploadedEducators);
        
        if (uploadedEducators.length > 0) {
          alert(`Successfully uploaded ${uploadedEducators.length} educators!`);
        } else {
          alert('No educators found in the CSV file. Please check the format.');
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file: ' + error.message);
      }
    });
  };

  // Handle room CSV upload
  const handleRoomUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const uploadedRooms: Room[] = [];
        const uploadedHalls: Hall[] = [];

        results.data.forEach((row: any) => {
          const roomData = {
            id: uuidv4(),
            name: row.name || row.Name || row.NAME || '',
            capacity: parseInt(row.capacity || row.Capacity || row.CAPACITY || '0'),
            type: (row.type || row.Type || row.TYPE || 'classroom') as 'classroom' | 'laboratory' | 'hall',
            building: row.building || row.Building || row.BUILDING || '',
            floor: row.floor || row.Floor || row.FLOOR || '',
            isAvailable: (row.isAvailable || row.IsAvailable || row.ISAVAILABLE || 'true') === 'true'
          };

          if (roomData.name.trim() === '') return;

          if (roomData.type === 'hall') {
            uploadedHalls.push({
              ...roomData,
              type: 'hall',
              sections: row.sections ? row.sections.split(',').map((s: string) => s.trim()) : [],
              requiresMultipleInvigilators: (row.requiresMultipleInvigilators || row.RequiresMultipleInvigilators || 'true') === 'true',
              invigilatorsPerSection: parseInt(row.invigilatorsPerSection || row.InvigilatorsPerSection || '1')
            });
          } else {
            uploadedRooms.push(roomData);
          }
        });

        setRooms(uploadedRooms);
        setHalls(uploadedHalls);
      },
      error: (error) => {
        alert('Error parsing CSV file: ' + error.message);
      }
    });
  };

  // Handle absence CSV upload
  const handleAbsenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const uploadedAbsences: InvigilatorAbsence[] = results.data.map((row: any) => {
          const educator = educators.find(e => e.id === row.educatorId);
          return {
            id: uuidv4(),
            educatorId: row.educatorId || '',
            educatorName: educator?.name || 'Unknown Educator',
            date: row.date || '',
            reason: (row.reason || 'other') as 'illness' | 'emergency' | 'personal' | 'other',
            description: row.description || '',
            status: 'pending' as const,
            reportedAt: new Date().toISOString(),
            reviewedAt: undefined,
            reviewedBy: undefined,
            replacementEducatorId: undefined,
            replacementEducatorName: undefined,
            sessionsAffected: []
          };
        }).filter(absence => absence.educatorId && absence.date);
        
        setAbsences(uploadedAbsences);
        alert(`Successfully uploaded ${uploadedAbsences.length} absences!`);
      },
      error: (error) => {
        alert('Error parsing CSV file: ' + error.message);
      }
    });
  };

  // Generate invigilation schedule
  const generateSchedule = () => {
    if (scheduledExams.length === 0) {
      alert('No exams scheduled. Please schedule exams first.');
      return;
    }

    if (educators.length === 0) {
      alert('No educators uploaded. Please upload educators first.');
      return;
    }

    if (rooms.length === 0 && halls.length === 0) {
      alert('No rooms uploaded. Please upload rooms first.');
      return;
    }

    try {
      // Generate assignments for all scheduled exams
      const assignments = scheduledExams.map(exam => 
        generateInvigilationSessions(exam, [...rooms, ...halls], settings)
      );

      // Assign educators to sessions
      const { sessions: generatedSessions, conflicts: assignmentConflicts } = 
        assignEducatorsToSessions(assignments, educators, settings);

      // Validate the schedule
      const validationConflicts = validateInvigilationSchedule(generatedSessions, educators, settings);

      setSessions(generatedSessions);
      setConflicts([...assignmentConflicts, ...validationConflicts]);

      // Generate fairness report
      const report = generateFairnessReport(generatedSessions, educators);
      setFairnessReport(report);

      if (generatedSessions.length > 0) {
        alert(`Invigilation schedule generated successfully! ${generatedSessions.length} sessions created. Fairness score: ${report.fairnessScore.toFixed(1)}/100`);
      }
    } catch (error) {
      alert('Error generating schedule: ' + (error as Error).message);
    }
  };

  // Export invigilation schedule
  const exportSchedule = () => {
    if (sessions.length === 0) {
      alert('No invigilation schedule to export. Please generate a schedule first.');
      return;
    }
    onExportInvigilationSchedule(sessions);
  };

  // Clear all invigilation data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all invigilation data? This cannot be undone.')) {
      setEducators([]);
      setRooms([]);
      setHalls([]);
      setSessions([]);
      setConflicts([]);
      setFairnessReport(null);
      setSettings(DEFAULT_INVIGILATION_SETTINGS);
      setAbsences([]);
      
      // Clear localStorage
      localStorage.removeItem('invigilation_educators');
      localStorage.removeItem('invigilation_rooms');
      localStorage.removeItem('invigilation_halls');
      localStorage.removeItem('invigilation_settings');
      localStorage.removeItem('invigilation_absences');
      
      alert('All invigilation data cleared successfully!');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Invigilation Manager</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateSchedule}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              title="Generate Invigilation Schedule"
            >
              <Calendar size={14} />
              <span>Generate Schedule</span>
            </button>
                         <button
               onClick={exportSchedule}
               className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
               title="Export Schedule"
             >
               <Download size={14} />
               <span>Export</span>
             </button>
             <button
               onClick={clearAllData}
               className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
               title="Clear All Data"
             >
               <AlertTriangle size={14} />
               <span>Clear Data</span>
             </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-900">{educators.length}</div>
            <div className="text-blue-600">Educators</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-medium text-green-900">{rooms.length + halls.length}</div>
            <div className="text-green-600">Rooms</div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="font-medium text-purple-900">{scheduledExams.length}</div>
            <div className="text-purple-600">Scheduled Exams</div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="font-medium text-orange-900">{sessions.length}</div>
            <div className="text-orange-600">Invigilation Sessions</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={generateSchedule}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              title="Generate Invigilation Schedule"
            >
              <Calendar size={16} />
              <span>Generate Schedule</span>
            </button>
            <button
              onClick={exportSchedule}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
              title="Export Schedule"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
          <button
            onClick={clearAllData}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
            title="Clear All Data"
          >
            <AlertTriangle size={16} />
            <span>Clear Data</span>
          </button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'educators', label: 'Educators', icon: Users, color: 'blue' },
            { id: 'rooms', label: 'Rooms', icon: Building2, color: 'green' },
            { id: 'settings', label: 'Settings', icon: Settings, color: 'purple' },
            { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'orange' },
            { id: 'report', label: 'Fairness Report', icon: CheckCircle, color: 'emerald' },
            { id: 'absences', label: 'Absences', icon: Clock, color: 'red' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const colorClasses = {
              blue: isActive ? 'border-blue-500 text-blue-600' : 'hover:text-blue-600 hover:border-blue-300',
              green: isActive ? 'border-green-500 text-green-600' : 'hover:text-green-600 hover:border-green-300',
              purple: isActive ? 'border-purple-500 text-purple-600' : 'hover:text-purple-600 hover:border-purple-300',
              orange: isActive ? 'border-orange-500 text-orange-600' : 'hover:text-orange-600 hover:border-orange-300',
              emerald: isActive ? 'border-emerald-500 text-emerald-600' : 'hover:text-emerald-600 hover:border-emerald-300',
              red: isActive ? 'border-red-500 text-red-600' : 'hover:text-red-600 hover:border-red-300'
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? colorClasses[tab.color as keyof typeof colorClasses]
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'educators' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Upload Educators</h3>
                  <p className="text-blue-700 text-sm">
                    Upload a CSV file with educator information. Required columns: name, phone
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleEducatorUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all duration-200"
              />
            </div>

            {educators.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Uploaded Educators ({educators.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Sessions/Day</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {educators.slice(0, 10).map((educator) => (
                        <tr key={educator.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{educator.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educator.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educator.department || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educator.maxSessionsPerDay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {educators.length > 10 && (
                    <div className="px-6 py-3 text-sm text-gray-500 bg-gray-50">
                      Showing first 10 of {educators.length} educators
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Upload Rooms & Halls</h3>
                  <p className="text-green-700 text-sm">
                    Upload a CSV file with room information. Required columns: name, capacity, type (classroom/laboratory/hall)
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleRoomUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all duration-200"
              />
            </div>

            {(rooms.length > 0 || halls.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rooms.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Classrooms & Laboratories ({rooms.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rooms.slice(0, 5).map((room) => (
                            <tr key={room.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{room.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.building || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rooms.length > 5 && (
                        <div className="px-6 py-3 text-sm text-gray-500 bg-gray-50">
                          Showing first 5 of {rooms.length} rooms
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {halls.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Halls ({halls.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invigilators</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {halls.slice(0, 5).map((hall) => (
                            <tr key={hall.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hall.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hall.capacity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hall.sections?.length || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hall.invigilatorsPerSection}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {halls.length > 5 && (
                        <div className="px-6 py-3 text-sm text-gray-500 bg-gray-50">
                          Showing first 5 of {halls.length} halls
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Invigilation Settings</h3>
                  <p className="text-purple-700 text-sm">Configure invigilation parameters and constraints</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.sessionDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) || 30 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      min="15"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Break Between Sessions (minutes)</label>
                    <input
                      type="number"
                      value={settings.breakBetweenSessions}
                      onChange={(e) => setSettings(prev => ({ ...prev, breakBetweenSessions: parseInt(e.target.value) || 15 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      min="5"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Sessions per Educator per Day</label>
                    <input
                      type="number"
                      value={settings.maxSessionsPerEducatorPerDay}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxSessionsPerEducatorPerDay: parseInt(e.target.value) || 4 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      min="1"
                      max="8"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Consecutive Sessions</label>
                    <input
                      type="number"
                      value={settings.maxConsecutiveSessions}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxConsecutiveSessions: parseInt(e.target.value) || 2 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      min="1"
                      max="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Students per Invigilator (Classrooms)</label>
                    <input
                      type="number"
                      value={settings.classroomInvigilatorRatio}
                      onChange={(e) => setSettings(prev => ({ ...prev, classroomInvigilatorRatio: parseInt(e.target.value) || 30 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      min="20"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Students per Invigilator (Halls)</label>
                    <input
                      type="number"
                      value={settings.hallInvigilatorRatio}
                      onChange={(e) => setSettings(prev => ({ ...prev, hallInvigilatorRatio: parseInt(e.target.value) || 50 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      min="30"
                      max="100"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-purple-100 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Current Configuration Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600 font-medium">Session:</span> {settings.sessionDuration} min
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Break:</span> {settings.breakBetweenSessions} min
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Max/Day:</span> {settings.maxSessionsPerEducatorPerDay}
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Consecutive:</span> {settings.maxConsecutiveSessions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Calendar size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Invigilation Schedule</h3>
                <p className="text-gray-600 mb-4">Upload educators and rooms, then click "Generate Schedule" to create invigilation assignments</p>
                <button
                  onClick={generateSchedule}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Generate Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Conflicts Summary */}
                {conflicts.length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle size={20} className="text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-900">Schedule Conflicts ({conflicts.length})</h3>
                        <p className="text-red-700 text-sm">Some conflicts were detected during schedule generation</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {conflicts.slice(0, 3).map((conflict, index) => (
                        <div key={index} className="text-sm text-red-700 bg-red-100 p-3 rounded-lg">
                          {conflict.message}
                        </div>
                      ))}
                      {conflicts.length > 3 && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                          ... and {conflicts.length - 3} more conflicts
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule Summary */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Schedule Generated Successfully</h3>
                      <p className="text-green-700 text-sm">
                        {sessions.length} invigilation sessions created for {scheduledExams.length} exams
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{sessions.length}</div>
                      <div className="text-sm text-green-700">Total Sessions</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{scheduledExams.length}</div>
                      <div className="text-sm text-green-700">Exams Covered</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{educators.length}</div>
                      <div className="text-sm text-green-700">Educators Assigned</div>
                    </div>
                  </div>
                </div>

                {/* Sessions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-orange-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Invigilation Sessions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.slice(0, 20).map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.examDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.sessionStartTime} - {session.sessionEndTime}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.educatorName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.examName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.roomName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.studentCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sessions.length > 20 && (
                      <div className="px-6 py-3 text-sm text-gray-500 bg-gray-50">
                        Showing first 20 of {sessions.length} sessions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

         {activeTab === 'report' && (
           <div className="space-y-6">
             {!fairnessReport ? (
               <div className="text-center py-12 text-gray-500">
                 <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fairness Report Available</h3>
                <p className="text-gray-600 mb-4">Generate an invigilation schedule first to see the fairness report and educator statistics</p>
                <button
                  onClick={generateSchedule}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Generate Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Fairness Score */}
                <div className={`p-6 rounded-xl border-2 ${
                  fairnessReport.fairnessScore >= 80 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                  fairnessReport.fairnessScore >= 60 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' :
                  'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Overall Fairness Score</h3>
                      <p className="text-gray-600">Distribution fairness across all educators</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${
                        fairnessReport.fairnessScore >= 80 ? 'text-green-600' :
                        fairnessReport.fairnessScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {fairnessReport.fairnessScore.toFixed(1)}/100
                      </div>
                      <div className={`text-sm font-medium ${
                        fairnessReport.fairnessScore >= 80 ? 'text-green-600' :
                        fairnessReport.fairnessScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {fairnessReport.fairnessScore >= 80 ? 'Excellent' :
                         fairnessReport.fairnessScore >= 60 ? 'Good' :
                         fairnessReport.fairnessScore >= 40 ? 'Fair' : 'Poor'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{fairnessReport.totalSessions}</div>
                    <div className="text-sm text-blue-700 font-medium">Total Sessions</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-600">{fairnessReport.averageSessionsPerEducator.toFixed(1)}</div>
                    <div className="text-sm text-green-700 font-medium">Avg per Educator</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">{fairnessReport.morningSessionsTotal}</div>
                    <div className="text-sm text-purple-700 font-medium">Morning Sessions</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                    <div className="text-3xl font-bold text-orange-600">{fairnessReport.afternoonSessionsTotal}</div>
                    <div className="text-sm text-orange-700 font-medium">Afternoon Sessions</div>
                  </div>
                </div>

                {/* Session Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{fairnessReport.mostSessions}</div>
                      <div className="text-sm text-gray-600">Most sessions by one educator</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{fairnessReport.leastSessions}</div>
                      <div className="text-sm text-gray-600">Least sessions by one educator</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{fairnessReport.mostSessions - fairnessReport.leastSessions}</div>
                      <div className="text-sm text-gray-600">Difference</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {fairnessReport.recommendations.length > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle size={20} className="text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-yellow-900">Recommendations</h3>
                    </div>
                    <ul className="space-y-2">
                      {fairnessReport.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-start bg-yellow-100 p-3 rounded-lg">
                          <span className="mr-2 text-yellow-600">•</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Educator Statistics Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-emerald-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Educator Statistics</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Morning</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Afternoon</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fairnessReport.educatorStats
                          .sort((a, b) => b.totalSessions - a.totalSessions)
                          .map((stat) => {
                            const balance = Math.abs(stat.morningSessions - stat.afternoonSessions);
                            const balanceColor = balance === 0 ? 'text-green-600' : 
                                               balance <= 1 ? 'text-yellow-600' : 'text-red-600';
                            
                            return (
                              <tr key={stat.educatorId} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {stat.educatorName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {stat.totalSessions}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {stat.morningSessions}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {stat.afternoonSessions}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${balanceColor}`}>
                                  {balance === 0 ? 'Perfect' : 
                                   balance <= 1 ? 'Good' : 'Unbalanced'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'absences' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Clock size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Manage Invigilator Absences</h3>
                    <p className="text-red-700 text-sm">
                      Report and manage invigilator absences. System will automatically find replacements.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAbsenceModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Report Absence
                </button>
              </div>

              {/* Absence Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{absences.length}</div>
                  <div className="text-sm text-red-700">Total Absences</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {absences.filter(a => a.status === 'pending').length}
                  </div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-green-600">
                    {absences.filter(a => a.status === 'approved').length}
                  </div>
                  <div className="text-sm text-green-700">Approved</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-gray-600">
                    {absences.filter(a => a.status === 'rejected').length}
                  </div>
                  <div className="text-sm text-gray-700">Rejected</div>
                </div>
              </div>
            </div>

            {/* Absences Table */}
            {absences.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-red-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-red-900">Absence Reports</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Affected</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {absences.map((absence) => (
                        <tr key={absence.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {absence.educatorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{absence.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="capitalize">{absence.reason}</span>
                            {absence.description && (
                              <div className="text-xs text-gray-400 mt-1">{absence.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              absence.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : absence.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {absence.status === 'pending' ? 'Pending' : 
                               absence.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {absence.sessionsAffected.length} sessions
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {absence.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => approveAbsence(absence.id)}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                  title="Approve and Find Replacement"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => rejectAbsence(absence.id)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Reject Absence"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                            {absence.status === 'approved' && (
                              <div className="text-sm">
                                <div className="text-green-600 font-medium">Replaced by:</div>
                                <div className="text-gray-600">{absence.replacementEducatorName}</div>
                              </div>
                            )}
                            <button
                              onClick={() => removeAbsence(absence.id)}
                              className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-50 ml-2"
                              title="Remove Absence"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Absences State */}
            {absences.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Clock size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Absences Reported</h3>
                <p className="text-gray-600 mb-4">All invigilators are available. Click "Report Absence" to add new absence reports.</p>
              </div>
            )}
          </div>
        )}
       </div>

       {/* Absence Reporting Modal */}
       {showAbsenceModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Report Invigilator Absence</h3>
               <button
                 onClick={() => setShowAbsenceModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Select Educator
                 </label>
                 <select
                   value={newAbsence.educatorId}
                   onChange={(e) => setNewAbsence(prev => ({ ...prev, educatorId: e.target.value }))}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                 >
                   <option value="">Choose an educator...</option>
                   {educators.map(educator => (
                     <option key={educator.id} value={educator.id}>
                       {educator.name}
                     </option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Absence Date
                 </label>
                 <input
                   type="date"
                   value={newAbsence.date}
                   onChange={(e) => setNewAbsence(prev => ({ ...prev, date: e.target.value }))}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Reason
                 </label>
                 <select
                   value={newAbsence.reason}
                   onChange={(e) => setNewAbsence(prev => ({ ...prev, reason: e.target.value as any }))}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                 >
                   <option value="illness">Illness</option>
                   <option value="emergency">Emergency</option>
                   <option value="personal">Personal</option>
                   <option value="other">Other</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Description (Optional)
                 </label>
                 <textarea
                   value={newAbsence.description}
                   onChange={(e) => setNewAbsence(prev => ({ ...prev, description: e.target.value }))}
                   rows={3}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                   placeholder="Provide additional details..."
                 />
               </div>
             </div>

             <div className="flex space-x-3 mt-6">
               <button
                 onClick={() => setShowAbsenceModal(false)}
                 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
               >
                 Cancel
               </button>
               <button
                 onClick={reportAbsence}
                 className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
               >
                 Report Absence
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default InvigilationManager;
