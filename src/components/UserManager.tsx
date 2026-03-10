import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
// IMPORTANTE: Importamos la conexión de Supabase
import { supabase } from '../lib/supabase';

interface UserManagerProps {
  onClose: () => void;
}

const roleLabels: Record<Role, { label: string; description: string; color: string; icon: string }> = {
  admin: { 
    label: 'Administrador', 
    description: 'Acceso total al sistema',
    color: 'bg-purple-100 text-purple-800',
    icon: '👑'
  },
  supervisor: { 
    label: 'Supervisor', 
    description: 'Ventas, reportes, inventario y cocina',
    color: 'bg-blue-100 text-blue-800',
    icon: '📊'
  },
  cajero: { 
    label: 'Cajero', 
    description: 'Ventas y cobros',
    color: 'bg-green-100 text-green-800',
    icon: '💵'
  },
  mesero: { 
    label: 'Mesero', 
    description: 'Tomar órdenes y enviar a cocina',
    color: 'bg-orange-100 text-orange-800',
    icon: '🍽️'
  },
  cocina: { 
    label: 'Cocina', 
    description: 'Ver y preparar comandas',
    color: 'bg-red-100 text-red-800',
    icon: '👨‍🍳'
  }
};

const UserManager: React.FC<UserManagerProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mesero');

  // CARGAR USUARIOS DESDE SUPABASE
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      showNotification('error', 'Error al cargar usuarios de la base de datos');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // GUARDAR USUARIO EN SUPABASE
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar duplicados localmente antes de enviar
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      showNotification('error', '⚠️ El nombre de usuario ya existe.');
      return;
    }

    const newUser = {
      name,
      username: username.toLowerCase(),
      password,
      role
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select();

    if (error) {
      showNotification('error', '❌ Error de base de datos: ' + error.message);
    } else {
      setUsers([...users, data[0] as User]);
      setShowAddForm(false);
      showNotification('success', `✅ Usuario "${name}" guardado en Supabase`);
      
      // Reset form
      setName('');
      setUsername('');
      setPassword('');
      setRole('mesero');
    }
  };

  // ELIMINAR USUARIO DE SUPABASE
  const handleDeleteUser = async (user: User) => {
    if (user.username === 'admin') {
      showNotification('error', '⚠️ No se puede eliminar el administrador principal');
      return;
    }
    
    const confirmed = window.confirm(`¿Eliminar a "${user.name}" de la base de datos?\nEsta acción es permanente.`);
    
    if (confirmed) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) {
        showNotification('error', '❌ No se pudo eliminar: ' + error.message);
      } else {
        setUsers(users.filter(u => u.id !== user.id));
        showNotification('success', `✅ Usuario eliminado correctamente`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Usuarios (Cloud)</h2>
              <p className="text-purple-100 text-sm">Datos sincronizados con Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          } border`}>
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-600" />
              <p>Conectando con la base de datos...</p>
            </div>
          ) : !showAddForm ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {users.length} usuarios en la nube
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Usuario
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full ${roleLabels[user.role].color}`}>
                            {roleLabels[user.role].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Formulario para agregar usuario */
            <form onSubmit={handleAddUser} className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Ej: Heydi Garcia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Usuario</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="heydi.g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Rol del Usuario</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {Object.entries(roleLabels).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 rounded-xl border font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg"
                >
                  Guardar en Base de Datos
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManager;
