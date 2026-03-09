import { KitchenOrder, OrderItem } from '../types';
import { useState } from 'react';

interface KitchenViewProps {
  orders: KitchenOrder[];
  onUpdateOrderStatus: (orderId: string, status: KitchenOrder['status']) => void;
  onUpdateItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  onClose: () => void;
}

export function KitchenView({ 
  orders, 
  onUpdateOrderStatus, 
  onUpdateItemStatus,
  onClose 
}: KitchenViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'preparing':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'ready':
        return 'bg-green-100 border-green-400 text-green-700';
    }
  };

  const getStatusIcon = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending':
        return '🔴';
      case 'preparing':
        return '🟡';
      case 'ready':
        return '🟢';
    }
  };

  const getPriorityColor = (priority: KitchenOrder['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white animate-pulse';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'normal':
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">👨‍🍳</span>
              COCINA - Cafetín Ali
            </h1>
            <div className="flex gap-2">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {pendingCount} Pendientes
              </span>
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {preparingCount} En Preparación
              </span>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {readyCount} Listos
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Salir de Cocina
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-white text-purple-700' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🔴 Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'preparing' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🟡 Preparando ({preparingCount})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ready' 
                ? 'bg-green-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🟢 Listos ({readyCount})
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-8xl mb-4">👨‍🍳</span>
            <p className="text-2xl">No hay órdenes {filter !== 'all' ? `${filter === 'pending' ? 'pendientes' : filter === 'preparing' ? 'en preparación' : 'listas'}` : ''}</p>
            <p className="text-lg mt-2">Las nuevas comandas aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${getStatusColor(order.status)}`}
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        {order.tableName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Orden #{order.orderId.slice(-6)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(order.priority)}`}>
                      {order.priority === 'urgent' ? '🔥 URGENTE' : order.priority === 'high' ? '⚡ Alta' : 'Normal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">⏱️ Hace {getTimeSince(order.createdAt)}</span>
                    <span className="font-medium text-gray-700">{order.items.length} items</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                  {order.items.map((item) => (
                    <div 
                      key={item.menuItem.id} 
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        item.status === 'ready' 
                          ? 'bg-green-50 line-through text-gray-400' 
                          : item.status === 'preparing'
                          ? 'bg-yellow-50'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.menuItem.image}</span>
                        <div>
                          <span className="font-medium text-gray-800">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-orange-600 font-medium">
                              📝 {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newStatus = item.status === 'pending' 
                            ? 'preparing' 
                            : item.status === 'preparing' 
                            ? 'ready' 
                            : 'pending';
                          onUpdateItemStatus(order.id, item.menuItem.id, newStatus);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          item.status === 'ready'
                            ? 'bg-green-500 text-white'
                            : item.status === 'preparing'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {item.status === 'ready' ? '✓' : item.status === 'preparing' ? '⏳' : '○'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>👨‍🍳</span> COMENZAR PREPARACIÓN
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✅</span> MARCAR COMO LISTO
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <div className="text-center py-3 bg-green-100 text-green-700 font-bold rounded-lg">
                      🔔 LISTO PARA ENTREGAR
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio notification for new orders */}
      {pendingCount > 0 && (
        <div className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-xl animate-bounce">
          <span className="text-2xl">🔔</span>
          <span className="ml-2 font-bold">{pendingCount} nuevas</span>
        </div>
      )}
    </div>
  );
}
