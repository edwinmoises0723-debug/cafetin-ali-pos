import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { getStoredUsers, saveUsers } from '../data/userData';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mesero');

  useEffect(() => {
    setUsers(getStoredUsers());
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      showNotification('error', '⚠️ El nombre de usuario ya existe. Por favor, elige otro.');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      username: username.toLowerCase(),
      password,
      role
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setShowAddForm(false);
    showNotification('success', `✅ Usuario "${name}" creado exitosamente`);
    
    // Reset form
    setName('');
    setUsername('');
    setPassword('');
    setRole('mesero');
  };

  const handleDeleteUser = (user: User) => {
    if (user.username === 'admin') {
      showNotification('error', '⚠️ No se puede eliminar el usuario administrador principal');
      return;
    }
    
    const confirmed = window.confirm(`¿Estás seguro de eliminar al usuario "${user.name}"?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmed) {
      const updatedUsers = users.filter(u => u.id !== user.id);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      showNotification('success', `✅ Usuario "${user.name}" eliminado correctamente`);
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
              <h2 className="text-xl font-bold text-white">Gestión de Usuarios</h2>
              <p className="text-purple-100 text-sm">Administra el equipo de trabajo</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {!showAddForm ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Usuario
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acceso</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {roleLabels[user.role].description}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${roleLabels[user.role].color}`}>
                            <span>{roleLabels[user.role].icon}</span>
                            {roleLabels[user.role].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {user.username !== 'admin' ? (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 bg-red-50 p-2.5 rounded-lg hover:bg-red-100 transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Usuario protegido</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda de roles */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Permisos por Rol:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(roleLabels).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value.color}`}>
                        {value.icon} {value.label}
                      </span>
                      <span className="text-gray-500">{value.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h3>
                <p className="text-gray-500 text-sm">Completa la información del nuevo miembro del equipo</p>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👤 Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔑 Usuario de Acceso
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej: jperez"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">Sin espacios ni caracteres especiales</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔒 Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🎭 Rol / Cargo
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors bg-white"
                  >
                    <option value="admin">👑 Administrador - Acceso total</option>
                    <option value="supervisor">📊 Supervisor - Ventas, reportes e inventario</option>
                    <option value="cajero">💵 Cajero - Ventas y cobros</option>
                    <option value="mesero">🍽️ Mesero - Órdenes y cocina</option>
                    <option value="cocina">👨‍🍳 Cocina - Ver comandas</option>
                  </select>
                </div>

                {/* Info del rol seleccionado */}
                <div className={`p-4 rounded-xl ${roleLabels[role].color} border`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{roleLabels[role].icon}</span>
                    <span className="font-semibold">{roleLabels[role].label}</span>
                  </div>
                  <p className="text-sm opacity-80">{roleLabels[role].description}</p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg"
                  >
                    ✓ Crear Usuario
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManager;
