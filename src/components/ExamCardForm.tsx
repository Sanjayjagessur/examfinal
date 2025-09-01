import React, { useState, useEffect } from 'react';
import { ExamCard } from '../types';
import { X } from 'lucide-react';

interface ExamCardFormProps {
  examCard?: ExamCard | null;
  onSubmit: (examCard: Omit<ExamCard, 'id'>) => void;
  onCancel: () => void;
}

const ExamCardForm: React.FC<ExamCardFormProps> = ({
  examCard,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    paperName: '',
    paperNumber: '',
    className: '',
    duration: 60,
    studentCount: 1,
    startTime: '',
    endTime: '',
    venue: ''
  });

  useEffect(() => {
    if (examCard) {
      setFormData({
        paperName: examCard.paperName,
        paperNumber: examCard.paperNumber,
        className: examCard.className,
        duration: examCard.duration,
        studentCount: examCard.studentCount,
        startTime: examCard.startTime,
        endTime: examCard.endTime,
        venue: examCard.venue || ''
      });
    }
  }, [examCard]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = e.target.value;
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime: calculateEndTime(startTime, prev.duration)
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {examCard ? 'Edit Exam Card' : 'Create New Exam Card'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="paperName" className="form-label">
            Paper Name *
          </label>
          <input
            type="text"
            id="paperName"
            name="paperName"
            value={formData.paperName}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Mathematics, Physics, etc."
            required
          />
        </div>

        <div>
          <label htmlFor="paperNumber" className="form-label">
            Paper Number *
          </label>
          <input
            type="text"
            id="paperNumber"
            name="paperNumber"
            value={formData.paperNumber}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., MATH101, PHY201, etc."
            required
          />
        </div>

        <div>
          <label htmlFor="className" className="form-label">
            Class *
          </label>
          <input
            type="text"
            id="className"
            name="className"
            value={formData.className}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Class 10A, Grade 12B, etc."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="form-label">
              Duration *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="durationHours" className="text-xs text-gray-600">Hours</label>
                <input
                  type="number"
                  id="durationHours"
                  name="durationHours"
                  value={Math.floor(formData.duration / 60)}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0;
                    const minutes = formData.duration % 60;
                    const newDuration = hours * 60 + minutes;
                    setFormData(prev => ({
                      ...prev,
                      duration: newDuration,
                      endTime: calculateEndTime(prev.startTime, newDuration)
                    }));
                  }}
                  className="form-input"
                  min="0"
                  max="8"
                  required
                />
              </div>
              <div>
                <label htmlFor="durationMinutes" className="text-xs text-gray-600">Minutes</label>
                <input
                  type="number"
                  id="durationMinutes"
                  name="durationMinutes"
                  value={formData.duration % 60}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    const hours = Math.floor(formData.duration / 60);
                    const newDuration = hours * 60 + minutes;
                    setFormData(prev => ({
                      ...prev,
                      duration: newDuration,
                      endTime: calculateEndTime(prev.startTime, newDuration)
                    }));
                  }}
                  className="form-input"
                  min="0"
                  max="59"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {Math.floor(formData.duration / 60)}h {formData.duration % 60}m
            </p>
          </div>

          <div>
            <label htmlFor="studentCount" className="form-label">
              Number of Students *
            </label>
            <input
              type="number"
              id="studentCount"
              name="studentCount"
              value={formData.studentCount}
              onChange={handleChange}
              className="form-input"
              min="1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="form-label">
              Start Time *
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleStartTimeChange}
              className="form-input"
              min="08:00"
              max="14:00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Required for scheduling</p>
          </div>

          <div>
            <label htmlFor="endTime" className="form-label">
              End Time *
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="form-input"
              min="08:30"
              max="14:30"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated from duration</p>
          </div>
        </div>

        <div>
          <label htmlFor="venue" className="form-label">
            Venue (Optional)
          </label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Room 101, Hall A, etc."
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            💡 After creating the exam card, you can drag it from the left sidebar to the calendar to schedule it.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            {examCard ? 'Update Exam' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamCardForm;
