import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, BookOpen, Settings, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Class, Educator, Room, Hall } from '../types/invigilation';
import { v4 as uuidv4 } from 'uuid';

interface ClassManagerProps {
  classes: Class[];
  educators: Educator[];
  rooms: Room[];
  halls: Hall[];
  onClassesChange: (classes: Class[]) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  educators,
  rooms,
  halls,
  onClassesChange
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    totalStudents: 30,
    assignedRooms: [] as string[],
    assignedEducators: [] as string[],
    examSchedule: [] as string[],
    invigilationScheme: [] as string[]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'created'>('name');

  // Filter and sort classes
  const filteredClasses = classes
    .filter(cls => 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterYear === 'all' || cls.academicYear === filterYear)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'students':
          return b.totalStudents - a.totalStudents;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const academicYears = Array.from(new Set(classes.map(cls => cls.academicYear))).sort().reverse();

  const handleCreateClass = () => {
    if (!newClass.name.trim()) {
      alert('Please enter a class name');
      return;
    }

    const classData: Class = {
      id: uuidv4(),
      ...newClass,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    onClassesChange([...classes, classData]);
    
    // Reset form
    setNewClass({
      name: '',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      totalStudents: 30,
      assignedRooms: [],
      assignedEducators: [],
      examSchedule: [],
      invigilationScheme: []
    });
    
    setShowCreateModal(false);
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setNewClass({
      name: cls.name,
      academicYear: cls.academicYear,
      totalStudents: cls.totalStudents,
      assignedRooms: cls.assignedRooms,
      assignedEducators: cls.assignedEducators,
      examSchedule: cls.examSchedule,
      invigilationScheme: cls.invigilationScheme
    });
    setShowCreateModal(true);
  };

  const handleUpdateClass = () => {
    if (!editingClass || !newClass.name.trim()) {
      alert('Please enter a class name');
      return;
    }

    const updatedClass: Class = {
      ...editingClass,
      ...newClass,
      updatedAt: new Date().toISOString()
    };

    onClassesChange(classes.map(cls => cls.id === editingClass.id ? updatedClass : cls));
    
    // Reset form
    setNewClass({
      name: '',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      totalStudents: 30,
      assignedRooms: [],
      assignedEducators: [],
      examSchedule: [],
      invigilationScheme: []
    });
    
    setEditingClass(null);
    setShowCreateModal(false);
  };

  const handleDeleteClass = (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      onClassesChange(classes.filter(cls => cls.id !== classId));
    }
  };

  const handleToggleActive = (classId: string) => {
    onClassesChange(classes.map(cls => 
      cls.id === classId ? { ...cls, isActive: !cls.isActive, updatedAt: new Date().toISOString() } : cls
    ));
  };

  const getClassStats = (cls: Class) => {
    const assignedRoomsCount = cls.assignedRooms.length;
    const assignedEducatorsCount = cls.assignedEducators.length;
    const examCount = cls.examSchedule.length;
    const sessionCount = cls.invigilationScheme.length;

    return { assignedRoomsCount, assignedEducatorsCount, examCount, sessionCount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Class Management</h2>
              <p className="text-blue-100">Manage multiple classes and their resources</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="inline mr-2" />
            Create Class
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Classes</p>
              <p className="text-3xl font-bold text-green-600">{classes.filter(cls => cls.isActive).length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-purple-600">{classes.reduce((sum, cls) => sum + cls.totalStudents, 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Academic Years</p>
              <p className="text-3xl font-bold text-orange-600">{academicYears.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Years</option>
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="students">Sort by Students</option>
            <option value="created">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map(cls => {
          const stats = getClassStats(cls);
          return (
            <div key={cls.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
              cls.isActive ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{cls.name}</h3>
                    <p className="text-sm text-gray-600">{cls.academicYear}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(cls.id)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        cls.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={cls.isActive ? 'Deactivate Class' : 'Activate Class'}
                    >
                      {cls.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </button>
                    <button
                      onClick={() => handleEditClass(cls)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit Class"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Class"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users size={16} />
                    <span>{cls.totalStudents} students</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{stats.assignedRoomsCount}</div>
                      <div className="text-xs text-blue-600">Rooms</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{stats.assignedEducatorsCount}</div>
                      <div className="text-xs text-green-600">Educators</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{stats.examCount}</div>
                      <div className="text-xs text-purple-600">Exams</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{stats.sessionCount}</div>
                      <div className="text-xs text-orange-600">Sessions</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(cls.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Classes State */}
      {filteredClasses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Users size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterYear !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first class to get started'
            }
          </p>
          {!searchTerm && filterYear === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <Plus size={20} className="inline mr-2" />
              Create First Class
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingClass ? 'Edit Class' : 'Create New Class'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingClass(null);
                  setNewClass({
                    name: '',
                    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                    totalStudents: 30,
                    assignedRooms: [],
                    assignedEducators: [],
                    examSchedule: [],
                    invigilationScheme: []
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Class 10A, Grade 11 Science"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={newClass.academicYear}
                    onChange={(e) => setNewClass(prev => ({ ...prev, academicYear: e.target.value }))}
                    placeholder="e.g., 2024-2025"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Students *
                </label>
                <input
                  type="number"
                  value={newClass.totalStudents}
                  onChange={(e) => setNewClass(prev => ({ ...prev, totalStudents: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="1000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Rooms
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {rooms.map(room => (
                    <label key={room.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newClass.assignedRooms.includes(room.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewClass(prev => ({
                              ...prev,
                              assignedRooms: [...prev.assignedRooms, room.id]
                            }));
                          } else {
                            setNewClass(prev => ({
                              ...prev,
                              assignedRooms: prev.assignedRooms.filter(id => id !== room.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{room.name} ({room.capacity})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Educators
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {educators.map(educator => (
                    <label key={educator.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newClass.assignedEducators.includes(educator.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewClass(prev => ({
                              ...prev,
                              assignedEducators: [...prev.assignedEducators, educator.id]
                            }));
                          } else {
                            setNewClass(prev => ({
                              ...prev,
                              assignedEducators: prev.assignedEducators.filter(id => id !== educator.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{educator.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingClass(null);
                  setNewClass({
                    name: '',
                    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                    totalStudents: 30,
                    assignedRooms: [],
                    assignedEducators: [],
                    examSchedule: [],
                    invigilationScheme: []
                  });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={editingClass ? handleUpdateClass : handleCreateClass}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
              >
                {editingClass ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
