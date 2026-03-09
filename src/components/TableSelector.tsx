import { Table, PausedOrder } from '../types';
import { useState } from 'react';

interface TableSelectorProps {
  tables: Table[];
  selectedTable: Table | null;
  pausedOrders: PausedOrder[];
  onSelectTable: (table: Table) => void;
  onChangeTableStatus: (tableId: number, status: Table['status']) => void;
  onResumePausedOrder: (pausedOrder: PausedOrder) => void;
  onClose: () => void;
}

export function TableSelector({ 
  tables, 
  selectedTable, 
  pausedOrders,
  onSelectTable, 
  onChangeTableStatus,
  onResumePausedOrder,
  onClose 
}: TableSelectorProps) {
  const [showStatusMenu, setShowStatusMenu] = useState<number | null>(null);

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200';
      case 'occupied':
        return 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200';
      case 'paused':
        return 'bg-blue-100 border-blue-400 text-blue-700 hover:bg-blue-200';
    }
  };

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return '✅';
      case 'occupied':
        return '🍽️';
      case 'reserved':
        return '📅';
      case 'paused':
        return '⏸️';
    }
  };

  const getStatusLabel = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'paused':
        return 'Venta Pausada';
    }
  };

  const handleTableClick = (table: Table) => {
    // Si tiene una venta pausada, preguntar si quiere retomarla
    const pausedOrder = pausedOrders.find(po => po.table.id === table.id);
    if (pausedOrder) {
      onResumePausedOrder(pausedOrder);
      onClose();
      return;
    }

    // Si está disponible o reservada, seleccionar
    if (table.status === 'available' || table.status === 'reserved') {
      onSelectTable(table);
      onClose();
    }
  };

  const handleStatusChange = (tableId: number, newStatus: Table['status']) => {
    onChangeTableStatus(tableId, newStatus);
    setShowStatusMenu(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">🪑 Gestión de Mesas</h2>
              <p className="text-orange-100 text-sm mt-1">Selecciona una mesa o cambia su estado</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Legend */}
          <div className="flex gap-4 mb-6 flex-wrap bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-400"></span>
              <span className="text-sm text-gray-600">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-400"></span>
              <span className="text-sm text-gray-600">Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-400"></span>
              <span className="text-sm text-gray-600">Reservada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-blue-400"></span>
              <span className="text-sm text-gray-600">Venta Pausada</span>
            </div>
          </div>

          {/* Pauseed Orders Alert */}
          {pausedOrders.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                <span>⏸️</span> Ventas Pausadas ({pausedOrders.length})
              </h3>
              <p className="text-sm text-blue-600 mb-3">
                Haz clic en una mesa con venta pausada para retomarla
              </p>
              <div className="flex flex-wrap gap-2">
                {pausedOrders.map(po => (
                  <button
                    key={po.id}
                    onClick={() => {
                      onResumePausedOrder(po);
                      onClose();
                    }}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    {po.table.name} - C$ {po.total.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tables Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto">
            {tables.map((table) => {
              const hasPausedOrder = pausedOrders.some(po => po.table.id === table.id);
              
              return (
                <div key={table.id} className="relative">
                  <button
                    onClick={() => handleTableClick(table)}
                    disabled={table.status === 'occupied' && !hasPausedOrder}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${getStatusColor(table.status)} ${
                      selectedTable?.id === table.id ? 'ring-4 ring-orange-500 ring-offset-2' : ''
                    } ${table.status === 'occupied' && !hasPausedOrder ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-3xl mb-2">{getStatusIcon(table.status)}</div>
                    <div className="font-bold">{table.name}</div>
                    <div className="text-sm opacity-75">{table.seats} personas</div>
                    <div className="text-xs mt-1 font-medium">{getStatusLabel(table.status)}</div>
                    
                    {hasPausedOrder && (
                      <div className="mt-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Venta pendiente
                      </div>
                    )}
                  </button>

                  {/* Status Menu Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusMenu(showStatusMenu === table.id ? null : table.id);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ⚙️
                  </button>

                  {/* Status Dropdown Menu */}
                  {showStatusMenu === table.id && (
                    <div className="absolute top-10 right-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden min-w-[160px]">
                      <div className="p-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-medium text-gray-500">Cambiar estado</span>
                      </div>
                      {table.status !== 'available' && !hasPausedOrder && (
                        <button
                          onClick={() => handleStatusChange(table.id, 'available')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2"
                        >
                          <span>✅</span> Disponible
                        </button>
                      )}
                      {table.status !== 'reserved' && table.status !== 'occupied' && !hasPausedOrder && (
                        <button
                          onClick={() => handleStatusChange(table.id, 'reserved')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 flex items-center gap-2"
                        >
                          <span>📅</span> Reservada
                        </button>
                      )}
                      {table.status === 'reserved' && (
                        <button
                          onClick={() => handleStatusChange(table.id, 'occupied')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2"
                        >
                          <span>🍽️</span> Ocupar Mesa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
