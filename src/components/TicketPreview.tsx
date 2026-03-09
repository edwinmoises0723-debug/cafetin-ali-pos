import { OrderItem, Table } from '../types';

interface TicketPreviewProps {
  table: Table | null;
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  orderNumber: string;
  paymentMethod?: string;
  customerName?: string;
  date?: Date;
}

export function TicketPreview({
  table,
  orderItems,
  subtotal,
  tax,
  tip,
  total,
  orderNumber,
  paymentMethod = 'efectivo',
  customerName = 'Cliente General',
  date = new Date()
}: TicketPreviewProps) {
  const currentDate = date.toLocaleDateString('es-NI', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  const currentTime = date.toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'EFECTIVO';
      case 'card': return 'TARJETA';
      case 'transfer': return 'TRANSFERENCIA';
      default: return method.toUpperCase();
    }
  };

  return (
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 font-mono text-xs" id="ticket-preview">
      {/* Header del Ticket */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="text-2xl mb-1">☕</div>
        <h2 className="text-lg font-bold">CAFETÍN ALI</h2>
        <p className="text-gray-600">Malecón de Masaya</p>
        <p className="text-gray-600">Masaya, Nicaragua</p>
        <p className="text-gray-500 text-[10px] mt-1">Tel: (505) 2522-XXXX</p>
        <p className="text-gray-500 text-[10px]">RUC: J0310000XXXXXX</p>
      </div>

      {/* Info de la Orden */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 space-y-1">
        <div className="text-center mb-2">
          <span className="bg-gray-100 px-2 py-1 rounded font-bold">TICKET DE VENTA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Fecha:</span>
          <span className="font-medium">{currentDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Hora:</span>
          <span className="font-medium">{currentTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Orden #:</span>
          <span className="font-bold">{orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Mesa:</span>
          <span className="font-medium">{table?.name || 'Para llevar'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cliente:</span>
          <span className="font-medium">{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Atendido por:</span>
          <span className="font-medium">Cajero 1</span>
        </div>
      </div>

      {/* Título de Items */}
      <div className="border-b border-dashed border-gray-400 pb-1 mb-2">
        <div className="flex justify-between font-bold text-[10px]">
          <span className="w-8">CANT</span>
          <span className="flex-1 px-1">DESCRIPCIÓN</span>
          <span className="w-12 text-right">P.UNIT</span>
          <span className="w-14 text-right">TOTAL</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 space-y-1">
        {orderItems.map((item, index) => (
          <div key={index} className="flex justify-between text-[11px]">
            <span className="w-8 text-center">{item.quantity}</span>
            <span className="flex-1 px-1 truncate">{item.menuItem.name}</span>
            <span className="w-12 text-right">C${item.menuItem.price.toFixed(0)}</span>
            <span className="w-14 text-right font-medium">
              C${(item.menuItem.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>C$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (15%):</span>
          <span>C$ {tax.toFixed(2)}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between">
            <span>Propina:</span>
            <span>C$ {tip.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-400">
          <span>TOTAL:</span>
          <span>C$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Método de Pago */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="flex justify-between font-medium">
          <span>Forma de pago:</span>
          <span className="font-bold">
            {getPaymentMethodName(paymentMethod)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-600 space-y-1">
        <p>================================</p>
        <p className="font-bold text-sm">¡Gracias por su visita!</p>
        <p className="text-[11px]">Es un placer atenderle</p>
        <p className="text-[11px]">Vuelva pronto a Cafetín Ali</p>
        <p className="mt-2">================================</p>
        <p className="text-[9px] text-gray-400 mt-2">Este documento es un comprobante</p>
        <p className="text-[9px] text-gray-400">de consumo interno</p>
        <p className="text-[10px] mt-2 font-medium">Síguenos en redes: @CafetinAli</p>
      </div>
    </div>
  );
}
