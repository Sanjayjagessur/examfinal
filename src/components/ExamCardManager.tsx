import React, { useState, useEffect, useRef } from 'react';
import { ExamCard } from '../types';
import { validateExamCard } from '../utils/validation';
import { Plus, Edit, Trash2, FileText, Copy } from 'lucide-react';
import ExamCardForm from './ExamCardForm';
import DraggableExamCard from './DraggableExamCard';

interface ExamCardManagerProps {
  examCards: ExamCard[];
  onAddExamCard: (examCard: Omit<ExamCard, 'id'>) => void;
  onUpdateExamCard: (id: string, updates: Partial<ExamCard>) => void;
  onDeleteExamCard: (id: string) => void;
}

const ExamCardManager: React.FC<ExamCardManagerProps> = ({
  examCards,
  onAddExamCard,
  onUpdateExamCard,
  onDeleteExamCard
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<ExamCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const prevExamCardsLength = useRef(examCards.length);

  // Force refresh when examCards change to fix frozen state
  useEffect(() => {
    if (examCards.length !== prevExamCardsLength.current) {
      prevExamCardsLength.current = examCards.length;
      console.log('[ExamCardManager] Exam cards count changed, forcing refresh');
      
      // Force a complete component refresh
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        console.log('[ExamCardManager] Component refreshed');
      }, 50);
    }
  }, [examCards.length]);

  const handleSubmit = async (examCardData: Omit<ExamCard, 'id'>) => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      console.log('[ExamCardManager] Submit called with:', examCardData);
      
      // Validate the exam card
      const validationErrors = validateExamCard(examCardData);
      if (validationErrors.length > 0) {
        console.warn('[ExamCardManager] Validation errors:', validationErrors);
        alert(`Validation errors:\n${validationErrors.map(err => `${err.field}: ${err.message}`).join('\n')}`);
        return;
      }

      if (editingCard) {
        console.log('[ExamCardManager] Updating card:', editingCard.id);
        onUpdateExamCard(editingCard.id, examCardData);
        setEditingCard(null);
        alert('Exam updated successfully.');
      } else {
        console.log('[ExamCardManager] Creating new exam');
        onAddExamCard(examCardData);
        alert('Exam created successfully.');
      }
      
      // Reset form state
      setShowForm(false);
      setEditingCard(null);
    } catch (err) {
      console.error('[ExamCardManager] Unexpected error during submit:', err);
      alert('Unexpected error while creating/updating exam: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExam = () => {
    console.log('[ExamCardManager] Add Exam button clicked');
    // Ensure clean state before opening form
    setEditingCard(null);
    setShowForm(true);
  };

  const handleEdit = (card: ExamCard) => {
    console.log('[ExamCardManager] Edit button clicked for card:', card.id);
    setEditingCard(card);
    setShowForm(true);
  };

  const handleDuplicate = (card: ExamCard) => {
    console.log('[ExamCardManager] Duplicate button clicked for card:', card.id);
    // Create a copy of the exam card without the ID and position
    const duplicatedCard: Omit<ExamCard, 'id'> = {
      paperName: `${card.paperName} (Copy)`,
      paperNumber: `${card.paperNumber}-COPY`,
      className: card.className,
      duration: card.duration,
      studentCount: card.studentCount,
      startTime: card.startTime,
      endTime: card.endTime,
      date: undefined, // Reset date for new exam
      session: undefined, // Reset session for new exam
      position: undefined, // Reset position for new exam
      venue: card.venue,
      color: undefined, // Will get new random color
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
    console.log('[ExamCardManager] Form cancelled');
    setShowForm(false);
    setEditingCard(null);
  };

  return (
    <div key={refreshKey} className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exam Cards</h2>
          <button
            onClick={handleAddExam}
            disabled={isSubmitting}
            className="flex items-center space-x-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span>{isSubmitting ? 'Adding...' : 'Add Exam'}</span>
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {examCards.length} exam{examCards.length !== 1 ? 's' : ''} created
        </div>
        <div className="text-xs blue-600 mt-2">
          💡 Drag exam cards to the calendar to schedule them
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {examCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No exam cards created yet</p>
            <p className="text-sm">Click "Add Exam" to create your first exam card</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unscheduled Exams */}
            {examCards.filter(card => !card.date).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  📋 Unscheduled ({examCards.filter(card => !card.date).length})
                </div>
                <div className="space-y-2">
                  {examCards.filter(card => !card.date).map(card => (
                    <div key={card.id} className="relative">
                      <DraggableExamCard examCard={card} />
                      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white bg-opacity-90 rounded-md p-1">
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
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  ✅ Scheduled ({examCards.filter(card => card.date).length})
                </div>
                <div className="space-y-2">
                  {examCards.filter(card => card.date).map(card => (
                    <div key={card.id} className="relative">
                      <DraggableExamCard examCard={card} />
                      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white bg-opacity-90 rounded-md p-1">
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
        <div className="modal-overlay">
          <div className="modal-content">
            <ExamCardForm
              examCard={editingCard}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCardManager;
