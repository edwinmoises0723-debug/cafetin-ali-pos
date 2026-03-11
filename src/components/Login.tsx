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

      if (user.password === password) {
        // Guardamos en localStorage para persistencia
        localStorage.setItem('pos_current_user', JSON.stringify(user));
        onLoginSuccess(user as User);
      } else {
        setError('❌ Contraseña incorrecta');
      }
    } catch (err) {
      setError('❌ Error de conexión. Revisa Vercel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-gray-50 border-b">
          <Coffee className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-800">Cafetín Alí</h1>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">{error}</div>}
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="Usuario" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="Contraseña" required />
          <button type="submit" disabled={loading} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ENTRAR AL SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
