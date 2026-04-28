/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Attendance, Role } from '../types';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const STORAGE_KEYS = {
  SESSION: 'hadirmagang_session_v3',
  SELECTED_STUDENT: 'hadirmagang_selected_student',
};

export const INSTANSI = [
  'KMM', 'Madaya Coffee', 'Teras Madina', 'TEACH GEN', 'STIM Budi Bakti', 'SD SMART EI', 'PAUD SMART EI'
];

const DEFAULT_STUDENTS: Omit<Student, 'id'>[] = [
  "Ahmad Irfansyah", "Aidil Adha", "Daffa Haryanto", "Fadhlan Abi Aufa", 
  "Hamka Iftikhar Jadda Fillah", "M. Aghista Vianda Rahman", "Ridho Febriansyah", 
  "Agung Mulyana", "Ahmad Abdal Hakim", "Krisna Pratama", "Maftuhul Nabil", 
  "Muhamad Azwar", "Muhammad Kevin", "Muhammad Rasyid Fatihurrahman", 
  "Putra Ahmad Soleh", "Rafli Adryan Permana", "Rendy Putra Habibullah", 
  "Syah Riza", "Zulfiekar Zein Wahid", "Aditya Riza Sahputra", "M. Rizqy Junmaedy"
].map((name, index) => ({
  name,
  nis: `2024${(index + 1).toString().padStart(3, '0')}`,
  school: 'SMA SMART Ekselensia Indonesia',
  joinDate: '2024-01-01'
}));

export const storageService = {
  getStudents: async (): Promise<Student[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      let students: Student[] = [];
      querySnapshot.forEach((doc) => {
        // @ts-ignore
        students.push({ id: doc.id, ...doc.data() } as Student);
      });

      // Seed missing students if the list is noticeably incomplete
      // We check if count is significantly less than default to handle partial failures
      if (students.length < DEFAULT_STUDENTS.length * 0.8) {
        const existingNames = new Set(students.map(s => s.name));
        const missingStudents = DEFAULT_STUDENTS.filter(s => !existingNames.has(s.name));
        
        if (missingStudents.length > 0) {
          for (const s of missingStudents) {
            try {
              const docRef = await addDoc(collection(db, 'students'), s);
              // @ts-ignore
              students.push({ id: docRef.id, ...s } as Student);
            } catch (seedError) {
              console.error('Failed to seed student:', s.name, seedError);
            }
          }
        }
      }
      
      // Sort alphabetically by name
      return students.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('getStudents Error:', error);
      // Fallback to default students so the app is usable if DB is down
      const fallback = DEFAULT_STUDENTS.map((s, idx) => ({ ...s, id: `temp-${idx}` }));
      return fallback as Student[];
    }
  },

  saveStudents: async (students: Student[]) => {
    // This was used for bulk save in localStorage. 
    // In Firestore we usually save individual docs.
    for (const student of students) {
      await storageService.updateStudent(student);
    }
  },

  addStudent: async (student: Omit<Student, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'students'), student);
      return { id: docRef.id, ...student } as Student;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
      throw error;
    }
  },

  updateStudent: async (updatedStudent: Student) => {
    try {
      const { id, ...data } = updatedStudent;
      await setDoc(doc(db, 'students', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${updatedStudent.id}`);
      throw error;
    }
  },

  getAttendance: async (studentId?: string): Promise<Attendance[]> => {
    try {
      let q;
      if (studentId) {
        q = query(
          collection(db, 'attendance'), 
          where('studentId', '==', studentId),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          collection(db, 'attendance'), 
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const records: Attendance[] = [];
      querySnapshot.forEach((doc) => {
        // @ts-ignore
        records.push({ id: doc.id, ...doc.data() } as Attendance);
      });
      return records;
    } catch (error) {
      console.error('getAttendance Error:', error);
      // Don't throw for list so UI doesn't crash
      return [];
    }
  },

  addAttendance: async (record: Omit<Attendance, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'attendance'), {
        ...record,
        createdAt: serverTimestamp()
      });
      // @ts-ignore - TS sometimes struggles with spreading Omit types
      return { id: docRef.id, ...record } as Attendance;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
      throw error;
    }
  },

  getSession: (): Role | null => {
    return localStorage.getItem(STORAGE_KEYS.SESSION) as Role | null;
  },

  saveSession: (role: Role | null) => {
    if (role) {
      localStorage.setItem(STORAGE_KEYS.SESSION, role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },

  getSelectedStudentId: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT);
  },

  saveSelectedStudentId: (id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_STUDENT, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_STUDENT);
    }
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_STUDENT);
  }
};
