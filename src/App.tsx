import React, { useState, useEffect } from 'react';
import { ExamCard } from './types';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ExamCardManager from './components/ExamCardManager';
import CalendarCanvas from './components/CalendarCanvas';
import TimetablePreview from './components/TimetablePreview';
import { generateStudentTimetablePDF, generateExamSummaryPDF } from './utils/export';



function App() {
  const [examCards, setExamCards] = useState<ExamCard[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Check if running in Electron environment
  const isElectron = window.electronAPI !== undefined;

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (isElectron) {
        // Try to auto-load from Electron
        try {
          const result = await window.electronAPI.autoLoad();
          if (result.success && result.data) {
            setExamCards(result.data.examCards || []);
            return;
          }
        } catch (error) {
          console.log('Auto-load failed, falling back to localStorage');
        }
      }
      
      // Fallback to localStorage
      const savedExamCards = localStorage.getItem('examCards');
      if (savedExamCards) {
        setExamCards(JSON.parse(savedExamCards));
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
    const newExamCard: ExamCard = {
      ...examCard,
      id: uuidv4(),
      color: getRandomColor()
    };
    setExamCards(prev => [...prev, newExamCard]);
  };

  const updateExamCard = (id: string, updates: Partial<ExamCard>) => {
    setExamCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const deleteExamCard = (id: string) => {
    setExamCards(prev => prev.filter(card => card.id !== id));
  };



  const exportStudentTimetable = () => {
    generateStudentTimetablePDF(examCards);
  };

  const exportExamSummary = () => {
    generateExamSummaryPDF(examCards);
  };

  const exportToWord = () => {
    // For now, we'll use the PDF export as a placeholder
    // In a real implementation, you would use a library like docx or similar
    alert('Word export functionality will be implemented. For now, please use the PDF export.');
    generateStudentTimetablePDF(examCards);
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
        setExamCards(result.data.examCards || []);
        alert(`Timetable loaded successfully from: ${result.filePath}`);
      } else {
        alert(`Load failed: ${result.message}`);
      }
    } catch (error) {
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
        onSaveTimetable={isElectron ? saveTimetable : undefined}
        onLoadTimetable={isElectron ? loadTimetable : undefined}
      />
      
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Exam Card Management */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <ExamCardManager
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
    </div>
  );
}

export default App;
