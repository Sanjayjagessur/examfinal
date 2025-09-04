import React, { useState, useEffect } from 'react';
import { ExamCard } from '../types';
import { validateExamCard } from '../utils/validation';
import { Plus, Edit, Trash2, Copy, Calendar, Clock, X, Grid, List } from 'lucide-react';
import SimpleExamCard from './SimpleExamCard';

interface ExamTableManagerProps {
  examCards: ExamCard[];
  onAddExamCard: (examCard: Omit<ExamCard, 'id'>) => void;
  onUpdateExamCard: (id: string, updates: Partial<ExamCard>) => void;
  onDeleteExamCard: (id: string) => void;
}

const ExamTableManager: React.FC<ExamTableManagerProps> = ({
  examCards,
  onAddExamCard,
  onUpdateExamCard,
  onDeleteExamCard
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<ExamCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Reset form when editing card changes
  useEffect(() => {
    if (editingCard) {
      setFormData({
        paperName: editingCard.paperName,
        paperNumber: editingCard.paperNumber,
        className: editingCard.className,
        duration: editingCard.duration,
        studentCount: editingCard.studentCount,
        startTime: editingCard.startTime,
        endTime: editingCard.endTime,
        venue: editingCard.venue || ''
      });
    } else {
      setFormData({
        paperName: '',
        paperNumber: '',
        className: '',
        duration: 60,
        studentCount: 1,
        startTime: '',
        endTime: '',
        venue: ''
      });
    }
  }, [editingCard]);

  // Debug logging for exam cards changes
  useEffect(() => {
    console.log('[ExamTableManager] Exam cards updated:', examCards.length);
    console.log('[ExamTableManager] Exam cards:', examCards);
    
    // Debug: Check if cards are being rendered
    if (viewMode === 'cards') {
      console.log('[ExamTableManager] Card view mode - rendering cards');
      const unscheduledCards = examCards.filter(card => !card.date);
      const scheduledCards = examCards.filter(card => card.date);
      console.log('[ExamTableManager] Unscheduled cards:', unscheduledCards.length);
      console.log('[ExamTableManager] Scheduled cards:', scheduledCards.length);
    }
  }, [examCards, viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate the exam card
      const validationErrors = validateExamCard(formData);
      if (validationErrors.length > 0) {
        alert(`Validation errors:\n${validationErrors.map(err => `${err.field}: ${err.message}`).join('\n')}`);
        return;
      }

      if (editingCard) {
        onUpdateExamCard(editingCard.id, formData);
        setEditingCard(null);
        alert('Exam updated successfully.');
      } else {
        onAddExamCard(formData);
        alert('Exam created successfully.');
      }
      
      // Reset form state
      setShowForm(false);
      setEditingCard(null);
    } catch (err) {
      console.error('Error during submit:', err);
      alert('Error while creating/updating exam: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExam = () => {
    setEditingCard(null);
    setShowForm(true);
  };

  const handleEdit = (card: ExamCard) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleDuplicate = (card: ExamCard) => {
    const duplicatedCard: Omit<ExamCard, 'id'> = {
      paperName: `${card.paperName} (Copy)`,
      paperNumber: `${card.paperNumber}-COPY`,
      className: card.className,
      duration: card.duration,
      studentCount: card.studentCount,
      startTime: card.startTime,
      endTime: card.endTime,
      date: undefined,
      session: undefined,
      position: undefined,
      venue: card.venue,
      color: undefined,
    };
    
    onAddExamCard(duplicatedCard);
    alert('Exam card duplicated successfully!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this exam card?')) {
      onDeleteExamCard(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCard(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

  const getStatusBadge = (card: ExamCard) => {
    if (card.date) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Calendar size={12} className="mr-1" />
          Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock size={12} className="mr-1" />
        Unscheduled
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exam Management</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Card View (for drag & drop)"
              >
                <Grid size={16} />
              </button>
            </div>
            <button
              onClick={handleAddExam}
              disabled={isSubmitting}
              className="flex items-center space-x-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Adding...' : 'Add Exam'}</span>
            </button>

          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {examCards.length} exam{examCards.length !== 1 ? 's' : ''} created
        </div>
        <div className="text-xs text-blue-600 mt-2">
          💡 Drag exam cards to the calendar to schedule them
        </div>
        
        {/* Drop Zone for Moving Cards Back to Unscheduled */}
        {viewMode === 'cards' && (
          <div
            className="mt-3 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
              
              try {
                const data = e.dataTransfer.getData('application/json');
                if (data) {
                  const item = JSON.parse(data);
                  if (item.type === 'examCard' && item.isScheduled) {
                    // Move card back to unscheduled
                    onUpdateExamCard(item.id, {
                      date: undefined,
                      session: undefined,
                      position: undefined
                    });
                    console.log('Moved scheduled card back to unscheduled:', item.id);
                  }
                }
              } catch (error) {
                console.error('Error parsing drop data:', error);
              }
            }}
          >
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="font-medium">Drop here to unschedule</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Drag scheduled exam cards here to move them back to unscheduled
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exam Cards Display */}
      <div className="flex-1 overflow-y-auto">
        {examCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No exam cards created yet</p>
            <p className="text-sm">Click "Add Exam" to create your first exam card</p>
          </div>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paper Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paper #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(card)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{card.paperName}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{card.paperNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{card.className}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDuration(card.duration)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{card.studentCount}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {card.startTime && card.endTime ? `${card.startTime} - ${card.endTime}` : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{card.venue || '-'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(card)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(card)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Card View for Drag & Drop
          <div className="p-4 space-y-4">
            {/* Unscheduled Exams */}
            {examCards.filter(card => !card.date).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                  📋 Unscheduled ({examCards.filter(card => !card.date).length})
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {examCards.filter(card => !card.date).map(card => (
                    <div key={card.id} className="relative group">
                      <SimpleExamCard examCard={card} />
                      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white bg-opacity-90 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(card)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(card)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Exams */}
            {examCards.filter(card => card.date).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                  ✅ Scheduled ({examCards.filter(card => card.date).length})
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {examCards.filter(card => card.date).map(card => (
                    <div key={card.id} className="relative group">
                      <SimpleExamCard examCard={card} />
                      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white bg-opacity-90 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(card)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(card)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exam Card Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCard ? 'Edit Exam Card' : 'Create New Exam Card'}
                </h2>
                <button
                  onClick={handleCancel}
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
                    placeholder="e.g., MAT101, PHY201, etc."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="className" className="form-label">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    id="className"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Class 10A, Grade 11B, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="form-label">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className="form-input"
                      min="15"
                      step="15"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="studentCount" className="form-label">
                      Student Count *
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
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="endTime" className="form-label">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      className="form-input"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="venue" className="form-label">
                    Venue
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Room 101, Lab 2, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : (editingCard ? 'Update Exam' : 'Create Exam')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTableManager;
