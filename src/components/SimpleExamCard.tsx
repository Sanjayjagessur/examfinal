import React from 'react';
import { ExamCard } from '../types';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

interface SimpleExamCardProps {
  examCard: ExamCard;
}

const SimpleExamCard: React.FC<SimpleExamCardProps> = ({ examCard }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    console.log('[SimpleExamCard] Starting drag for:', examCard.id, examCard.paperName);
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: examCard.id,
      type: 'examCard'
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

  const getStatusColor = () => {
    if (examCard.date) {
      return 'bg-green-50 border-green-200 text-green-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getStatusIcon = () => {
    if (examCard.date) {
      return <Calendar size={14} className="text-green-600" />;
    }
    return <Clock size={14} className="text-blue-600" />;
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 rounded-lg border-2 cursor-move transition-all hover:shadow-md ${getStatusColor()} ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-xs font-medium">
            {examCard.date ? 'Scheduled' : 'Unscheduled'}
          </span>
        </div>
        {examCard.date && (
          <span className="text-xs text-gray-600">
            {new Date(examCard.date).toLocaleDateString()}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="font-semibold text-sm text-gray-900 truncate">
          {examCard.paperName}
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium">#{examCard.paperNumber}</span>
            <span>•</span>
            <span>{examCard.className}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{formatDuration(examCard.duration)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Users size={12} />
              <span>{examCard.studentCount} students</span>
            </div>
          </div>
          
          {examCard.startTime && examCard.endTime && (
            <div className="text-xs text-gray-600">
              {examCard.startTime} - {examCard.endTime}
            </div>
          )}
          
          {examCard.venue && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <MapPin size={12} />
              <span>{examCard.venue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleExamCard;
