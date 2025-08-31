import React, { useState } from 'react';
import { ExamCard } from '../types';
import { validateExamCard } from '../utils/validation';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
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

  const handleSubmit = (examCardData: Omit<ExamCard, 'id'>) => {
    // Validate the exam card
    const validationErrors = validateExamCard(examCardData);
    if (validationErrors.length > 0) {
      alert(`Validation errors:\n${validationErrors.map(err => `${err.field}: ${err.message}`).join('\n')}`);
      return;
    }

    if (editingCard) {
      onUpdateExamCard(editingCard.id, examCardData);
      setEditingCard(null);
    } else {
      onAddExamCard(examCardData);
    }
    setShowForm(false);
  };

  const handleEdit = (card: ExamCard) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this exam card?')) {
      onDeleteExamCard(id);
    }
  };



  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exam Cards</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 btn-primary"
          >
            <Plus size={16} />
            <span>Add Exam</span>
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {examCards.length} exam{examCards.length !== 1 ? 's' : ''} created
        </div>
        <div className="text-xs text-blue-600 mt-2">
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
                     examCards.map(card => (
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
                   onClick={() => handleDelete(card.id)}
                   className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                   title="Delete"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
             </div>
           ))
        )}
      </div>

      {/* Exam Card Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ExamCardForm
              examCard={editingCard}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCard(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCardManager;
