import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
// Conectamos con el archivo del Paso 1
import { supabase } from '../lib/supabase';

interface UserManagerProps {
  onClose: () => void;
}

const roleLabels: Record<Role, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  supervisor: { label: 'Supervisor', color: 'bg-blue-100 text-blue-800' },
  cajero: { label: 'Cajero', color: 'bg-green-100 text-green-800' },
  mesero: { label: 'Mesero', color: 'bg-orange-100 text-orange-800' },
  cocina: { label: 'Cocina', color: 'bg-red-100 text-red-800' }
};

const UserManager: React.FC<UserManagerProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mesero');

  // CARGAR USUARIOS DESDE LA NUBE
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // GUARDAR EN SUPABASE (Aquí es donde "Heydi" se vuelve real)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { name, username: username.toLowerCase(), password, role };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      alert("❌ Error al guardar en Supabase: " + error.message);
    } else {
      setUsers([...users, data]);
      setShowAddForm(false);
      setName(''); setUsername(''); setPassword('');
      alert("✅ ¡Heydi (o el nuevo usuario) guardado en la nube!");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("¿Eliminar usuario permanentemente?")) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-5 border-b bg-purple-600 text-white flex justify-between items-center">
          <h2 className="font-bold text-xl">Gestión de Usuarios Cloud</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : !showAddForm ? (
            <>
              <button onClick={() => setShowAddForm(true)} className="mb-4 bg-green-600 text-white px-4 py-2 rounded-lg">+ Agregar</button>
              <table className="w-full">
                <thead><tr className="text-left text-gray-500 border-b"><th>Nombre</th><th>Rol</th><th>Acción</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="py-3">{u.name} (@{u.username})</td>
                      <td><span className={`px-2 py-1 rounded-full text-xs ${roleLabels[u.role].color}`}>{roleLabels[u.role].label}</span></td>
                      <td>{u.username !== 'admin' && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500"><Trash2 size={18}/></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <form onSubmit={handleAddUser} className="space-y-4">
              <input placeholder="Nombre Completo" className="w-full p-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
              <input placeholder="Usuario" className="w-full p-2 border rounded" value={username} onChange={e => setUsername(e.target.value)} required />
              <input type="password" placeholder="Contraseña" className="w-full p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} required />
              <select className="w-full p-2 border rounded" value={role} onChange={e => setRole(e.target.value as Role)}>
                {Object.keys(roleLabels).map(r => <option key={r} value={r}>{roleLabels[r as Role].label}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">Guardar en la Nube</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManager;
