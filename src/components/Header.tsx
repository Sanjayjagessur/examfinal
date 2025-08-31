import React from 'react';
import { Download, FileText, Save, FolderOpen } from 'lucide-react';

interface HeaderProps {
  onExportStudentTimetable: () => void;
  onExportExamSummary: () => void;
  onSaveTimetable?: () => void;
  onLoadTimetable?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onExportStudentTimetable,
  onExportExamSummary,
  onSaveTimetable,
  onLoadTimetable
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Jagesaurus</h1>
        </div>

        <div className="flex items-center space-x-3">
          {onSaveTimetable && (
            <button
              onClick={onSaveTimetable}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              title="Save Timetable"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          )}

          {onLoadTimetable && (
            <button
              onClick={onLoadTimetable}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Load Timetable"
            >
              <FolderOpen size={16} />
              <span>Load</span>
            </button>
          )}

          <button
            onClick={onExportStudentTimetable}
            className="flex items-center space-x-2 btn-primary"
            title="Export Student Timetable"
          >
            <FileText size={16} />
            <span>Student Timetable</span>
          </button>

          <button
            onClick={onExportExamSummary}
            className="flex items-center space-x-2 btn-secondary"
            title="Export Exam Summary"
          >
            <Download size={16} />
            <span>Exam Summary</span>
          </button>
        </div>
      </div>


    </header>
  );
};

export default Header;
