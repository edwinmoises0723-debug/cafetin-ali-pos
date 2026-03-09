import { Order } from '../types';

// Comandos ESC/POS para impresoras térmicas
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@'; // Inicializar impresora
const NL = '\x0A'; // Nueva línea
const CENTER = ESC + 'a' + '\x01'; // Alinear al centro
const LEFT = ESC + 'a' + '\x00'; // Alinear a la izquierda
// const RIGHT = ESC + 'a' + '\x02'; // Alinear a la derecha (reservado para uso futuro)
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_HEIGHT = GS + '!' + '\x01';
const NORMAL_SIZE = GS + '!' + '\x00';
const CUT_PAPER = GS + 'V' + '\x00'; // Cortar papel

// UUIDs comunes para impresoras Bluetooth térmicas
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Servicio de impresora genérico
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Algunos modelos de impresoras
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // UUID alternativo
];

const PRINTER_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb', // Característica de escritura genérica
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Característica alternativa
];

// Función para formatear texto para ticket de 58mm (32 caracteres por línea)
const formatLine = (text: string, maxLength: number = 32): string => {
  return text.substring(0, maxLength);
};

const formatTwoColumns = (left: string, right: string, width: number = 32): string => {
  const rightLen = right.length;
  const leftLen = width - rightLen - 1;
  return left.substring(0, leftLen).padEnd(leftLen) + ' ' + right;
};

const dividerLine = (char: string = '-', length: number = 32): string => {
  return char.repeat(length);
};

export const generateTicketData = (order: Order): string => {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('es-NI');
  const timeStr = date.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  
  let data = '';
  
  // Inicializar impresora
  data += INIT;
  
  // Encabezado
  data += CENTER;
  data += DOUBLE_HEIGHT;
  data += BOLD_ON + 'CAFETIN ALI' + BOLD_OFF + NL;
  data += NORMAL_SIZE;
  data += 'Malecon de Masaya' + NL;
  data += 'Masaya, Nicaragua' + NL;
  data += 'Tel: (505) 2522-XXXX' + NL;
  data += dividerLine('=') + NL;
  
  // Información de la orden
  data += LEFT;
  data += formatTwoColumns('Fecha:', dateStr) + NL;
  data += formatTwoColumns('Hora:', timeStr) + NL;
  data += formatTwoColumns('Mesa:', order.tableNumber > 0 ? `Mesa ${order.tableNumber}` : 'Para llevar') + NL;
  data += formatTwoColumns('Orden:', `#${order.id.slice(-8)}`) + NL;
  data += dividerLine('-') + NL;
  
  // Encabezado de items
  data += BOLD_ON;
  data += formatLine('CANT  DESCRIPCION        TOTAL') + NL;
  data += BOLD_OFF;
  data += dividerLine('-') + NL;
  
  // Items
  order.items.forEach(item => {
    const qty = item.quantity.toString().padStart(2);
    const name = item.menuItem.name.substring(0, 18).padEnd(18);
    const total = `C$${(item.menuItem.price * item.quantity).toFixed(2)}`.padStart(8);
    data += `${qty}x  ${name} ${total}` + NL;
  });
  
  data += dividerLine('-') + NL;
  
  // Totales
  data += formatTwoColumns('Subtotal:', `C$ ${order.subtotal.toFixed(2)}`) + NL;
  data += formatTwoColumns('IVA (16%):', `C$ ${order.tax.toFixed(2)}`) + NL;
  if (order.tip > 0) {
    data += formatTwoColumns('Propina:', `C$ ${order.tip.toFixed(2)}`) + NL;
  }
  data += dividerLine('-') + NL;
  
  data += BOLD_ON + DOUBLE_HEIGHT;
  data += formatTwoColumns('TOTAL:', `C$ ${order.total.toFixed(2)}`) + NL;
  data += NORMAL_SIZE + BOLD_OFF;
  
  // Método de pago
  data += NL;
  const paymentMethodText = order.paymentMethod === 'cash' ? 'EFECTIVO' : 
                            order.paymentMethod === 'card' ? 'TARJETA' : 'TRANSFERENCIA';
  data += formatTwoColumns('Pago:', paymentMethodText) + NL;
  
  data += dividerLine('=') + NL;
  
  // Pie de página
  data += CENTER;
  data += NL;
  data += 'Gracias por su visita!' + NL;
  data += 'Vuelva pronto a Cafetin Ali' + NL;
  data += NL;
  data += 'Este documento no es valido' + NL;
  data += 'como factura fiscal' + NL;
  data += NL;
  data += dividerLine('=') + NL;
  data += NL + NL + NL;
  
  // Cortar papel (si la impresora lo soporta)
  data += CUT_PAPER;
  
  return data;
};

export const printTicket = async (order: Order): Promise<boolean> => {
  console.log("Iniciando impresión para orden:", order.id);

  // Verificar soporte de Web Bluetooth API
  // @ts-ignore - Navigator.bluetooth es experimental
  if (!navigator.bluetooth) {
    console.warn("Bluetooth no soportado en este navegador");
    // Fallback: abrir ventana de impresión del sistema
    printFallback(order);
    return false;
  }

  try {
    console.log('Buscando dispositivos Bluetooth...');
    
    // @ts-ignore
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS
    });

    console.log('Dispositivo seleccionado:', device.name);
    console.log('Conectando a GATT Server...');
    
    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error('No se pudo conectar al servidor GATT');
    }

    console.log('Buscando servicio de impresión...');
    
    let service = null;
    for (const uuid of PRINTER_SERVICE_UUIDS) {
      try {
        service = await server.getPrimaryService(uuid);
        console.log('Servicio encontrado:', uuid);
        break;
      } catch {
        continue;
      }
    }

    if (!service) {
      throw new Error('No se encontró el servicio de impresión');
    }

    console.log('Buscando característica de escritura...');
    
    let characteristic = null;
    for (const uuid of PRINTER_CHARACTERISTIC_UUIDS) {
      try {
        characteristic = await service.getCharacteristic(uuid);
        console.log('Característica encontrada:', uuid);
        break;
      } catch {
        continue;
      }
    }

    if (!characteristic) {
      // Intentar obtener todas las características y buscar una escribible
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          characteristic = char;
          break;
        }
      }
    }

    if (!characteristic) {
      throw new Error('No se encontró característica de escritura');
    }

    // Generar datos del ticket
    const ticketData = generateTicketData(order);
    const encoder = new TextEncoder();
    const data = encoder.encode(ticketData);
    
    // Enviar datos en chunks (máximo 20 bytes por escritura para BLE)
    const CHUNK_SIZE = 20;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
      // Pequeña pausa entre chunks para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('Ticket enviado exitosamente');
    
    // Desconectar
    await device.gatt?.disconnect();
    
    return true;

  } catch (error) {
    console.error("Error imprimiendo por Bluetooth:", error);
    // Fallback a impresión del sistema
    printFallback(order);
    return false;
  }
};

// Función de fallback para imprimir usando el sistema
const printFallback = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) {
    window.print();
    return;
  }

  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('es-NI');
  const timeStr = date.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  const paymentMethodText = order.paymentMethod === 'cash' ? 'Efectivo' : 
                            order.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket - Cafetín Ali</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          width: 58mm; 
          padding: 5mm;
          line-height: 1.4;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .total-row { font-size: 14px; font-weight: bold; margin-top: 5px; }
        .item-row { margin: 3px 0; }
        .footer { margin-top: 10px; font-size: 10px; }
        @media print {
          body { width: 58mm; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="title">☕ CAFETÍN ALI</div>
        <div>Malecón de Masaya</div>
        <div>Masaya, Nicaragua</div>
        <div>Tel: (505) 2522-XXXX</div>
      </div>
      <div class="divider"></div>
      <div class="row"><span>Fecha:</span><span>${dateStr}</span></div>
      <div class="row"><span>Hora:</span><span>${timeStr}</span></div>
      <div class="row"><span>Mesa:</span><span>${order.tableNumber > 0 ? 'Mesa ' + order.tableNumber : 'Para llevar'}</span></div>
      <div class="row"><span>Orden:</span><span>#${order.id.slice(-8)}</span></div>
      <div class="divider"></div>
      <div class="bold">CANT  DESCRIPCIÓN</div>
      <div class="divider"></div>
      ${order.items.map(item => `
        <div class="item-row">
          <div>${item.quantity}x ${item.menuItem.name}</div>
          <div style="text-align: right;">C$ ${(item.menuItem.price * item.quantity).toFixed(2)}</div>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="row"><span>Subtotal:</span><span>C$ ${order.subtotal.toFixed(2)}</span></div>
      <div class="row"><span>IVA (16%):</span><span>C$ ${order.tax.toFixed(2)}</span></div>
      ${order.tip > 0 ? `<div class="row"><span>Propina:</span><span>C$ ${order.tip.toFixed(2)}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row total-row"><span>TOTAL:</span><span>C$ ${order.total.toFixed(2)}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Pago:</span><span class="bold">${paymentMethodText}</span></div>
      <div class="divider"></div>
      <div class="center footer">
        <div>¡Gracias por su visita!</div>
        <div>Vuelva pronto a Cafetín Ali</div>
        <br>
        <div style="font-size: 9px;">Este documento no es válido</div>
        <div style="font-size: 9px;">como factura fiscal</div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
