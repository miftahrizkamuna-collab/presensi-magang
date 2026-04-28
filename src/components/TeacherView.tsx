/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, FileText, Search, Edit3, MapPin, GraduationCap, ArrowRight, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Student, Attendance } from '../types';
import { storageService, INSTANSI } from '../services/storageService';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function TeacherView() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [attendance, setAttendance] = React.useState<Attendance[]>([]);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'students' | 'rekap'>('overview');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Edit logic
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);

  React.useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [studentsList, attendanceList] = await Promise.all([
      storageService.getStudents(),
      storageService.getAttendance()
    ]);
    setStudents(studentsList);
    setAttendance(attendanceList);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    await storageService.updateStudent(editingStudent);
    setEditingStudent(null);
    await refreshData();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm)
  );

  const stats = {
    totalStudents: students.length,
    totalAttendanceThisMonth: attendance.filter(a => {
      const date = parseISO(a.date);
      return isWithinInterval(date, { 
        start: startOfMonth(new Date()), 
        end: endOfMonth(new Date()) 
      });
    }).length,
    lateCountThisMonth: attendance.filter(a => {
      const date = parseISO(a.date);
      return a.status === 'late' && isWithinInterval(date, { 
        start: startOfMonth(new Date()), 
        end: endOfMonth(new Date()) 
      });
    }).length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Guru</h2>
          <p className="text-gray-500">Monitor dan kelola data siswa magang kamu.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { id: 'overview', icon: Users, label: 'Ikhtisar' },
            { id: 'students', icon: GraduationCap, label: 'Data Siswa' },
            { id: 'rekap', icon: FileText, label: 'Rekap Presensi' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === tab.id ? "bg-white text-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Total Siswa', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
                { label: 'Presensi Bulan Ini', value: stats.totalAttendanceThisMonth, icon: CheckCircle2, color: 'bg-green-500' },
                { label: 'Terlambat/Izin', value: stats.lateCountThisMonth, icon: AlertCircle, color: 'bg-red-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform", stat.color)} />
                  <stat.icon className="w-6 h-6 text-gray-400 mb-4" />
                  <div className="text-3xl font-black">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-lg">Aktivitas Terbaru</h3>
                <button 
                  onClick={() => setActiveTab('rekap')}
                  className="text-sm font-bold text-secondary flex items-center gap-1 hover:underline"
                >
                  Lihat Semua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {attendance.slice(-5).map((record) => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <div key={record.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                          {student?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{student?.name}</div>
                          <div className="text-xs text-gray-500">{record.type === 'in' ? 'Masuk' : 'Pulang'} • {record.time} • {record.date}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        record.status === 'present' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {record.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div 
            key="students"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Cari siswa, NIS, atau tempat magang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-secondary transition-colors shadow-sm"
              />
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
                  <button 
                    onClick={() => setEditingStudent(student)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <h4 className="font-bold text-xl">{student.name}</h4>
                  <div className="text-sm font-semibold text-gray-400 mb-4">{student.nis} • {student.school}</div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Mulai: {format(parseISO(student.joinDate), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'rekap' && (
          <motion.div 
            key="rekap"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-lg">Rekapitulasi Presensi Lengkap</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
                   Export Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Siswa</th>
                    <th className="px-6 py-4">Instansi</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Jam</th>
                    <th className="px-6 py-4">Tipe</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Belum ada data presensi terkumpul.</td>
                     </tr>
                  ) : (
                    attendance.map((record) => {
                      const student = students.find(s => s.id === record.studentId);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-sm">{student?.name}</td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-600">{record.placement}</td>
                          <td className="px-6 py-4 text-sm font-mono">{record.date}</td>
                          <td className="px-6 py-4 text-sm font-mono">{record.time}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tight",
                              record.type === 'in' ? "text-green-600" : "text-blue-600"
                            )}>
                              {record.type === 'in' ? 'Masuk' : 'Pulang'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase",
                              record.status === 'present' ? "bg-green-50 text-green-700" : 
                              record.status === 'late' ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                            )}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic max-w-[200px] truncate">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6 text-left"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold">Edit Data Siswa</h2>
                <p className="text-sm text-gray-500 mt-1">Ubah data penempatan atau info siswa.</p>
              </div>

              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asal Sekolah</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.school}
                    onChange={(e) => setEditingStudent({...editingStudent, school: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-secondary transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-secondary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-secondary/20"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
