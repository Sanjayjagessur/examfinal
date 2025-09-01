import React from 'react';
import { useDrag } from 'react-dnd';
import { ExamCard } from '../types';
import { Clock, Users, CheckCircle } from 'lucide-react';

interface DraggableExamCardProps {
  examCard: ExamCard;
}

const DraggableExamCard: React.FC<DraggableExamCardProps> = ({ examCard }) => {
  const isScheduled = !!examCard.date;
  
  const [{ isDragging }, drag] = useDrag({
    type: 'examCard',
    item: { id: examCard.id, type: 'examCard' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      console.log('Attempting to drag exam card:', examCard.id);
      return true;
    },
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: isScheduled ? '#f3f4f6' : (examCard.color || '#3b82f6'),
      opacity: isDragging ? 0.5 : (isScheduled ? 0.7 : 1),
      transform: isDragging ? 'rotate(5deg)' : 'none',
    };
    return baseStyle;
  };

  return (
    <div
      ref={drag}
      className={`exam-card bg-white border border-gray-200 rounded-lg p-2 shadow-sm cursor-grab hover:shadow-lg transition-all ${
        isDragging ? 'dragging' : ''
      } ${isScheduled ? 'scheduled' : ''}`}
      style={getCardStyle()}
      title={isScheduled ? "Already scheduled - can be moved to different time/date" : "Drag to calendar to schedule"}
    >
      <div className={`${isScheduled ? 'text-gray-600' : 'text-white'}`}>
        {/* Scheduled Status Indicator */}
        {isScheduled && (
          <div className="flex items-center space-x-1 mb-1">
            <CheckCircle size={12} className="text-green-600" />
            <span className="text-xs font-medium text-green-600">Scheduled</span>
          </div>
        )}
        
        <div className="font-medium text-xs mb-1 truncate">
          {examCard.paperName}
        </div>
        <div className="text-xs opacity-90 mb-1">
          #{examCard.paperNumber} • {examCard.className}
        </div>
        
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center space-x-1">
            <Clock size={8} />
            <span>{examCard.startTime} - {examCard.endTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users size={8} />
            <span>{examCard.studentCount} students</span>
          </div>
          <div className="text-xs opacity-75">
            {formatDuration(examCard.duration)}
          </div>
        </div>

        {examCard.venue && (
          <div className="text-xs opacity-75 mt-1 truncate">
            📍 {examCard.venue}
          </div>
        )}
        
        {/* Scheduled Date Info */}
        {isScheduled && examCard.date && (
          <div className="text-xs text-gray-500 mt-1 border-t border-gray-200 pt-1">
            📅 {new Date(examCard.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableExamCard;
