import { useMemo, useRef } from 'react';
import { Order } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface SalesReportModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
}

interface ProductSummary {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  image: string;
  category: string;
}

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#6366f1', '#84cc16'];

const categoryNames: { [key: string]: string } = {
  'comidas-rapidas': '🍔 Comidas Rápidas',
  'comida-ejecutiva': '🍛 Comida Ejecutiva',
  'mariscos': '🦐 Mariscos',
  'batidos': '🥤 Batidos',
  'bebidas': '🍾 Bebidas',
  'extras': '🍟 Extras'
};

export const SalesReportModal: React.FC<SalesReportModalProps> = ({ orders, isOpen, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Filtrar solo las órdenes pagadas del día de hoy
  const todayOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && order.status === 'paid';
    });
  }, [orders]);

  // Todos los productos vendidos (para el ranking general)
  const topProducts = useMemo(() => {
    const productMap = new Map<string, ProductSummary>();

    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.menuItem.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.quantity * item.menuItem.price;
        } else {
          productMap.set(item.menuItem.id, {
            id: item.menuItem.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            revenue: item.quantity * item.menuItem.price,
            image: item.menuItem.image,
            category: item.menuItem.category
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [todayOrders]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menuItem.category;
        const existing = categoryMap.get(category);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.quantity * item.menuItem.price;
        } else {
          categoryMap.set(category, {
            name: categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1),
            quantity: item.quantity,
            revenue: item.quantity * item.menuItem.price
          });
        }
      });
    });

    return Array.from(categoryMap.values());
  }, [todayOrders]);

  const hourlyData = useMemo(() => {
    const hourMap = new Map<number, number>();
    
    // Inicializar todas las horas del día de operación (6am - 10pm)
    for (let i = 6; i <= 22; i++) {
      hourMap.set(i, 0);
    }
    
    todayOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + order.total);
    });

    return Array.from(hourMap.entries())
      .map(([hour, total]) => ({
        hora: `${hour}:00`,
        ventas: total
      }));
  }, [todayOrders]);

  const totalRevenue = useMemo(() => {
    return todayOrders.reduce((sum, order) => sum + order.total, 0);
  }, [todayOrders]);

  const totalProducts = useMemo(() => {
    return todayOrders.reduce((sum, order) => 
      sum + order.items.reduce((s, i) => s + i.quantity, 0), 0
    );
  }, [todayOrders]);

  const averageTicket = useMemo(() => {
    if (todayOrders.length === 0) return 0;
    return totalRevenue / todayOrders.length;
  }, [todayOrders, totalRevenue]);

  const maxQuantity = useMemo(() => {
    return Math.max(...topProducts.map(p => p.quantity), 1);
  }, [topProducts]);

  const currentDate = new Date().toLocaleDateString('es-NI', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir el reporte');
      return;
    }

    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #f97316;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #f97316;
          font-size: 28px;
          margin-bottom: 5px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          padding: 15px;
          text-align: center;
        }
        .card-title {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        .card.green .card-value { color: #22c55e; }
        .card.blue .card-value { color: #3b82f6; }
        .card.purple .card-value { color: #8b5cf6; }
        .card.orange .card-value { color: #f97316; }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          font-size: 18px;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f97316;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
          font-size: 12px;
          text-transform: uppercase;
        }
        tr:hover {
          background: #f8f9fa;
        }
        .rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          font-weight: bold;
          font-size: 14px;
        }
        .rank-1 { background: #fef3c7; color: #d97706; }
        .rank-2 { background: #e5e7eb; color: #4b5563; }
        .rank-3 { background: #fed7aa; color: #c2410c; }
        .rank-other { background: #f3f4f6; color: #6b7280; }
        .product-name {
          font-weight: 500;
        }
        .product-emoji {
          font-size: 20px;
          margin-right: 8px;
        }
        .quantity-badge {
          background: #fff7ed;
          color: #ea580c;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
        }
        .revenue {
          font-weight: bold;
          color: #22c55e;
        }
        .category-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .category-item {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
        }
        .category-name {
          font-weight: 600;
          margin-bottom: 5px;
        }
        .category-stats {
          font-size: 13px;
          color: #666;
        }
        .category-revenue {
          font-weight: bold;
          color: #22c55e;
          font-size: 18px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          color: #666;
          font-size: 12px;
        }
        .progress-bar {
          height: 12px;
          background: #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #f97316, #ea580c);
          border-radius: 6px;
        }
        @media print {
          body { padding: 10px; }
          .summary-cards { grid-template-columns: repeat(4, 1fr); }
          .category-list { grid-template-columns: repeat(3, 1fr); }
        }
      </style>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Ventas - Cafetín Ali</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>☕ CAFETÍN ALI</h1>
          <p>📍 Malecón de Masaya, Masaya, Nicaragua</p>
          <p style="margin-top: 10px; font-size: 16px; font-weight: 600;">📊 REPORTE DE VENTAS DEL DÍA</p>
          <p>📅 ${currentDate}</p>
        </div>

        <div class="summary-cards">
          <div class="card green">
            <div class="card-title">💰 Total Ventas</div>
            <div class="card-value">C$ ${totalRevenue.toFixed(2)}</div>
          </div>
          <div class="card blue">
            <div class="card-title">📋 Órdenes</div>
            <div class="card-value">${todayOrders.length}</div>
          </div>
          <div class="card purple">
            <div class="card-title">🧾 Ticket Promedio</div>
            <div class="card-value">C$ ${averageTicket.toFixed(2)}</div>
          </div>
          <div class="card orange">
            <div class="card-title">🍽️ Productos</div>
            <div class="card-value">${totalProducts}</div>
          </div>
        </div>

        <div class="section">
          <h2>🏆 Top 10 Productos Más Vendidos</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">Pos.</th>
                <th>Producto</th>
                <th style="width: 80px; text-align: center;">Categoría</th>
                <th style="width: 120px; text-align: center;">Cantidad</th>
                <th style="width: 150px;">Popularidad</th>
                <th style="width: 120px; text-align: right;">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map((product, index) => `
                <tr>
                  <td>
                    <span class="rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other'}">
                      ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </span>
                  </td>
                  <td>
                    <span class="product-emoji">${product.image}</span>
                    <span class="product-name">${product.name}</span>
                  </td>
                  <td style="text-align: center; font-size: 11px;">${categoryNames[product.category] || product.category}</td>
                  <td style="text-align: center;">
                    <span class="quantity-badge">${product.quantity}</span>
                  </td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${(product.quantity / maxQuantity) * 100}%"></div>
                    </div>
                  </td>
                  <td class="revenue" style="text-align: right;">C$ ${product.revenue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📂 Ventas por Categoría</h2>
          <div class="category-list">
            ${categoryData.map(cat => `
              <div class="category-item">
                <div class="category-name">${cat.name}</div>
                <div class="category-stats">${cat.quantity} productos vendidos</div>
                <div class="category-revenue">C$ ${cat.revenue.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="footer">
          <p>📅 Reporte generado el ${new Date().toLocaleString('es-NI')}</p>
          <p>☕ Cafetín Ali - Sistema de Punto de Venta</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                📊 Reporte de Ventas del Día
              </h2>
              <p className="text-orange-100 text-sm">☕ Cafetín Ali - Malecón de Masaya, Nicaragua</p>
              <p className="text-orange-200 text-xs sm:text-sm mt-1">📅 {currentDate}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1" ref={printRef}>
          {/* Mensaje si no hay ventas */}
          {todayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-8xl mb-6">📭</span>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">¡Aún no hay ventas hoy!</h3>
              <p className="text-gray-500 text-center max-w-md">
                Cuando realices tu primera venta del día, aquí verás estadísticas detalladas de los productos más vendidos, 
                ingresos por categoría y horarios con más actividad.
              </p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                ¡Empezar a vender! 🚀
              </button>
            </div>
          ) : (
            <>
              {/* Tarjetas de Resumen */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-5 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs sm:text-sm font-medium">Total Ventas Hoy</p>
                      <p className="text-xl sm:text-3xl font-bold">C$ {totalRevenue.toFixed(2)}</p>
                    </div>
                    <span className="text-3xl sm:text-4xl opacity-80">💰</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-5 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm font-medium">Órdenes Completadas</p>
                      <p className="text-xl sm:text-3xl font-bold">{todayOrders.length}</p>
                    </div>
                    <span className="text-3xl sm:text-4xl opacity-80">📋</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-5 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs sm:text-sm font-medium">Ticket Promedio</p>
                      <p className="text-xl sm:text-3xl font-bold">
                        C$ {averageTicket.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-3xl sm:text-4xl opacity-80">🧾</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-5 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-xs sm:text-sm font-medium">Productos Vendidos</p>
                      <p className="text-xl sm:text-3xl font-bold">{totalProducts}</p>
                    </div>
                    <span className="text-3xl sm:text-4xl opacity-80">🍽️</span>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Gráfico de Barras - Productos más vendidos */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                    📊 Top 10 Productos Más Vendidos
                  </h3>
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value) => [`${value} unidades vendidas`, 'Cantidad']}
                          contentStyle={{ borderRadius: '8px' }}
                        />
                        <Bar dataKey="quantity" fill="#f97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <span className="text-5xl mb-3 block">📭</span>
                        <p>Sin datos de productos vendidos</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gráfico de Pastel - Ventas por Categoría */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                    🥧 Ingresos por Categoría
                  </h3>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${(name || '').toString().split(' ')[1] || name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`C$ ${Number(value).toFixed(2)}`, 'Ingresos']}
                          contentStyle={{ borderRadius: '8px' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <span className="text-5xl mb-3 block">📭</span>
                        <p>Sin datos de categorías</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Línea - Ventas por Hora */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-800 flex items-center gap-2">
                  📈 Ventas por Hora del Día
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  Identifica las horas con mayor actividad para optimizar tu personal
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={hourlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value) => [`C$ ${Number(value).toFixed(2)}`, 'Ventas']}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#16a34a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla de Top Productos */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-800 flex items-center gap-2">
                  🏆 Ranking de Productos del Día
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  Los productos estrella de hoy en Cafetín Ali
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="p-3 font-semibold rounded-l-lg">Pos.</th>
                        <th className="p-3 font-semibold">Producto</th>
                        <th className="p-3 font-semibold text-center hidden sm:table-cell">Cantidad</th>
                        <th className="p-3 font-semibold hidden md:table-cell">Popularidad</th>
                        <th className="p-3 font-semibold text-right rounded-r-lg">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.length > 0 ? (
                        topProducts.map((product, index) => (
                          <tr key={product.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                              <span className={`
                                flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                  index === 1 ? 'bg-gray-200 text-gray-700' : 
                                  index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}
                              `}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{product.image}</span>
                                <div>
                                  <span className="font-medium text-gray-800 block">{product.name}</span>
                                  <span className="text-xs text-gray-500 sm:hidden">{product.quantity} vendidos</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center hidden sm:table-cell">
                              <span className="bg-orange-100 text-orange-800 py-1 px-3 rounded-full text-sm font-bold">
                                {product.quantity}
                              </span>
                            </td>
                            <td className="p-3 hidden md:table-cell">
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all"
                                  style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-green-600">
                              C$ {product.revenue.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            <span className="text-4xl block mb-2">📊</span>
                            ¡Realiza tu primera venta para ver el ranking!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con botones */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            📅 Reporte generado: {new Date().toLocaleString('es-NI')}
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              disabled={todayOrders.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium
                ${todayOrders.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Imprimir Reporte</span>
              <span className="sm:hidden">Imprimir</span>
            </button>
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
