import React, { useState } from 'react';
import { User } from '../types';
import { getStoredUsers } from '../data/userData';
import Footer from './Footer';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    const users = getStoredUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      setError('Usuario o contraseña incorrectos. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex flex-col">
      <div className="flex-grow flex items-center justify-center relative p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Logo Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-center relative">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16" />
              
              {/* Logo */}
              <div className="relative">
                <div className="w-28 h-28 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center mb-4 border-4 border-orange-200">
                  <span className="text-6xl">☕</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-1">Cafetín Ali</h1>
                <p className="text-orange-100 text-sm">Sistema de Punto de Venta</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-orange-200 text-xs">
                  <span>📍</span>
                  <span>Malecón de Masaya, Nicaragua</span>
                </div>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                ¡Bienvenido! Inicia sesión
              </h3>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-center gap-3 animate-pulse">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">
                  👤 Usuario
                </label>
                <input
                  className="w-full py-3 px-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-200"
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                  🔒 Contraseña
                </label>
                <div className="relative">
                  <input
                    className="w-full py-3 px-4 pr-12 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-200"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                type="submit"
              >
                🚀 Iniciar Sesión
              </button>
              
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
