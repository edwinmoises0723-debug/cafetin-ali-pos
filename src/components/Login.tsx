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
      // Buscamos al usuario en la tabla 'users' de Supabase
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (dbError || !user) {
        setError('❌ Usuario no encontrado');
        setLoading(false);
        return;
      }

      // Validamos la contraseña (texto plano por ahora)
      if (user.password === password) {
        onLoginSuccess(user as User);
      } else {
        setError('❌ Contraseña incorrecta');
      }
    } catch (err) {
      setError('❌ Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="p-8 text-center bg-gray-50 border-b">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Coffee className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-800">Cafetín Alí</h1>
          <p className="text-gray-500">Sistema de Punto de Venta</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar al Sistema 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
