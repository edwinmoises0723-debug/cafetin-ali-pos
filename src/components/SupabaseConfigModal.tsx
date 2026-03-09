import React, { useState } from 'react';
import { X, Save, Database, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, key: string) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [key, setKey] = useState(localStorage.getItem('supabase_key') || '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const testConnection = async () => {
    setStatus('testing');
    setMessage('Probando conexión...');

    try {
      if (!url || !key) throw new Error('Faltan credenciales');
      
      const supabase = createClient(url, key);
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

      if (error) throw error;

      setStatus('success');
      setMessage('¡Conexión exitosa con Supabase!');
      
      // Guardar en localStorage
      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_key', key);
      
      setTimeout(() => {
        onSave(url, key);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(`Error de conexión: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Database size={24} />
            <h2 className="text-xl font-bold">Conectar Nube</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Ingresa las credenciales de tu proyecto Supabase para sincronizar datos en la nube.
            Ve a <b>Project Settings {'>'} API</b> para encontrarlas.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anon Public Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {status !== 'idle' && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              status === 'success' ? 'bg-green-100 text-green-800' : 
              status === 'error' ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {status === 'success' ? <Check size={18} /> : 
               status === 'error' ? <AlertCircle size={18} /> : 
               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
              <span>{message}</span>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={testConnection}
              disabled={status === 'testing' || !url || !key}
              className={`flex-1 px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 transition-all ${
                status === 'testing' || !url || !key 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'
              }`}
            >
              <Save size={18} />
              {status === 'testing' ? 'Conectando...' : 'Guardar y Conectar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
