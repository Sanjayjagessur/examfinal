import React, { useState, useEffect } from 'react';
import { ExamCard } from './types';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ExamTableManager from './components/ExamTableManager';
import CalendarCanvas from './components/CalendarCanvas';
import TimetablePreview from './components/TimetablePreview';
import InvigilationScheme from './components/InvigilationScheme';
import AIGuardian from './components/AIGuardian';

import { generateStudentTimetablePDF, generateExamSummaryPDF } from './utils/export';
import { generateStudentTimetableWord, generateExamSummaryWord } from './utils/wordExport';
import { Calendar, Users, Brain } from 'lucide-react';



function App() {
  const [examCards, setExamCards] = useState<ExamCard[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'timetable' | 'invigilation' | 'ai'>('timetable');
  
  // Invigilation state
  const [invigilationEducators, setInvigilationEducators] = useState<any[]>([]);
  const [invigilationRooms, setInvigilationRooms] = useState<any[]>([]);
  const [invigilationExamSessions, setInvigilationExamSessions] = useState<any[]>([]);
  const [invigilationRoomSessions, setInvigilationRoomSessions] = useState<any[]>([]);

  const [isDarkMode, setIsDarkMode] = useState(false);



  // Check if running in Electron environment
  const isElectron = window.electronAPI !== undefined;

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Apply dark mode classes to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);



  // Simple logging for exam cards updates
  useEffect(() => {
    if (examCards.length > 0) {
      console.log('Exam cards updated, count:', examCards.length);
    }
  }, [examCards.length]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (isElectron) {
        // Try to auto-load from Electron
        try {
          const result = await window.electronAPI.autoLoad();
          if (result.success && result.data) {
            console.log('Auto-loading data:', result.data);
            const raw = result.data.examCards;
            const loadedExamCards = Array.isArray(raw)
              ? raw
              : raw && typeof raw === 'object'
                ? Object.values(raw)
                : [];
            
            // Strictly map to ExamCard interface
            const validatedExamCards = loadedExamCards.map((card: any) => ({
              id: card.id || uuidv4(),
              paperName: (card.paperName ?? card.subject ?? '').toString(),
              paperNumber: (card.paperNumber ?? '').toString(),
              className: (card.className ?? '').toString(),
              duration: Number.isFinite(card.duration) ? Number(card.duration) : 60,
              studentCount: Number.isFinite(card.studentCount) ? Number(card.studentCount) : 1,
              startTime: (card.startTime ?? '').toString(),
              endTime: (card.endTime ?? '').toString(),
              date: card.date ? card.date.toString() : undefined,
              session: card.session === 'morning' || card.session === 'afternoon' ? card.session : undefined,
              position: card.position && typeof card.position.x === 'number' && typeof card.position.y === 'number' ? card.position : undefined,
              venue: card.venue ? card.venue.toString() : undefined,
              color: card.color ? card.color.toString() : undefined,
            }));
            
            console.log('Auto-loaded validated exam cards:', validatedExamCards);
            setExamCards(validatedExamCards);
            
            return;
          }
        } catch (error) {
          console.log('Auto-load failed, falling back to localStorage');
        }
      }
      
      // Fallback to localStorage
      const savedExamCards = localStorage.getItem('examCards');
      if (savedExamCards) {
        try {
          const parsed = JSON.parse(savedExamCards);
          const parsedCards = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === 'object'
              ? Object.values(parsed)
              : [];
          console.log('Loading from localStorage:', parsedCards);
          
          // Strictly map to ExamCard interface
          const validatedExamCards = parsedCards.map((card: any) => ({
            id: card.id || uuidv4(),
            paperName: (card.paperName ?? card.subject ?? '').toString(),
            paperNumber: (card.paperNumber ?? '').toString(),
            className: (card.className ?? '').toString(),
            duration: Number.isFinite(card.duration) ? Number(card.duration) : 60,
            studentCount: Number.isFinite(card.studentCount) ? Number(card.studentCount) : 1,
            startTime: (card.startTime ?? '').toString(),
            endTime: (card.endTime ?? '').toString(),
            date: card.date ? card.date.toString() : undefined,
            session: card.session === 'morning' || card.session === 'afternoon' ? card.session : undefined,
            position: card.position && typeof card.position.x === 'number' && typeof card.position.y === 'number' ? card.position : undefined,
            venue: card.venue ? card.venue.toString() : undefined,
            color: card.color ? card.color.toString() : undefined,
          }));
          
          console.log('localStorage validated exam cards:', validatedExamCards);
          setExamCards(validatedExamCards);
        } catch (error) {
          console.error('Error parsing localStorage data:', error);
          setExamCards([]);
        }
      }
    };

    loadData();
  }, [isElectron]);

  // Auto-save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      const dataToSave = { examCards, lastSaved: new Date().toISOString() };
      
      if (isElectron) {
        try {
          await window.electronAPI.autoSave(dataToSave);
        } catch (error) {
          console.log('Auto-save failed, falling back to localStorage');
        }
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('examCards', JSON.stringify(examCards));
    };

    saveData();
  }, [examCards, isElectron]);

  const addExamCard = (examCard: Omit<ExamCard, 'id'>) => {
    console.log('Adding new exam card:', examCard);
    const newExamCard: ExamCard = {
      ...examCard,
      id: uuidv4(),
      color: getRandomColor()
    };
    console.log('Created exam card with ID:', newExamCard.id);
    setExamCards(prev => {
      const updated = [...prev, newExamCard];
      console.log('Updated exam cards array:', updated);
      return updated;
    });
  };

  const updateExamCard = (id: string, updates: Partial<ExamCard>) => {
    setExamCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const deleteExamCard = (id: string) => {
    setExamCards(prev => prev.filter(card => card.id !== id));
  };

  const deleteAllExamCards = () => {
    if (window.confirm('Are you sure you want to delete ALL exam cards? This action cannot be undone.')) {
      setExamCards([]);
      alert('All exam cards have been deleted.');
    }
  };



  const exportStudentTimetable = () => {
    generateStudentTimetablePDF(examCards);
  };

  const exportExamSummary = () => {
    generateExamSummaryPDF(examCards);
  };

  const exportToWord = async () => {
    try {
      await generateStudentTimetableWord(examCards);
    } catch (error) {
      alert('Error generating Word document: ' + error);
    }
  };

  const exportExamSummaryToWord = async () => {
    try {
      await generateExamSummaryWord(examCards);
    } catch (error) {
      alert('Error generating Word document: ' + error);
    }
  };



  const saveTimetable = async () => {
    if (!isElectron) {
      alert('Save functionality is only available in the desktop application.');
      return;
    }

    try {
      const dataToSave = { 
        examCards, 
        lastSaved: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const result = await window.electronAPI.saveTimetable(dataToSave);
      if (result.success) {
        alert(`Timetable saved successfully to: ${result.filePath}`);
      } else {
        alert(`Save failed: ${result.message}`);
      }
    } catch (error) {
      alert('Error saving timetable: ' + error);
    }
  };

  const loadTimetable = async () => {
    if (!isElectron) {
      alert('Load functionality is only available in the desktop application.');
      return;
    }

    try {
      const result = await window.electronAPI.loadTimetable();
      if (result.success && result.data) {
        console.log('Loading timetable data:', result.data);
        
        // Ensure we have the correct data structure (ExamCard)
        const raw = result.data.examCards;
        const loadedExamCards = Array.isArray(raw)
          ? raw
          : raw && typeof raw === 'object'
            ? Object.values(raw)
            : [];
        console.log('Loaded exam cards:', loadedExamCards);
        
        // Strictly map to ExamCard interface
        const validatedExamCards = loadedExamCards.map((card: any) => ({
          id: card.id || uuidv4(),
          paperName: (card.paperName ?? card.subject ?? '').toString(),
          paperNumber: (card.paperNumber ?? '').toString(),
          className: (card.className ?? '').toString(),
          duration: Number.isFinite(card.duration) ? Number(card.duration) : 60,
          studentCount: Number.isFinite(card.studentCount) ? Number(card.studentCount) : 1,
          startTime: (card.startTime ?? '').toString(),
          endTime: (card.endTime ?? '').toString(),
          date: card.date ? card.date.toString() : undefined,
          session: card.session === 'morning' || card.session === 'afternoon' ? card.session : undefined,
          position: card.position && typeof card.position.x === 'number' && typeof card.position.y === 'number' ? card.position : undefined,
          venue: card.venue ? card.venue.toString() : undefined,
          color: card.color ? card.color.toString() : undefined,
        }));
        
        console.log('Validated exam cards:', validatedExamCards);
        
        // Set exam cards directly
        setExamCards(validatedExamCards);
        
        alert(`Timetable loaded successfully from: ${result.filePath}\nLoaded ${validatedExamCards.length} exam cards.`);
      } else {
        alert(`Load failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      alert('Error loading timetable: ' + error);
    }
  };

  const getRandomColor = () => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="min-h-screen bg-gray-50">
             <Header 
         onExportStudentTimetable={exportStudentTimetable}
         onExportExamSummary={exportExamSummary}
         onExportStudentTimetableWord={exportToWord}
         onExportExamSummaryWord={exportExamSummaryToWord}
         onSaveTimetable={isElectron ? saveTimetable : undefined}
         onLoadTimetable={isElectron ? loadTimetable : undefined}
         onDeleteAllExamCards={deleteAllExamCards}
         isDarkMode={isDarkMode}
         onToggleDarkMode={toggleDarkMode}
       />
      
      {/* Main Navigation Tabs */}
      <div className="pt-16">
                 <div className="bg-white border-b border-gray-200">
           <nav className="flex space-x-8 px-6">
                           <button
                onClick={() => setActiveTab('timetable')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'timetable'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar size={16} />
                <span>Exam Timetable</span>
              </button>
              
              <button
                onClick={() => setActiveTab('invigilation')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invigilation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={16} />
                <span>Invigilation Scheme</span>
              </button>
              
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Brain size={16} />
                <span>AI Guardian</span>
              </button>
              
             
             
           </nav>
           
           
         </div>

        {/* Tab Content */}
        {activeTab === 'timetable' && (
          <div className="flex h-screen">
            {/* Left Sidebar - Exam Card Management */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                             <ExamTableManager
                 examCards={examCards}
                 onAddExamCard={addExamCard}
                 onUpdateExamCard={updateExamCard}
                 onDeleteExamCard={deleteExamCard}
               />
            </div>

            {/* Center - Calendar Canvas */}
            <div className="flex-1 overflow-hidden">
              <CalendarCanvas
                examCards={examCards}
                onUpdateExamCard={updateExamCard}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* Right Sidebar - Timetable Preview */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <TimetablePreview 
                examCards={examCards}
                onExportPDF={exportStudentTimetable}
                onExportWord={exportToWord}
              />
            </div>
          </div>
        )}

        {activeTab === 'invigilation' && (
          <div className="h-screen">
            <InvigilationScheme 
              examCards={examCards}
              onUpdateEducators={setInvigilationEducators}
              onUpdateRooms={setInvigilationRooms}
              onUpdateExamSessions={setInvigilationExamSessions}
              onUpdateRoomSessions={setInvigilationRoomSessions}
              educators={invigilationEducators}
              rooms={invigilationRooms}
              examSessions={invigilationExamSessions}
              roomSessions={invigilationRoomSessions}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-screen">
            <AIGuardian 
              educators={invigilationEducators}
              rooms={invigilationRooms}
              examSessions={invigilationExamSessions}
              roomSessions={invigilationRoomSessions}
              onUpdateRoomSessions={setInvigilationRoomSessions}
            />
          </div>
        )}


      </div>
    </div>
  );
}

export default App;
