import React, { useMemo } from 'react';
import { ExamCard } from '../types';
import { format, parseISO } from 'date-fns';
import { Calendar, Users, FileText } from 'lucide-react';

interface TimetableSummaryProps {
  examCards: ExamCard[];
}

const TimetableSummary: React.FC<TimetableSummaryProps> = ({ examCards }) => {
  const scheduledExams = useMemo(() => {
    return examCards.filter(card => card.date && card.startTime);
  }, [examCards]);

  const unscheduledExams = useMemo(() => {
    return examCards.filter(card => !card.date || !card.startTime);
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

  const totalStudents = useMemo(() => {
    return scheduledExams.reduce((total, exam) => total + exam.studentCount, 0);
  }, [scheduledExams]);

  const totalDuration = useMemo(() => {
    return scheduledExams.reduce((total, exam) => total + exam.duration, 0);
  }, [scheduledExams]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Timetable Summary</h2>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Scheduled Exams</div>
            <div className="text-2xl font-bold text-blue-900">{scheduledExams.length}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Unscheduled</div>
            <div className="text-2xl font-bold text-orange-900">{unscheduledExams.length}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Students</div>
            <div className="text-2xl font-bold text-green-900">{totalStudents}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Total Duration</div>
            <div className="text-2xl font-bold text-purple-900">{formatDuration(totalDuration)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {scheduledExams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No exams scheduled yet</p>
            <p className="text-sm">Drag exam cards to the calendar to schedule them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(date => (
              <div key={date} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {examsByDate[date]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(exam => (
                      <div key={exam.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {exam.paperName}
                          </div>
                          <div className="text-xs text-gray-600">
                            #{exam.paperNumber} • {exam.className}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {exam.startTime} - {exam.endTime}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center space-x-1">
                            <Users size={10} />
                            <span>{exam.studentCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {unscheduledExams.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <FileText size={16} />
              <span>Unscheduled Exams</span>
            </h3>
            <div className="space-y-2">
              {unscheduledExams.map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {exam.paperName}
                    </div>
                    <div className="text-xs text-gray-600">
                      #{exam.paperNumber} • {exam.className}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-700">
                      Not scheduled
                    </div>
                    <div className="text-xs text-gray-600 flex items-center space-x-1">
                      <Users size={10} />
                      <span>{exam.studentCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableSummary;
