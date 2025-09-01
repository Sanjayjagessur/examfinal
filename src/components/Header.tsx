import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, Save, FolderOpen, FileDown, ChevronDown, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onExportStudentTimetable: () => void;
  onExportExamSummary: () => void;
  onExportStudentTimetableWord?: () => void;
  onExportExamSummaryWord?: () => void;
  onExportInvigilationSchedule?: () => void;
  onExportEducatorSchedule?: () => void;
  onSaveTimetable?: () => void;
  onLoadTimetable?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onExportStudentTimetable,
  onExportExamSummary,
  onExportStudentTimetableWord,
  onExportExamSummaryWord,
  onExportInvigilationSchedule,
  onExportEducatorSchedule,
  onSaveTimetable,
  onLoadTimetable,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Jagesaurus</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Save/Load Buttons */}
          {onSaveTimetable && (
            <button
              onClick={onSaveTimetable}
              className="flex items-center space-x-1 px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              title="Save Timetable"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          )}

          {onLoadTimetable && (
            <button
              onClick={onLoadTimetable}
              className="flex items-center space-x-1 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              title="Load Timetable"
            >
              <FolderOpen size={14} />
              <span>Load</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
              title="Export Options"
            >
              <Download size={14} />
              <span>Export</span>
              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Student Timetable
                  </div>
                  <button
                    onClick={() => {
                      onExportStudentTimetable();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileText size={14} />
                    <span>PDF Format</span>
                  </button>
                  {onExportStudentTimetableWord && (
                    <button
                      onClick={() => {
                        onExportStudentTimetableWord();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FileDown size={14} />
                      <span>Word Format</span>
                    </button>
                  )}
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                                     <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                     Exam Summary
                   </div>
                   <button
                     onClick={() => {
                       onExportExamSummary();
                       setShowExportMenu(false);
                     }}
                     className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                   >
                     <Download size={14} />
                     <span>PDF Format</span>
                   </button>
                   {onExportExamSummaryWord && (
                     <button
                       onClick={() => {
                         onExportExamSummaryWord();
                         setShowExportMenu(false);
                       }}
                       className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                     >
                       <FileDown size={14} />
                       <span>Word Format</span>
                     </button>
                   )}
                   
                   <div className="border-t border-gray-100 my-1"></div>
                   
                   <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                     Invigilation
                   </div>
                   {onExportInvigilationSchedule && (
                     <button
                       onClick={() => {
                         onExportInvigilationSchedule();
                         setShowExportMenu(false);
                       }}
                       className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                     >
                       <Download size={14} />
                       <span>Schedule (Word)</span>
                     </button>
                   )}
                   {onExportEducatorSchedule && (
                     <button
                       onClick={() => {
                         onExportEducatorSchedule();
                         setShowExportMenu(false);
                       }}
                       className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                     >
                       <FileDown size={14} />
                       <span>Educator Schedule (Word)</span>
                     </button>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </header>
  );
};

export default Header;
