import React from 'react';
import { useDrag } from 'react-dnd';
import { ExamCard } from '../types';
import { Clock, Users } from 'lucide-react';

interface DraggableExamCardProps {
  examCard: ExamCard;
}

const DraggableExamCard: React.FC<DraggableExamCardProps> = ({ examCard }) => {
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
      backgroundColor: examCard.color || '#3b82f6',
      opacity: isDragging ? 0.5 : 1,
      transform: isDragging ? 'rotate(5deg)' : 'none',
    };
    return baseStyle;
  };

  return (
    <div
      ref={drag}
      className={`exam-card bg-white border border-gray-200 rounded-lg p-2 shadow-sm cursor-grab hover:shadow-lg transition-all ${
        isDragging ? 'dragging' : ''
      }`}
      style={getCardStyle()}
      title="Drag to calendar to schedule"
    >
      <div className="text-white">
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
      </div>
    </div>
  );
};

export default DraggableExamCard;
