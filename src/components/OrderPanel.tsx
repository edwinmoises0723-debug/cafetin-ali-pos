import { OrderItem, Table } from '../types';
import { useState } from 'react';

interface OrderPanelProps {
  selectedTable: Table | null;
  orderItems: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
  onCheckout: () => void;
  onPauseOrder: () => void;
  onSendToKitchen: () => void;
  tipPercentage: number;
  onTipChange: (tip: number) => void;
  onAddNote: (itemId: string, note: string) => void;
  isPaused?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function OrderPanel({
  selectedTable,
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onCheckout,
  onPauseOrder,
  onSendToKitchen,
  tipPercentage,
  onTipChange,
  onAddNote,
  isPaused = false,
  isMinimized = false,
  onToggleMinimize
}: OrderPanelProps) {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  
  const taxableSubtotal = orderItems.reduce(
    (sum, item) => (item.menuItem.hasTax ? sum + item.menuItem.price * item.quantity : sum),
    0
  );
  
  const tax = taxableSubtotal * 0.15;
  const tip = subtotal * (tipPercentage / 100);
  const total = subtotal + tax + tip;

  const tipOptions = [0, 10, 15, 20];
  const itemsCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSaveNote = (itemId: string) => {
    onAddNote(itemId, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  // Vista minimizada para móvil/tablet
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-500 shadow-2xl z-40 safe-area-inset-bottom">
        <button
          onClick={onToggleMinimize}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 text-white"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div className="text-left">
              <p className="font-bold">
                {selectedTable ? selectedTable.name : 'Orden Actual'}
              </p>
              <p className="text-sm text-orange-100">
                {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-orange-100">Total</p>
              <p className="font-bold text-lg">C$ {total.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col border-l border-gray-200 relative">
      {/* Header con botón de minimizar */}
      <div className={`p-4 border-b border-gray-200 ${isPaused ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botón minimizar */}
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Minimizar panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedTable ? `📋 ${selectedTable.name}` : '📋 Orden Actual'}
              </h2>
              {selectedTable && (
                <p className="text-white/80 text-sm">
                  {selectedTable.seats} personas • {isPaused ? '⏸️ Pausada' : 'Activa'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaused && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-medium animate-pulse">
                ⏸️ PAUSADA
              </span>
            )}
            {orderItems.length > 0 && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-medium">
                {itemsCount} items
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {orderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-6xl mb-4">🛒</span>
            <p className="text-center font-medium">No hay productos en la orden</p>
            <p className="text-sm text-center mt-1">Selecciona productos del menú para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div
                key={item.menuItem.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <span className="mr-2 text-lg">{item.menuItem.image}</span>
                    <span className="font-medium text-gray-800">{item.menuItem.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      C$ {item.menuItem.price.toFixed(2)} c/u
                      {item.menuItem.hasTax && <span className="ml-1 text-orange-500">(+IVA)</span>}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                        📝 {item.notes}
                      </p>
                    )}
                    {item.status && item.status !== 'pending' && (
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'ready' ? 'bg-green-100 text-green-700' :
                        item.status === 'delivered' ? 'bg-blue-100 text-blue-700' : ''
                      }`}>
                        {item.status === 'preparing' ? '👨‍🍳 Preparando' :
                         item.status === 'ready' ? '✅ Listo' :
                         item.status === 'delivered' ? '🍽️ Entregado' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingNote(item.menuItem.id);
                        setNoteText(item.notes || '');
                      }}
                      className="text-orange-400 hover:text-orange-600 transition-colors p-1 hover:bg-orange-50 rounded"
                      title="Agregar nota"
                    >
                      📝
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.menuItem.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Note Editor */}
                {editingNote === item.menuItem.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ej: Sin cebolla, extra queso..."
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveNote(item.menuItem.id)}
                      className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingNote(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-gray-800 text-lg">
                    C$ {(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip Selection */}
      {orderItems.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-600 mb-2">💝 Propina</p>
          <div className="flex gap-2">
            {tipOptions.map((tipVal) => (
              <button
                key={tipVal}
                onClick={() => onTipChange(tipVal)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tipPercentage === tipVal
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tipVal}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>C$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IVA (15%)</span>
            <span>C$ {tax.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Propina ({tipPercentage}%)</span>
              <span>C$ {tip.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold text-gray-800 pt-3 border-t border-gray-300">
            <span>TOTAL</span>
            <span className="text-orange-600">C$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2 bg-white border-t border-gray-200">
        {/* Enviar a Cocina */}
        <button
          onClick={onSendToKitchen}
          disabled={orderItems.length === 0}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-xl">👨‍🍳</span>
          ENVIAR A COCINA
        </button>

        {/* Botones de Pausar y Cerrar Venta */}
        <div className="flex gap-2">
          {/* Pausar Venta */}
          <button
            onClick={onPauseOrder}
            disabled={orderItems.length === 0 || !selectedTable}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            <span className="text-lg">⏸️</span>
            <span className="text-sm">PAUSAR</span>
          </button>

          {/* Cerrar Venta */}
          <button
            onClick={onCheckout}
            disabled={orderItems.length === 0}
            className="flex-[2] py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-xl shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <span className="text-lg">💳</span>
            CERRAR VENTA
          </button>
        </div>

        {/* Cancelar Orden */}
        <button
          onClick={onClearOrder}
          disabled={orderItems.length === 0}
          className="w-full py-2 bg-white text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200 flex items-center justify-center gap-2 text-sm"
        >
          <span>🗑️</span>
          Cancelar Orden
        </button>
      </div>
    </div>
  );
}
