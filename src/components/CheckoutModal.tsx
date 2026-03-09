import { useState } from 'react';
import { OrderItem, Table } from '../types';
import { printTicket } from '../utils/printerUtils';
import { TicketPreview } from './TicketPreview';

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

  const handleFinalConfirm = () => {
    if (!validatePayment()) {
      return;
    }
    onConfirm(paymentMethod, customerName || 'Cliente General');
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
    return true; // Para tarjeta y transferencia siempre se puede confirmar
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex">
        {/* Panel Principal */}
        <div className={`flex-1 flex flex-col ${showTicketPreview ? 'border-r border-gray-200' : ''}`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  💳 Cerrar Venta
                </h2>
                {table && <p className="text-green-100">{table.name}</p>}
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

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Nombre del Cliente */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                👤 Información del Cliente
              </h3>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente (opcional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Resumen de Orden */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                📋 Resumen de la Orden
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      <span className="mr-1">{item.menuItem.image}</span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span className="font-medium">
                      C$ {(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>C$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA (16%)</span>
                  <span>C$ {tax.toFixed(2)}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Propina</span>
                    <span>C$ {tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2">
                  <span>TOTAL A PAGAR</span>
                  <span className="text-green-600">C$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">💰 Método de Pago</h3>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setValidationError('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-sm font-medium">{method.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculadora de Cambio (solo para efectivo) */}
            {paymentMethod === 'cash' && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">🧮 Calcular Cambio</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Efectivo recibido del cliente</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => {
                        setCashReceived(e.target.value);
                        setValidationError('');
                      }}
                      placeholder="Ingrese el monto recibido"
                      className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl text-xl font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[50, 100, 200, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setCashReceived(amount.toString());
                          setValidationError('');
                        }}
                        className="py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        C$ {amount}
                      </button>
                    ))}
                  </div>
                  {cashReceivedNum >= total && cashReceivedNum > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="text-sm text-green-600">✅ Cambio a devolver al cliente</div>
                      <div className="text-3xl font-bold text-green-700">C$ {change.toFixed(2)}</div>
                    </div>
                  )}
                  {cashReceivedNum > 0 && cashReceivedNum < total && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="text-sm text-amber-600">⚠️ Falta por cobrar al cliente</div>
                      <div className="text-3xl font-bold text-amber-700">
                        C$ {(total - cashReceivedNum).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mensaje de validación */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-medium">{validationError}</p>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            {/* Estado de Bluetooth */}
            {bluetoothStatus !== 'idle' && (
              <div className={`text-center py-2 px-4 rounded-lg text-sm font-medium mb-2 ${
                bluetoothStatus === 'connecting' ? 'bg-blue-100 text-blue-700' :
                bluetoothStatus === 'connected' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {bluetoothStatus === 'connecting' && '🔄 Conectando a impresora Bluetooth...'}
                {bluetoothStatus === 'connected' && '✅ ¡Ticket enviado correctamente a la impresora!'}
                {bluetoothStatus === 'error' && '⚠️ No se pudo conectar vía Bluetooth. Se abrió la impresión del sistema.'}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTicketPreview(!showTicketPreview)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                👁️ {showTicketPreview ? 'Ocultar' : 'Ver'} Ticket
              </button>
              <button
                onClick={handlePrintBluetooth}
                disabled={isPrinting}
                className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPrinting ? '🔄 Conectando...' : '🖨️ Imprimir'}
              </button>
            </div>
            <button
              onClick={handleFinalConfirm}
              disabled={!canConfirm()}
              className={`w-full py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 ${
                canConfirm()
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canConfirm() 
                ? `✅ CONFIRMAR PAGO - C$ ${total.toFixed(2)}`
                : paymentMethod === 'cash' 
                  ? '💵 Ingrese el efectivo recibido para continuar'
                  : `✅ CONFIRMAR PAGO - C$ ${total.toFixed(2)}`
              }
            </button>
            {paymentMethod === 'cash' && !canConfirm() && (
              <p className="text-center text-sm text-gray-500">
                ℹ️ Debe ingresar el efectivo recibido del cliente para poder cerrar la venta
              </p>
            )}
          </div>
        </div>

        {/* Panel de Preview de Ticket */}
        {showTicketPreview && (
          <div className="w-80 flex flex-col bg-gray-100">
            <div className="p-4 bg-gray-800 text-white">
              <h3 className="font-bold flex items-center gap-2">
                🧾 Vista Previa del Ticket
              </h3>
              <p className="text-xs text-gray-300 mt-1">Impresora Térmica 58mm</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TicketPreview
                table={table}
                orderItems={orderItems}
                subtotal={subtotal}
                tax={tax}
                tip={tip}
                total={total}
                orderNumber={orderNumber}
                paymentMethod={paymentMethod}
                customerName={customerName || 'Cliente General'}
                date={currentDate}
              />
            </div>
            <div className="p-3 bg-gray-200 border-t">
              <button
                onClick={handlePrintBluetooth}
                disabled={isPrinting}
                className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isPrinting ? '🔄 Enviando...' : '📲 Enviar a Impresora'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
