/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Calendar, MapPin, History, CheckCircle2, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { Student, Attendance } from '../types';
import { storageService, INSTANSI } from '../services/storageService';
import { format, isToday, parseISO, startOfDay, isBefore } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface StudentViewProps {
  student?: Student;
  allStudents: Student[];
  onSelectStudent: (id: string) => void;
}

export default function StudentView({ student, allStudents, onSelectStudent }: StudentViewProps) {
  const [attendance, setAttendance] = React.useState<Attendance[]>([]);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [showSusulanForm, setShowSusulanForm] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedInstansi, setSelectedInstansi] = React.useState(INSTANSI[0]);

  // Form state for backdated attendance
  const [backDate, setBackDate] = React.useState('');
  const [backTime, setBackTime] = React.useState('08:00');
  const [backNotes, setBackNotes] = React.useState('');
  const [backInstansi, setBackInstansi] = React.useState(INSTANSI[0]);
  const [currentNotes, setCurrentNotes] = React.useState('');

  React.useEffect(() => {
    if (student) {
      refreshData();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [student?.id]);

  const refreshData = async () => {
    if (!student) return;
    const all = await storageService.getAttendance(student.id);
    setAttendance(all.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)));
  };

  const handlePresence = async (type: 'in' | 'out') => {
    if (!student) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const time = format(new Date(), 'HH:mm');
    
    // Simple logic: if in, check if late (e.g. after 08:00)
    const isLate = type === 'in' && parseInt(time.split(':')[0]) >= 8 && parseInt(time.split(':')[1]) > 0;

    await storageService.addAttendance({
      studentId: student.id,
      placement: selectedInstansi,
      date: today,
      time: time,
      type: type,
      status: isLate ? 'late' : 'present',
      isLate: isLate,
      notes: currentNotes
    });
    setCurrentNotes('');
    await refreshData();
  };

  if (!student) {
    const filtered = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">HadirMagang</h2>
          <p className="text-gray-500">SMART Ekselensia Indonesia</p>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari namamu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-primary transition-all shadow-xl shadow-gray-100/50 text-lg"
          />
        </div>

        <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => onSelectStudent(s.id)}
              className="flex items-center justify-between p-5 bg-white hover:bg-primary hover:text-white rounded-2xl border border-gray-100 transition-all group shadow-sm hover:shadow-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center font-bold text-gray-400 group-hover:text-white">
                  {s.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs opacity-60 font-medium uppercase tracking-wider">{s.school}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleSusulan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backDate || !backTime || !student) return;

    await storageService.addAttendance({
      studentId: student.id,
      placement: backInstansi,
      date: backDate,
      time: backTime,
      type: 'in', 
      status: 'present', 
      isBackdated: true,
      notes: `Susulan: ${backNotes}`
    });

    setShowSusulanForm(false);
    setBackDate('');
    setBackNotes('');
    await refreshData();
  };

  const hasCheckedIn = attendance.some(a => isToday(parseISO(a.date)) && a.type === 'in');
  const hasCheckedOut = attendance.some(a => isToday(parseISO(a.date)) && a.type === 'out');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Halo, {student.name}!</h2>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Pilih Instansi Magang Hari Ini</label>
              <select 
                value={selectedInstansi}
                onChange={(e) => setSelectedInstansi(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none focus:bg-white/20 transition-all font-bold text-sm"
              >
                {INSTANSI.map(i => <option key={i} value={i} className="text-gray-900">{i}</option>)}
              </select>
            </div>
          </div>
          <div className="text-right w-full md:w-auto">
            <div className="text-3xl font-mono font-bold leading-none">{format(currentTime, 'HH:mm:ss')}</div>
            <div className="text-sm opacity-80 mt-1">{format(currentTime, 'EEEE, d MMMM yyyy', { locale: id })}</div>
          </div>
        </div>
      </motion.div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Presensi Harian</h3>
            <p className="text-sm text-gray-500 mb-2">Silakan melakukan presensi masuk dan pulang tepat waktu.</p>
            
            <div className="w-full text-left space-y-1 mt-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Catatan Aktivitas Magang</label>
              <textarea 
                placeholder="Apa yang kamu kerjakan hari ini? (Opsional)"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all text-sm min-h-[60px] resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => handlePresence('in')}
              disabled={hasCheckedIn}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                hasCheckedIn 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-95"
              )}
            >
              {hasCheckedIn ? <CheckCircle2 className="w-5 h-5" /> : null}
              {hasCheckedIn ? "Sudah Masuk" : "Masuk"}
            </button>
            <button
              onClick={() => handlePresence('out')}
              disabled={!hasCheckedIn || hasCheckedOut}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                (!hasCheckedIn || hasCheckedOut)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-secondary text-white hover:opacity-90 shadow-lg shadow-secondary/20 active:scale-95"
              )}
            >
              {hasCheckedOut ? <CheckCircle2 className="w-5 h-5" /> : null}
              {hasCheckedOut ? "Sudah Pulang" : "Pulang"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-lg">Lupa Presensi?</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Jangan khawatir, kamu bisa mengajukan presensi susulan untuk tanggal yang terlewat.</p>
          <button 
            onClick={() => setShowSusulanForm(true)}
            className="w-full py-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Ajukan Presensi Susulan
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-lg">Riwayat Presensi</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {attendance.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>Belum ada riwayat presensi.</p>
            </div>
          ) : (
            attendance.map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    record.type === 'in' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                  )}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {record.type === 'in' ? 'Masuk' : 'Pulang'} - {record.time}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(parseISO(record.date), 'dd MMM yyyy')}
                      {record.isBackdated && <span className="ml-2 text-orange-500 font-medium">(Susulan)</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    record.status === 'present' ? "bg-green-100 text-green-700" : 
                    record.status === 'late' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                  )}>
                    {record.status === 'present' ? 'Tepat Waktu' : record.status === 'late' ? 'Terlambat' : 'Izin'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Susulan Modal */}
      <AnimatePresence>
        {showSusulanForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSusulanForm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold">Presensi Susulan</h2>
                <p className="text-sm text-gray-500 mt-1">Isi data presensi yang terlewat.</p>
              </div>

              <form onSubmit={handleSusulan} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pilih Instansi</label>
                  <select 
                    required
                    value={backInstansi}
                    onChange={(e) => setBackInstansi(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors font-medium"
                  >
                    {INSTANSI.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={backDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setBackDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jam Masuk (Perkiraan)</label>
                  <input 
                    type="time" 
                    required
                    value={backTime}
                    onChange={(e) => setBackTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alasan Susulan</label>
                  <textarea 
                    placeholder="Contoh: Lupa HP, bermasalah dengan jaringan..."
                    value={backNotes}
                    onChange={(e) => setBackNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors text-sm min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowSusulanForm(false)}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    Simpan
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
