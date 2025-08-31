import React, { useMemo } from 'react';
import { ExamCard } from '../types';
import { format, parseISO } from 'date-fns';
import { FileText, Download, FileDown } from 'lucide-react';

interface TimetablePreviewProps {
  examCards: ExamCard[];
  onExportPDF: () => void;
  onExportWord: () => void;
}

const TimetablePreview: React.FC<TimetablePreviewProps> = ({
  examCards,
  onExportPDF,
  onExportWord
}) => {
  const scheduledExams = useMemo(() => {
    return examCards.filter(card => card.date && card.startTime);
  }, [examCards]);

  const examsByDate = useMemo(() => {
    const grouped: { [key: string]: ExamCard[] } = {};
    scheduledExams.forEach(exam => {
      if (exam.date) {
        if (!grouped[exam.date]) {
          grouped[exam.date] = [];
        }
        grouped[exam.date].push(exam);
      }
    });
    return grouped;
  }, [scheduledExams]);

  const sortedDates = useMemo(() => {
    return Object.keys(examsByDate).sort();
  }, [examsByDate]);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Timetable Preview</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onExportPDF}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
              title="Export to PDF"
            >
              <Download size={12} />
              <span>PDF</span>
            </button>
            <button
              onClick={onExportWord}
              className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
              title="Export to Word"
            >
              <FileDown size={12} />
              <span>Word</span>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {scheduledExams.length} exam{scheduledExams.length !== 1 ? 's' : ''} scheduled
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {scheduledExams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No exams scheduled yet</p>
            <p className="text-sm">Drag exam cards to the calendar to see the preview</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(date => (
              <div key={date} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {examsByDate[date]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(exam => (
                      <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {exam.paperName}
                          </div>
                          <div className="text-sm text-gray-600">
                            #{exam.paperNumber} • {exam.className}
                          </div>
                          {exam.venue && (
                            <div className="text-xs text-gray-500">
                              📍 {exam.venue}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {exam.startTime} - {exam.endTime}
                          </div>
                          <div className="text-xs text-gray-600">
                            {exam.duration} min • {exam.studentCount} students
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetablePreview;
