/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { storageService } from './services/storageService';
import { Role, Student } from './types';
import Navbar from './components/Navbar';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import AuthScreen from './AuthScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [role, setRole] = React.useState<Role | null>(null);
  const [currentStudent, setCurrentStudent] = React.useState<Student | undefined>();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const initData = async () => {
      const savedRole = storageService.getSession();
      const studentsList = await storageService.getStudents();
      const selectedStudentId = storageService.getSelectedStudentId();
      
      setStudents(studentsList);
      
      if (savedRole) {
        setRole(savedRole as Role);
        if (savedRole === 'student' && selectedStudentId) {
          setCurrentStudent(studentsList.find(s => s.id === selectedStudentId));
        }
      }
      
      setIsReady(true);
    };
    initData();
  }, []);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    storageService.saveSession(selectedRole);
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentStudent(undefined);
    storageService.saveSession(null);
    storageService.saveSelectedStudentId(null);
  };

  const handleSelectStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setCurrentStudent(student);
    storageService.saveSelectedStudentId(id);
  };

  if (!isReady) return null;

  if (!role) {
    return <AuthScreen onSelectRole={handleRoleSelect} />;
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50 flex flex-col">
      <Navbar 
        role={role} 
        onLogout={handleLogout} 
        currentStudent={currentStudent}
      />
      
      <main className="flex-1 container mx-auto">
        <AnimatePresence mode="wait">
          {role === 'student' ? (
            <motion.div
              key="student-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StudentView 
                student={currentStudent} 
                allStudents={students}
                onSelectStudent={handleSelectStudent}
              />
            </motion.div>
          ) : (
            <motion.div
              key="teacher-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TeacherView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Info */}
      <footer className="py-12 px-4 text-center mt-auto">
        <div className="max-w-2xl mx-auto border-t border-gray-200 pt-8">
          <p className="text-gray-400 text-sm font-bold tracking-tight">HadirMagang - SMART Ekselensia Indonesia</p>
          <p className="text-[10px] text-gray-300 uppercase font-black tracking-widest mt-1">Sistem Presensi Digital Terintegrasi</p>
        </div>
      </footer>
    </div>
  );
}
