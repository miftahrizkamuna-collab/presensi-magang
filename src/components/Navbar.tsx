/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Users, User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { Role, Student } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  role: Role;
  onLogout: () => void;
  currentStudent?: Student;
}

export default function Navbar({ role, onLogout, currentStudent }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">HadirMagang</h1>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">SMART Ekselensia</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {role === 'student' && currentStudent && (
          <div className="hidden md:flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{currentStudent.name}</span>
          </div>
        )}
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-all px-4 py-1.5 rounded-full text-sm font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>{role === 'teacher' ? 'Keluar Guru' : 'Ganti Akun'}</span>
        </button>
      </div>
    </nav>
  );
}
