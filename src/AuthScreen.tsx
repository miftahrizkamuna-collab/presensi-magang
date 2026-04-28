/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Users, ShieldCheck, ArrowRight, Lock, LogIn } from 'lucide-react';
import { Role } from './types';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthScreenProps {
  onSelectRole: (role: Role) => void;
}

export default function AuthScreen({ onSelectRole }: AuthScreenProps) {
  const [showTeacherLogin, setShowTeacherLogin] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSelectRole('teacher');
    } catch (err) {
      console.error(err);
      setError('Gagal login dengan Google. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Keep local password for quick demo if needed, but Google login is primary for DB
    if (password === '123guru') {
      onSelectRole('teacher');
    } else {
      setError('Password salah! Coba lagi.');
      setPassword('');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Branding */}
        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">HadirMagang</h1>
              <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px] leading-tight">SMART Ekselensia Indonesia</p>
            </div>
          </div>
          <div className="hidden md:block pt-8">
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
              alt="Team collaboration" 
              className="rounded-3xl shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right: Login Options */}
        <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col gap-6">
          {!showTeacherLogin ? (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Selamat Datang</h2>
                <p className="text-gray-500">Pilih akses untuk melanjutkan</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => onSelectRole('student')}
                  className="group relative flex items-center gap-4 p-6 bg-primary/5 hover:bg-primary/10 border-2 border-primary/10 hover:border-primary/30 rounded-3xl transition-all text-left overflow-hidden"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">Halaman Siswa</div>
                    <div className="text-sm text-gray-500">Khusus untuk absensi harian siswa</div>
                  </div>
                  <ArrowRight className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                </button>

                <button
                  onClick={() => setShowTeacherLogin(true)}
                  className="group relative flex items-center gap-4 p-6 bg-secondary/5 hover:bg-secondary/10 border-2 border-secondary/10 hover:border-secondary/30 rounded-3xl transition-all text-left overflow-hidden"
                >
                  <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">Halaman Guru</div>
                    <div className="text-sm text-gray-500">Kelola data dan rekapitulasi siswa</div>
                  </div>
                  <ArrowRight className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-secondary" />
                </button>
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowTeacherLogin(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                   <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-bold">Login Guru</h2>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  {isLoading ? 'Menghubungkan...' : 'Login dengan Google'}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-gray-300 uppercase tracking-widest">atau dengan password</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Password Akses</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="password" 
                      placeholder="Masukkan password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all text-lg"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm font-medium px-1">{error}</p>}
                </div>

                <p className="text-xs text-gray-400 px-1">
                  Gunakan password khusus guru untuk mengakses rekap dan manajemen siswa.
                </p>

                <button 
                  type="submit"
                  className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-secondary/20 active:scale-95"
                >
                  Masuk Ke Dashboard
                </button>
              </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
