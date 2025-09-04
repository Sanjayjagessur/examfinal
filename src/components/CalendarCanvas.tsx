import React, { useState, useMemo } from 'react';
import { ExamCard } from '../types';
import DraggableExamCard from './DraggableExamCard';
import { format, addDays, startOfWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarCanvasProps {
  examCards: ExamCard[];
  onUpdateExamCard: (id: string, updates: Partial<ExamCard>) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const CalendarCanvas: React.FC<CalendarCanvasProps> = ({
  examCards,
  onUpdateExamCard,
  selectedDate,
  onDateChange
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 5 }, (_, i) => addDays(start, i)); // Monday to Friday
  }, [currentWeek]);

  const handleDrop = (item: { id: string; type: string }, day: Date) => {
    if (item.type === 'examCard') {
      const examCard = examCards.find(card => card.id === item.id);
      if (examCard) {
        onUpdateExamCard(item.id, {
          date: format(day, 'yyyy-MM-dd'),
          session: 'morning' // Default to morning session
        });
      }
    }
  };

  const getExamCardsForDay = (day: Date): ExamCard[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return examCards.filter(card => card.date === dayStr);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newWeek = direction === 'next' 
        ? addDays(prev, 7) 
        : addDays(prev, -7);
      return newWeek;
    });
  };

  const DayColumn: React.FC<{ day: Date }> = ({ day }) => {
    const [isOver, setIsOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(true);
    };

    const handleDragLeave = () => {
      setIsOver(false);
    };

    const handleDropEvent = (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      
      try {
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          const item = JSON.parse(data);
          console.log('Dropping exam card:', item.id, 'on day:', day);
          if (item.type === 'examCard') {
            handleDrop(item, day);
          }
        }
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    };

    const dayExamCards = getExamCardsForDay(day);
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropEvent}
        className={`flex-1 min-h-[400px] p-4 border-2 rounded-lg transition-all duration-200 ${
          isOver 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300 shadow-lg' 
            : isToday
              ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 shadow-md'
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
        title={`Drop exam card here for ${format(day, 'EEEE, MMM d')}`}
      >
        <div className="text-center mb-4">
          <div className={`text-sm font-medium ${
            isToday ? 'text-green-700' : 'text-gray-900'
          }`}>
            {format(day, 'EEE')}
          </div>
          <div className={`text-xs ${
            isToday ? 'text-green-600' : 'text-gray-500'
          }`}>
            {format(day, 'MMM d')}
          </div>
          {isToday && (
            <div className="mt-1">
              <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                Today
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-2 min-h-[300px]">
          {/* All exam cards */}
          <div className="space-y-2">
            {dayExamCards.map(examCard => (
              <DraggableExamCard key={examCard.id} examCard={examCard} />
            ))}
          </div>
          
          {/* Empty state */}
          {dayExamCards.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-xs opacity-60">Drop exam cards here</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Exam Schedule</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              {format(weekDays[0], 'MMM d')} - {format(weekDays[4], 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Dynamic Layout */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-4 h-full">
          {weekDays.map(day => (
            <DayColumn key={day.toISOString()} day={day} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-lg"></div>
            <span className="text-gray-600 font-medium">Drop exam cards anywhere in the column</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg"></div>
            <span className="text-gray-600 font-medium">Today's column</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarCanvas;
