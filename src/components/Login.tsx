import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Coffee, User as UserIcon, Lock, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Buscamos al usuario en la tabla 'users' de Supabase
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (dbError || !user) {
        setError('❌ Usuario no encontrado en la base de datos');
        setLoading(false);
        return;
      }

      // 2. Validamos la contraseña
      if (user.password === password) {
        // Guardamos sesión local para evitar errores de hidratación
        localStorage.setItem('pos_current_user', JSON.stringify(user));
        onLoginSuccess(user as User);
      } else {
        setError('❌ Contraseña incorrecta');
      }
    } catch (err) {
      setError('❌ Error de conexión. Revisa tus llaves en Vercel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-gray-50 border-b">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-800">Cafetín Alí</h1>
          <p className="text-gray-500 text-sm">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100 animate-pulse">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ENTRAR AL SISTEMA 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
