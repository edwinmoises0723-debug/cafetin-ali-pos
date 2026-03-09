import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupabaseConfig?: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onOpenSupabaseConfig }) => {
  const [activeTab, setActiveTab] = useState<'install' | 'data' | 'backup'>('install');

  if (!isOpen) return null;

  const exportData = () => {
    const data = {
      users: localStorage.getItem('cafetin_users'),
      products: localStorage.getItem('cafetin_products'),
      orders: localStorage.getItem('cafetin_orders'),
      salesHistory: localStorage.getItem('cafetin_sales_history'),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafetin-ali-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('✅ Respaldo descargado exitosamente');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.users) localStorage.setItem('cafetin_users', data.users);
        if (data.products) localStorage.setItem('cafetin_products', data.products);
        if (data.orders) localStorage.setItem('cafetin_orders', data.orders);
        if (data.salesHistory) localStorage.setItem('cafetin_sales_history', data.salesHistory);
        
        alert('✅ Datos restaurados exitosamente. La página se recargará.');
        window.location.reload();
      } catch (error) {
        alert('❌ Error al leer el archivo de respaldo');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❓</span>
              <div>
                <h2 className="text-2xl font-bold">Centro de Ayuda</h2>
                <p className="text-blue-100">Instalación, datos y respaldos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'install'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📱 Instalación
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'data'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💾 Base de Datos
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'backup'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📦 Respaldos
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'install' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  📱 Instalar en Android (Chrome)
                </h3>
                <ol className="space-y-2 text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Abre la aplicación en <strong>Google Chrome</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Toca el menú <strong>⋮</strong> (tres puntos) en la esquina superior derecha</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                    <span>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">4</span>
                    <span>Confirma la instalación tocando <strong>"Instalar"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">5</span>
                    <span>¡Listo! El ícono de <strong>Cafetín Ali</strong> aparecerá en tu pantalla de inicio</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  🍎 Instalar en iPhone/iPad (Safari)
                </h3>
                <ol className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Abre la aplicación en <strong>Safari</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                    <span>Desplázate y selecciona <strong>"Agregar a pantalla de inicio"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">4</span>
                    <span>Toca <strong>"Agregar"</strong> en la esquina superior derecha</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                  💻 Instalar en PC (Windows/Mac/Linux)
                </h3>
                <ol className="space-y-2 text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Abre la aplicación en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Busca el ícono de <strong>instalación</strong> (⊕) en la barra de direcciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                    <span>O ve al menú <strong>⋮</strong> → <strong>"Instalar Cafetín Ali"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">4</span>
                    <span>Se creará un acceso directo en tu escritorio y menú de inicio</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                  💾 Almacenamiento de Datos
                </h3>
                <p className="text-amber-700 mb-4">
                  Aquí puedes configurar dónde se guardan tus datos. Por defecto se usa este dispositivo, 
                  pero puedes conectarte a la nube para sincronizar.
                </p>
                
                {onOpenSupabaseConfig && (
                  <button
                    onClick={() => {
                      onOpenSupabaseConfig();
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg mb-4"
                  >
                    <span className="text-xl">☁️</span>
                    Configurar Conexión Nube (Supabase)
                  </button>
                )}

                <ul className="space-y-2 text-amber-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">✓</span>
                    <span><strong>Local:</strong> Funciona sin internet, datos solo en este equipo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span><strong>Nube:</strong> Sincroniza múltiples equipos, respaldos automáticos.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  📊 Datos que se almacenan
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <span className="text-2xl">👥</span>
                    <p className="font-medium text-purple-800">Usuarios</p>
                    <p className="text-sm text-purple-600">Cuentas y roles</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <span className="text-2xl">🍔</span>
                    <p className="font-medium text-purple-800">Productos</p>
                    <p className="text-sm text-purple-600">Menú y precios</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <span className="text-2xl">📦</span>
                    <p className="font-medium text-purple-800">Inventario</p>
                    <p className="text-sm text-purple-600">Stock actual</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <span className="text-2xl">🧾</span>
                    <p className="font-medium text-purple-800">Ventas</p>
                    <p className="text-sm text-purple-600">Historial de órdenes</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  📤 Exportar Datos (Crear Respaldo)
                </h3>
                <p className="text-green-700 mb-4">
                  Descarga todos tus datos en un archivo JSON que podrás guardar en tu computadora, 
                  Google Drive, USB, etc.
                </p>
                <button
                  onClick={exportData}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="text-xl">💾</span>
                  Descargar Respaldo Ahora
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                  📥 Importar Datos (Restaurar Respaldo)
                </h3>
                <p className="text-blue-700 mb-4">
                  Restaura tus datos desde un archivo de respaldo previamente creado.
                </p>
                <label className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                  <span className="text-xl">📂</span>
                  Seleccionar Archivo de Respaldo
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                  ⚠️ Recomendaciones Importantes
                </h3>
                <ul className="space-y-2 text-red-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">📅</span>
                    <span>Crea respaldos <strong>diariamente</strong> al cerrar el local</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">☁️</span>
                    <span>Guarda los respaldos en <strong>Google Drive</strong> o <strong>Dropbox</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🔄</span>
                    <span>Antes de restaurar, <strong>crea un respaldo</strong> de los datos actuales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">📱</span>
                    <span>Si usas varios dispositivos, restaura el <strong>respaldo más reciente</strong> en cada uno</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 text-center text-gray-500 text-sm">
          <p>Sistema desarrollado por <strong>Ing. Edwin Nicaragua</strong></p>
          <p>Versión 1.0.0 | © 2024 Cafetín Ali</p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
