import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

const UserManager = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { name, username: username.toLowerCase(), password, role: 'mesero' };
    const { data, error } = await supabase.from('users').insert([newUser]).select().single();
    
    if (!error) {
      setUsers([...users, data]);
      alert("✅ Usuario guardado en la nube");
      setName(''); setUsername(''); setPassword('');
    } else {
      alert("❌ Error: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Gestión Cloud</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <input placeholder="Nombre" className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} required />
          <input placeholder="Usuario" className="w-full border p-2 rounded" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Guardar en Supabase</button>
          <button onClick={onClose} className="w-full text-gray-500">Cerrar</button>
        </form>
      </div>
    </div>
  );
};

export default UserManager;
