import { Table, KitchenOrder, User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenUserManager: () => void;
  selectedTable: Table | null;
  onOpenTableSelector: () => void;
  onOpenReports: () => void;
  onOpenKitchen: () => void;
  onOpenInventory: () => void;
  onOpenProductManager: () => void;
  onOpenHelp: () => void;
  totalSales: number;
  ordersCount: number;
  kitchenOrders: KitchenOrder[];
  pausedOrdersCount: number;
}

export function Header({ 
  currentUser,
  onLogout,
  onOpenUserManager,
  selectedTable, 
  onOpenTableSelector, 
  onOpenReports,
  onOpenKitchen,
  onOpenInventory,
  onOpenProductManager,
  onOpenHelp,
  totalSales, 
  ordersCount,
  kitchenOrders,
  pausedOrdersCount
}: HeaderProps) {
  const currentTime = new Date().toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const currentDate = new Date().toLocaleDateString('es-NI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const pendingKitchenOrders = kitchenOrders.filter(o => o.status === 'pending').length;
  const preparingKitchenOrders = kitchenOrders.filter(o => o.status === 'preparing').length;

  // Definir permisos por rol
  const canManageUsers = currentUser?.role === 'admin';
  const canViewReports = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const canViewInventory = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const canManageProducts = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Obtener etiqueta del rol
  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'admin': return '👑 Administrador';
      case 'supervisor': return '📊 Supervisor';
      case 'cajero': return '💵 Cajero';
      case 'mesero': return '🍽️ Mesero';
      case 'cocina': return '👨‍🍳 Cocina';
      default: return role;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        {/* Logo y nombre */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl md:text-3xl">☕</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Cafetín Ali</h1>
            <p className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
              📍 Malecón de Masaya, Nicaragua
            </p>
            <p className="text-xs text-gray-400 capitalize hidden md:block">{currentDate} • {currentTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          
          {/* User Info & Logout */}
          <div className="flex flex-col items-end mr-1 md:mr-2">
             <span className="text-xs md:text-sm font-bold text-gray-700 truncate max-w-[80px] md:max-w-none">
               {currentUser?.name}
             </span>
             <div className="flex gap-2 items-center">
               <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
                 {getRoleLabel(currentUser?.role)}
               </span>
               <button 
                 onClick={onLogout} 
                 className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
               >
                 Salir
               </button>
             </div>
          </div>

          {/* User Manager Button - Only Admin */}
          {canManageUsers && (
            <button
              onClick={onOpenUserManager}
              className="flex flex-col items-center justify-center p-2 md:p-3 rounded-xl bg-purple-100 hover:bg-purple-200 transition-colors"
              title="Gestionar Usuarios"
            >
              <span className="text-xl md:text-2xl">👥</span>
              <span className="text-xs font-semibold text-purple-700 hidden lg:block">Usuarios</span>
            </button>
          )}

          {/* Kitchen Button - Visible for everyone */}
          <button
            onClick={onOpenKitchen}
            className="relative flex flex-col items-center justify-center p-2 md:p-3 rounded-xl bg-red-100 hover:bg-red-200 transition-colors"
            title="Ver Cocina"
          >
            <span className="text-xl md:text-2xl">👨‍🍳</span>
            <span className="text-xs font-semibold text-red-700 hidden lg:block">Cocina</span>
            {(pendingKitchenOrders > 0 || preparingKitchenOrders > 0) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingKitchenOrders + preparingKitchenOrders}
              </span>
            )}
          </button>

          {/* Inventory Button - Admin & Supervisor */}
          {canViewInventory && (
            <button
              onClick={onOpenInventory}
              className="flex flex-col items-center justify-center p-2 md:p-3 rounded-xl bg-teal-100 hover:bg-teal-200 transition-colors"
              title="Ver Inventario"
            >
              <span className="text-xl md:text-2xl">📦</span>
              <span className="text-xs font-semibold text-teal-700 hidden lg:block">Stock</span>
            </button>
          )}

          {/* Products Button - Admin & Supervisor */}
          {canManageProducts && (
            <button
              onClick={onOpenProductManager}
              className="flex flex-col items-center justify-center p-2 md:p-3 rounded-xl bg-yellow-100 hover:bg-yellow-200 transition-colors"
              title="Gestionar Productos"
            >
              <span className="text-xl md:text-2xl">🍔</span>
              <span className="text-xs font-semibold text-yellow-700 hidden lg:block">Productos</span>
            </button>
          )}

          {/* Reports Button - Admin & Supervisor */}
          {canViewReports && (
            <button
              onClick={onOpenReports}
              className="flex flex-col items-center justify-center p-2 md:p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors"
              title="Ver Reportes"
            >
              <span className="text-xl md:text-2xl">📊</span>
              <span className="text-xs font-semibold text-blue-700 hidden lg:block">Reportes</span>
            </button>
          )}

          {/* Help Button - Visible for everyone */}
          <button
            onClick={onOpenHelp}
            className="flex flex-col items-center justify-center p-2 md:p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Ayuda e Instalación"
          >
            <span className="text-xl md:text-2xl">❓</span>
            <span className="text-xs font-semibold text-gray-700 hidden lg:block">Ayuda</span>
          </button>

          {/* Stats - Hide on mobile */}
          <div className="hidden xl:flex items-center gap-6 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-xl border border-gray-200">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">C$ {totalSales.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Ventas del día</p>
            </div>
            <div className="text-center border-l border-gray-300 pl-4">
              <p className="text-xl font-bold text-orange-600">{ordersCount}</p>
              <p className="text-xs text-gray-500">Órdenes</p>
            </div>
            {pausedOrdersCount > 0 && (
              <div className="text-center border-l border-gray-300 pl-4">
                <p className="text-xl font-bold text-blue-600 animate-pulse">{pausedOrdersCount}</p>
                <p className="text-xs text-gray-500">Pausadas</p>
              </div>
            )}
          </div>

          {/* Table Selector */}
          <button
            onClick={onOpenTableSelector}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
          >
            <span className="text-lg md:text-xl">🪑</span>
            <div className="text-left">
              <p className="font-semibold text-sm md:text-base">
                {selectedTable ? selectedTable.name : 'Mesa'}
              </p>
              <p className="text-xs text-orange-100 hidden sm:block">
                {selectedTable ? `${selectedTable.seats} personas` : 'Seleccionar'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
