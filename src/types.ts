/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'student' | 'teacher';

export interface Student {
  id: string;
  name: string;
  nis: string;
  school: string;
  joinDate: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  placement: string;
  date: string; // ISO format (YYYY-MM-DD)
  time: string; // HH:mm
  type: 'in' | 'out';
  status: 'present' | 'late' | 'excused';
  isLate?: boolean;
  notes?: string;
  isBackdated?: boolean;
}

export interface UserSession {
  role: Role;
  studentId?: string; // If role is student
}
