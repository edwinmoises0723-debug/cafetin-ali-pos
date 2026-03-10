import { useState } from 'react';
import { OrderItem, Table } from '../types';
import { printTicket } from '../utils/printerUtils';
import { TicketPreview } from './TicketPreview';
// 1. IMPORTAMOS SUPABASE
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  table: Table | null;
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  onClose: () => void;
  onConfirm: (paymentMethod: string, customerName: string) => void;
}

export function CheckoutModal({
  table,
  orderItems,
  subtotal,
  tax,
  tip,
  total,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string>('');

  const orderNumber = Date.now().toString().slice(-8);
  const currentDate = new Date();

  const handlePrintBluetooth = async () => {
    setIsPrinting(true);
    setBluetoothStatus('connecting');
    
    const tempOrder: any = {
      id: orderNumber,
      tableNumber: table?.id || 0,
      items: orderItems,
      subtotal,
      tax,
      tip,
      total,
      paymentMethod,
      customerName: customerName || 'Cliente General',
      createdAt: currentDate
    };
    
    const success = await printTicket(tempOrder);
    
    if (success) {
      setBluetoothStatus('connected');
      setTimeout(() => setBluetoothStatus('idle'), 2000);
    } else {
      setBluetoothStatus('error');
      setTimeout(() => setBluetoothStatus('idle'), 3000);
    }
    
    setIsPrinting(false);
  };

  const validatePayment = (): boolean => {
    setValidationError('');

    if (paymentMethod === 'cash') {
      const cashReceivedNum = parseFloat(cashReceived) || 0;
      if (cashReceivedNum <= 0) {
        setValidationError('💰 Por favor, ingrese la cantidad de efectivo recibida');
        return false;
      }
      if (cashReceivedNum < total) {
        setValidationError(`💵 El efectivo recibido (C$ ${cashReceivedNum.toFixed(2)}) es menor al total a pagar (C$ ${total.toFixed(2)})`);
        return false;
      }
    }

    return true;
  };

  // 2. FUNCIÓN DE GUARDADO EN SUPABASE (MODIFICADA)
  const handleFinalConfirm = async () => {
    if (!validatePayment()) {
      return;
    }

    setIsPrinting(true); // Usamos el estado de carga mientras guarda

    try {
      // A. Guardar la venta principal
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          customer_name: customerName || 'Cliente General',
          total: total,
          subtotal: subtotal,
          tax: tax,
          tip: tip,
          payment_method: paymentMethod,
          table_id: table?.id || null,
          status: 'completed'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // B. Guardar los productos de la venta (sale_items)
      const itemsToInsert = orderItems.map(item => ({
        sale_id: sale.id,
        product_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // C. Si todo salió bien, cerramos y confirmamos
      onConfirm(paymentMethod, customerName || 'Cliente General');
      
    } catch (error: any) {
      console.error('Error al guardar venta:', error);
      alert('❌ Error al guardar en la nube: ' + error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  const paymentMethods = [
    { id: 'cash', name: 'Efectivo', icon: '💵' },
    { id: 'card', name: 'Tarjeta', icon: '💳' },
    { id: 'transfer', name: 'Transferencia', icon: '📱' },
  ];

  const canConfirm = () => {
    if (paymentMethod === 'cash') {
      return cashReceivedNum >= total;
    }
    return true; 
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex">
        <div className={`flex-1 flex flex-col ${showTicketPreview ? 'border-r border-gray-200' : ''}`}>
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">💳 Cerrar Venta</h2>
                {table && <p className="opacity-90">{table.name}</p>}
              </div>
              <button onClick={onClose} className="hover:bg-white/20 rounded-full p-2">
                <svg xmlns="http://www.w3.org" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">👤 Información del Cliente</h3>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente (opcional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3">📋 Resumen de la Orden</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span className="font-medium">C$ {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>TOTAL A PAGAR</span>
                  <span className="text-green-600">C$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">💰 Método de Pago</h3>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-sm font-medium">{method.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <h3 className="font-semibold text-orange-800 mb-3">🧮 Efectivo Recibido</h3>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full text-2xl font-bold p-3 rounded-lg border-2 border-orange-200 outline-none"
                  placeholder="0.00"
                />
                {cashReceivedNum >= total && (
                  <div className="mt-3 flex justify-between items-center text-orange-800">
                    <span className="font-medium">Cambio:</span>
                    <span className="text-2xl font-bold">C$ {change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {validationError}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex gap-3">
             <button
              onClick={handleFinalConfirm}
              disabled={!canConfirm() || isPrinting}
              className={`flex-1 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
                canConfirm() && !isPrinting ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isPrinting ? 'Guardando...' : 'Confirmar Venta ✅'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
