import React, { useState, useMemo, useEffect } from 'react';
import { ExamCard } from '../types';
import { 
  Educator, 
  Room, 
  Hall, 
  InvigilationSession, 
  InvigilationSettings,
  InvigilationConflict 
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
  MapPin
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
  const [activeTab, setActiveTab] = useState<'educators' | 'rooms' | 'settings' | 'schedule' | 'report'>('educators');

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
      
      // Clear localStorage
      localStorage.removeItem('invigilation_educators');
      localStorage.removeItem('invigilation_rooms');
      localStorage.removeItem('invigilation_halls');
      localStorage.removeItem('invigilation_settings');
      
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'educators', label: 'Educators', icon: Users },
            { id: 'rooms', label: 'Rooms', icon: Building2 },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'report', label: 'Fairness Report', icon: CheckCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'educators' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Upload Educators</h3>
                             <p className="text-blue-700 text-sm mb-3">
                 Upload a CSV file with educator information. Required columns: name, phone
               </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleEducatorUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {educators.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Uploaded Educators ({educators.length})</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {educators.slice(0, 10).map((educator) => (
                                                 <tr key={educator.id}>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{educator.name}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educator.phone || '-'}</td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                  {educators.length > 10 && (
                    <div className="px-6 py-3 text-sm text-gray-500">
                      Showing first 10 of {educators.length} educators
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Upload Rooms</h3>
              <p className="text-green-700 text-sm mb-3">
                Upload a CSV file with room information. Required columns: name, capacity, type (classroom/laboratory/hall)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleRoomUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            {(rooms.length > 0 || halls.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rooms.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Classrooms & Laboratories ({rooms.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rooms.slice(0, 5).map((room) => (
                            <tr key={room.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{room.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {halls.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Halls ({halls.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {halls.slice(0, 5).map((hall) => (
                            <tr key={hall.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hall.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hall.capacity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hall.sections?.length || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Invigilation Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Between Sessions (minutes)</label>
                  <input
                    type="number"
                    value={settings.breakBetweenSessions}
                    onChange={(e) => setSettings(prev => ({ ...prev, breakBetweenSessions: parseInt(e.target.value) || 15 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Sessions per Educator per Day</label>
                  <input
                    type="number"
                    value={settings.maxSessionsPerEducatorPerDay}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxSessionsPerEducatorPerDay: parseInt(e.target.value) || 4 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Consecutive Sessions</label>
                  <input
                    type="number"
                    value={settings.maxConsecutiveSessions}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxConsecutiveSessions: parseInt(e.target.value) || 2 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Students per Invigilator (Classrooms)</label>
                  <input
                    type="number"
                    value={settings.classroomInvigilatorRatio}
                    onChange={(e) => setSettings(prev => ({ ...prev, classroomInvigilatorRatio: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Students per Invigilator (Halls)</label>
                  <input
                    type="number"
                    value={settings.hallInvigilatorRatio}
                    onChange={(e) => setSettings(prev => ({ ...prev, hallInvigilatorRatio: parseInt(e.target.value) || 50 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No invigilation schedule generated yet</p>
                <p className="text-sm">Upload educators and rooms, then click "Generate Schedule"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Conflicts Summary */}
                {conflicts.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <h3 className="font-medium text-red-900">Schedule Conflicts ({conflicts.length})</h3>
                    </div>
                    <div className="space-y-1">
                      {conflicts.slice(0, 3).map((conflict, index) => (
                        <div key={index} className="text-sm text-red-700">
                          {conflict.message}
                        </div>
                      ))}
                      {conflicts.length > 3 && (
                        <div className="text-sm text-red-600">
                          ... and {conflicts.length - 3} more conflicts
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <h3 className="font-medium text-green-900">Schedule Generated Successfully</h3>
                  </div>
                  <div className="text-sm text-green-700">
                    {sessions.length} invigilation sessions created for {scheduledExams.length} exams
                  </div>
                </div>

                {/* Sessions Table */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Invigilation Sessions</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                          <tr key={session.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.examDate}</td>
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
                      <div className="px-6 py-3 text-sm text-gray-500">
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
           <div className="space-y-4">
             {!fairnessReport ? (
               <div className="text-center py-8 text-gray-500">
                 <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
                 <p>No fairness report available</p>
                 <p className="text-sm">Generate an invigilation schedule first to see the fairness report</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {/* Overall Fairness Score */}
                 <div className={`p-4 rounded-lg border ${
                   fairnessReport.fairnessScore >= 80 ? 'bg-green-50 border-green-200' :
                   fairnessReport.fairnessScore >= 60 ? 'bg-yellow-50 border-yellow-200' :
                   'bg-red-50 border-red-200'
                 }`}>
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="font-medium text-gray-900">Overall Fairness Score</h3>
                       <p className="text-sm text-gray-600">Distribution fairness across all educators</p>
                     </div>
                     <div className="text-right">
                       <div className={`text-2xl font-bold ${
                         fairnessReport.fairnessScore >= 80 ? 'text-green-600' :
                         fairnessReport.fairnessScore >= 60 ? 'text-yellow-600' :
                         'text-red-600'
                       }`}>
                         {fairnessReport.fairnessScore.toFixed(1)}/100
                       </div>
                       <div className="text-xs text-gray-500">
                         {fairnessReport.fairnessScore >= 80 ? 'Excellent' :
                          fairnessReport.fairnessScore >= 60 ? 'Good' :
                          fairnessReport.fairnessScore >= 40 ? 'Fair' : 'Poor'}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Summary Statistics */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-blue-50 p-4 rounded-lg">
                     <div className="text-2xl font-bold text-blue-600">{fairnessReport.totalSessions}</div>
                     <div className="text-sm text-blue-700">Total Sessions</div>
                   </div>
                   <div className="bg-green-50 p-4 rounded-lg">
                     <div className="text-2xl font-bold text-green-600">{fairnessReport.averageSessionsPerEducator.toFixed(1)}</div>
                     <div className="text-sm text-green-700">Avg per Educator</div>
                   </div>
                   <div className="bg-purple-50 p-4 rounded-lg">
                     <div className="text-2xl font-bold text-purple-600">{fairnessReport.morningSessionsTotal}</div>
                     <div className="text-sm text-purple-700">Morning Sessions</div>
                   </div>
                   <div className="bg-orange-50 p-4 rounded-lg">
                     <div className="text-2xl font-bold text-orange-600">{fairnessReport.afternoonSessionsTotal}</div>
                     <div className="text-sm text-orange-700">Afternoon Sessions</div>
                   </div>
                 </div>

                 {/* Session Distribution */}
                 <div className="bg-white border border-gray-200 rounded-lg p-4">
                   <h3 className="font-medium text-gray-900 mb-4">Session Distribution</h3>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Most sessions by one educator:</span>
                       <span className="font-medium">{fairnessReport.mostSessions}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span>Least sessions by one educator:</span>
                       <span className="font-medium">{fairnessReport.leastSessions}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span>Difference:</span>
                       <span className="font-medium">{fairnessReport.mostSessions - fairnessReport.leastSessions}</span>
                     </div>
                   </div>
                 </div>

                 {/* Recommendations */}
                 {fairnessReport.recommendations.length > 0 && (
                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                     <h3 className="font-medium text-yellow-900 mb-2">Recommendations</h3>
                     <ul className="space-y-1">
                       {fairnessReport.recommendations.map((recommendation, index) => (
                         <li key={index} className="text-sm text-yellow-800 flex items-start">
                           <span className="mr-2">•</span>
                           {recommendation}
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {/* Educator Statistics Table */}
                 <div>
                   <h3 className="font-medium text-gray-900 mb-3">Educator Statistics</h3>
                   <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                               <tr key={stat.educatorId}>
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
       </div>
     </div>
   );
 };

export default InvigilationManager;
