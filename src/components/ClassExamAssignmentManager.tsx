import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, BookOpen, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Class, ClassExamAssignment, RoomAllocation } from '../types/invigilation';
import { ExamCard } from '../types';
import { Room } from '../types/invigilation';
import { v4 as uuidv4 } from 'uuid';

interface ClassExamAssignmentManagerProps {
  classes: Class[];
  rooms: Room[];
  examCards: ExamCard[];
  assignments: ClassExamAssignment[];
  onAssignmentsChange: (assignments: ClassExamAssignment[]) => void;
}

const ClassExamAssignmentManager: React.FC<ClassExamAssignmentManagerProps> = ({
  classes,
  rooms,
  examCards,
  assignments,
  onAssignmentsChange
}) => {
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ClassExamAssignment | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    classId: '',
    examCardId: '',
    assignedRooms: [] as string[]
  });

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  // Filter assignments based on selection
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const classMatch = selectedClass === 'all' || assignment.classId === selectedClass;
      const dateMatch = selectedDate === 'all' || assignment.examDate === selectedDate;
      return classMatch && dateMatch;
    });
  }, [assignments, selectedClass, selectedDate]);

  // Get available exam cards for a class
  const getAvailableExamsForClass = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    if (!classData) return [];

    // Get exams that don't already have assignments for this class
    const assignedExamIds = assignments
      .filter(a => a.classId === classId)
      .map(a => a.examCardId);

    return examCards.filter(exam => !assignedExamIds.includes(exam.id));
  };

  // Get available rooms for a class
  const getAvailableRoomsForClass = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    if (!classData) return [];

    // Return rooms assigned to this class
    return rooms.filter(room => classData.assignedRooms.includes(room.id));
  };

  // Calculate room allocations based on student count and room capacities
  const calculateRoomAllocations = (studentCount: number, selectedRoomIds: string[]) => {
    const selectedRooms = rooms.filter(room => selectedRoomIds.includes(room.id));
    const totalCapacity = selectedRooms.reduce((sum, room) => sum + room.capacity, 0);

    if (totalCapacity < studentCount) {
      return null; // Not enough capacity
    }

    const allocations: RoomAllocation[] = [];
    let remainingStudents = studentCount;

    // Sort rooms by capacity (largest first) for optimal distribution
    const sortedRooms = [...selectedRooms].sort((a, b) => b.capacity - a.capacity);

    for (const room of sortedRooms) {
      if (remainingStudents <= 0) break;

      const allocatedStudents = Math.min(room.capacity, remainingStudents);
      const remainingCapacity = room.capacity - allocatedStudents;

      allocations.push({
        roomId: room.id,
        roomName: room.name,
        roomCapacity: room.capacity,
        allocatedStudents,
        remainingCapacity,
        isFull: remainingCapacity === 0
      });

      remainingStudents -= allocatedStudents;
    }

    return allocations;
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.classId || !newAssignment.examCardId || newAssignment.assignedRooms.length === 0) {
      alert('Please select a class, exam, and at least one room');
      return;
    }

    const classData = classes.find(c => c.id === newAssignment.classId);
    const examData = examCards.find(e => e.id === newAssignment.examCardId);
    
    if (!classData || !examData) return;

    // Calculate room allocations
    const roomAllocations = calculateRoomAllocations(examData.studentCount, newAssignment.assignedRooms);
    
    if (!roomAllocations) {
      alert('Selected rooms do not have enough capacity for all students');
      return;
    }

    const assignment: ClassExamAssignment = {
      id: uuidv4(),
      classId: newAssignment.classId,
      className: classData.name,
      examCardId: newAssignment.examCardId,
      examName: examData.paperName,
      examDate: examData.date || '',
      examStartTime: examData.startTime || '',
      examEndTime: examData.endTime || '',
      studentCount: examData.studentCount,
      assignedRooms: newAssignment.assignedRooms,
      roomAllocations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAssignmentsChange([...assignments, assignment]);
    
    // Reset form
    setNewAssignment({
      classId: '',
      examCardId: '',
      assignedRooms: []
    });
    
    setShowAssignmentModal(false);
  };

  const handleEditAssignment = (assignment: ClassExamAssignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      classId: assignment.classId,
      examCardId: assignment.examCardId,
      assignedRooms: assignment.assignedRooms
    });
    setShowAssignmentModal(true);
  };

  const handleUpdateAssignment = () => {
    if (!editingAssignment) return;

    const classData = classes.find(c => c.id === newAssignment.classId);
    const examData = examCards.find(e => e.id === newAssignment.examCardId);
    
    if (!classData || !examData) return;

    // Calculate room allocations
    const roomAllocations = calculateRoomAllocations(examData.studentCount, newAssignment.assignedRooms);
    
    if (!roomAllocations) {
      alert('Selected rooms do not have enough capacity for all students');
      return;
    }

    const updatedAssignment: ClassExamAssignment = {
      ...editingAssignment,
      className: classData.name,
      examName: examData.paperName,
      examDate: examData.date || '',
      examStartTime: examData.startTime || '',
      examEndTime: examData.endTime || '',
      studentCount: examData.studentCount,
      assignedRooms: newAssignment.assignedRooms,
      roomAllocations,
      updatedAt: new Date().toISOString()
    };

    onAssignmentsChange(assignments.map(a => a.id === editingAssignment.id ? updatedAssignment : a));
    
    // Reset form
    setNewAssignment({
      classId: '',
      examCardId: '',
      assignedRooms: []
    });
    
    setEditingAssignment(null);
    setShowAssignmentModal(false);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      onAssignmentsChange(assignments.filter(a => a.id !== assignmentId));
    }
  };

  const getAssignmentStats = () => {
    const totalAssignments = assignments.length;
    const totalStudents = assignments.reduce((sum, a) => sum + a.studentCount, 0);
    const totalRoomsUsed = new Set(assignments.flatMap(a => a.assignedRooms)).size;
    const classesWithAssignments = new Set(assignments.map(a => a.classId)).size;

    return { totalAssignments, totalStudents, totalRoomsUsed, classesWithAssignments };
  };

  const stats = getAssignmentStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Class Exam Assignments</h2>
              <p className="text-purple-100">Assign exams to classes and allocate rooms for student seating</p>
            </div>
          </div>
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="inline mr-2" />
            Assign Exam to Class
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalAssignments}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rooms Used</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalRoomsUsed}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Classes with Exams</p>
              <p className="text-3xl font-bold text-orange-600">{stats.classesWithAssignments}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Dates</option>
              {Array.from(new Set(assignments.map(a => a.examDate))).sort().map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      {filteredAssignments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-purple-900">Exam Assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Allocation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assignment.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assignment.examName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{assignment.examDate}</div>
                      <div className="text-sm text-gray-500">{assignment.examStartTime} - {assignment.examEndTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{assignment.studentCount} students</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {assignment.roomAllocations.map((allocation) => (
                          <div key={allocation.roomId} className="flex items-center space-x-2 text-sm">
                            <div className={`w-3 h-3 rounded-full ${
                              allocation.isFull ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                            <span className="font-medium">{allocation.roomName}</span>
                            <span className="text-gray-500">
                              ({allocation.allocatedStudents}/{allocation.roomCapacity})
                            </span>
                            {allocation.isFull && (
                              <span className="text-red-600 text-xs font-medium">FULL</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditAssignment(assignment)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit Assignment"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Assignment"
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
        </div>
      )}

      {/* No Assignments State */}
      {filteredAssignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exam Assignments Found</h3>
          <p className="text-gray-600 mb-4">
            {selectedClass !== 'all' || selectedDate !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first exam assignment to get started'
            }
          </p>
          {selectedClass === 'all' && selectedDate === 'all' && (
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
            >
              <Plus size={20} className="inline mr-2" />
              Create First Assignment
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingAssignment ? 'Edit Exam Assignment' : 'Assign Exam to Class'}
              </h3>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setEditingAssignment(null);
                  setNewAssignment({
                    classId: '',
                    examCardId: '',
                    assignedRooms: []
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class *
                </label>
                <select
                  value={newAssignment.classId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Exam *
                </label>
                <select
                  value={newAssignment.examCardId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, examCardId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Choose an exam...</option>
                  {newAssignment.classId && getAvailableExamsForClass(newAssignment.classId).map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.paperName} - {exam.date} ({exam.studentCount} students)
                    </option>
                  ))}
                </select>
              </div>

              {newAssignment.examCardId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Rooms for Exam *
                  </label>
                  <div className="space-y-3">
                    {getAvailableRoomsForClass(newAssignment.classId).map(room => (
                      <label key={room.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={newAssignment.assignedRooms.includes(room.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssignment(prev => ({
                                ...prev,
                                assignedRooms: [...prev.assignedRooms, room.id]
                              }));
                            } else {
                              setNewAssignment(prev => ({
                                ...prev,
                                assignedRooms: prev.assignedRooms.filter(id => id !== room.id)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{room.name}</div>
                          <div className="text-sm text-gray-500">Capacity: {room.capacity} students</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {newAssignment.assignedRooms.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Room Allocation Preview:</strong>
                        {(() => {
                          const examData = examCards.find(e => e.id === newAssignment.examCardId);
                          if (!examData) return null;
                          
                          const allocations = calculateRoomAllocations(examData.studentCount, newAssignment.assignedRooms);
                          if (!allocations) {
                            return <div className="text-red-600 mt-2">⚠️ Selected rooms do not have enough capacity for {examData.studentCount} students</div>;
                          }
                          
                          return (
                            <div className="mt-2 space-y-1">
                              {allocations.map(allocation => (
                                <div key={allocation.roomId} className="flex items-center space-x-2">
                                  <span>• {allocation.roomName}:</span>
                                  <span className="font-medium">{allocation.allocatedStudents} students</span>
                                  <span className="text-blue-600">({allocation.remainingCapacity} remaining)</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setEditingAssignment(null);
                  setNewAssignment({
                    classId: '',
                    examCardId: '',
                    assignedRooms: []
                  });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-semibold"
              >
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassExamAssignmentManager;
