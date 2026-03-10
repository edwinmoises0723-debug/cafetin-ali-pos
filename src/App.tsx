import { useState, useMemo, useEffect } from 'react';
import { MenuItem, Order, OrderItem, Table, PausedOrder, KitchenOrder, User } from './types';
import { categories, menuItems as initialMenuItems, initialTables } from './data/menuData';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { MenuGrid } from './components/MenuGrid';
import { OrderPanel } from './components/OrderPanel';
import { TableSelector } from './components/TableSelector';
import { CheckoutModal } from './components/CheckoutModal';
import { SalesReportModal } from './components/SalesReportModal';
import { KitchenView } from './components/KitchenView';
import { ProductManager } from './components/ProductManager';
import { InventoryModal } from './components/InventoryModal';
import Login from './components/Login';
import UserManager from './components/UserManager';
import HelpModal from './components/HelpModal';
import { supabase } from './lib/supabase';
import Footer from './components/Footer';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserManager, setShowUserManager] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const storedUser = localStorage.getItem('pos_current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    // Close restricted views
    setShowReports(false);
    setShowInventory(false);
    setShowProductManager(false);
    setShowUserManager(false);
  };

  // State
  const [products, setProducts] = useState<MenuItem[]>(initialMenuItems);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  
  // Modals Visibility
  const [showTableSelector, setShowTableSelector] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [showKitchen, setShowKitchen] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showProductManager, setShowProductManager] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showSupabaseConfig, setShowSupabaseConfig] = useState<boolean>(false);
  
  // Mobile/Tablet: Order panel minimized state
  const [isOrderPanelMinimized, setIsOrderPanelMinimized] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPausedOrder, setIsPausedOrder] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Sales tracking
  const [totalSales, setTotalSales] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  
  // Paused orders
  const [pausedOrders, setPausedOrders] = useState<PausedOrder[]>([]);
  
  // Kitchen orders
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);

  // Auto-minimize on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setIsOrderPanelMinimized(true);
      } else {
        setIsOrderPanelMinimized(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Permissions based on role
  const canManageUsers = currentUser?.role === 'admin';
  const canViewReports = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const canViewInventory = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const canManageProducts = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    let items = products;
    
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [products, selectedCategory, searchQuery]);

  // Calculate totals
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  
  // Calculate Tax (15% only on taxable items)
  const taxableSubtotal = orderItems.reduce(
    (sum, item) => (item.menuItem.hasTax ? sum + item.menuItem.price * item.quantity : sum),
    0
  );
  const tax = taxableSubtotal * 0.15;
  
  const tip = subtotal * (tipPercentage / 100);
  const total = subtotal + tax + tip;

  // Handlers for Products & Inventory
  const handleAddProduct = (newProduct: MenuItem) => {
    setProducts(prev => [...prev, newProduct]);
    showNotification('success', '✅ ¡Producto agregado correctamente!');
  };

  const handleUpdateProduct = (updatedProduct: MenuItem) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    showNotification('success', '✅ ¡Producto actualizado correctamente!');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showNotification('success', '🗑️ Producto eliminado correctamente');
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  // Handlers for Orders
  const handleAddItem = (menuItem: MenuItem) => {
    // Check Stock
    const currentInCart = orderItems.find(item => item.menuItem.id === menuItem.id)?.quantity || 0;
    if ((menuItem.stock || 0) - currentInCart <= 0) {
      showNotification('error', `⚠️ ¡Ups! No hay suficiente ${menuItem.name} en stock`);
      return;
    }

    setOrderItems((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1, status: 'pending' }];
    });

    // If no table selected, prompt to select one
    if (!selectedTable && orderItems.length === 0) {
      setShowTableSelector(true);
    }

    // On mobile, show panel briefly
    if (isOrderPanelMinimized) {
      // Just show notification, panel stays minimized
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    // Check stock for increase
    const item = orderItems.find(i => i.menuItem.id === itemId);
    if (item && quantity > item.quantity) {
      const product = products.find(p => p.id === itemId);
      if (product && (product.stock || 0) < quantity) {
        showNotification('error', `⚠️ Stock insuficiente. Solo hay ${product.stock} disponibles.`);
        return;
      }
    }

    setOrderItems((prev) =>
      prev.map((item) =>
        item.menuItem.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.menuItem.id !== itemId));
  };

  const handleAddNote = (itemId: string, note: string) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.menuItem.id === itemId ? { ...item, notes: note } : item
      )
    );
    showNotification('success', '📝 Nota agregada al producto');
  };

  const handleClearOrder = () => {
    const confirmed = window.confirm('⚠️ ¿Deseas cancelar esta orden?\n\nTodos los productos serán removidos.');
    if (confirmed) {
      setOrderItems([]);
      setTipPercentage(10);
      setIsPausedOrder(false);
      if (selectedTable) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === selectedTable.id ? { ...t, status: 'available' } : t
          )
        );
        // Remove from paused orders if exists
        setPausedOrders(prev => prev.filter(po => po.table.id !== selectedTable.id));
        setSelectedTable(null);
      }
      showNotification('info', '🗑️ Orden cancelada');
    }
  };

  const handleSelectTable = (table: Table) => {
    // Update previous table to available if there was one
    if (selectedTable && selectedTable.id !== table.id) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTable.id ? { ...t, status: 'available' } : t
        )
      );
    }
    
    // Set new table as occupied
    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id ? { ...t, status: 'occupied' } : t
      )
    );
    setSelectedTable({ ...table, status: 'occupied' });
    setIsPausedOrder(false);
    showNotification('success', `🪑 ¡${table.name} seleccionada!`);
  };

  const handleChangeTableStatus = (tableId: number, status: Table['status']) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, status } : t
      )
    );
    
    const statusMessages = {
      available: '✅ Mesa disponible',
      reserved: '📅 Mesa reservada',
      occupied: '🍽️ Mesa ocupada',
      paused: '⏸️ Venta pausada'
    };
    
    showNotification('info', statusMessages[status]);
  };

  const handlePauseOrder = () => {
    if (!selectedTable || orderItems.length === 0) {
      showNotification('error', '⚠️ Selecciona una mesa y agrega productos para pausar la venta');
      return;
    }

    const pausedOrder: PausedOrder = {
      id: Date.now().toString(),
      table: selectedTable,
      items: [...orderItems],
      subtotal,
      tax,
      tip,
      total,
      tipPercentage,
      createdAt: new Date(),
    };

    // Check if there's already a paused order for this table
    setPausedOrders(prev => {
      const existing = prev.findIndex(po => po.table.id === selectedTable.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = pausedOrder;
        return updated;
      }
      return [...prev, pausedOrder];
    });

    // Update table status to paused
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id ? { ...t, status: 'paused' } : t
      )
    );

    // Clear current order
    setOrderItems([]);
    setTipPercentage(10);
    setSelectedTable(null);
    setIsPausedOrder(false);

    showNotification('success', `⏸️ ¡Venta pausada!\n\n${selectedTable.name} puede disfrutar y pagar después.`);
  };

  const handleResumePausedOrder = (pausedOrder: PausedOrder) => {
    // Set the order items from the paused order
    setOrderItems(pausedOrder.items);
    setTipPercentage(pausedOrder.tipPercentage);
    setSelectedTable(pausedOrder.table);
    setIsPausedOrder(true);

    // Update table status back to occupied
    setTables((prev) =>
      prev.map((t) =>
        t.id === pausedOrder.table.id ? { ...t, status: 'occupied' } : t
      )
    );
    
    showNotification('info', `▶️ Retomando orden de ${pausedOrder.table.name}`);
  };

  const handleSendToKitchen = () => {
    if (orderItems.length === 0) {
      showNotification('error', '⚠️ Agrega productos antes de enviar a cocina');
      return;
    }
    if (!selectedTable) {
      showNotification('info', '🪑 Primero selecciona una mesa');
      setShowTableSelector(true);
      return;
    }

    const newKitchenOrder: KitchenOrder = {
      id: Date.now().toString(),
      orderId: `ORD-${Date.now()}`,
      tableNumber: selectedTable.id,
      tableName: selectedTable.name,
      items: orderItems.map(item => ({ ...item, status: 'pending' as const })),
      status: 'pending',
      createdAt: new Date(),
      priority: 'normal',
    };

    setKitchenOrders(prev => [...prev, newKitchenOrder]);

    // Update item status to show they're sent to kitchen
    setOrderItems(prev => prev.map(item => ({ ...item, status: 'preparing' as const })));

    showNotification('success', `🍳 ¡Comanda enviada!\n\n${selectedTable.name} • ${orderItems.length} productos`);
  };

  const handleUpdateKitchenOrderStatus = (orderId: string, status: KitchenOrder['status']) => {
    setKitchenOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );

    if (status === 'ready') {
      // Find the order and update items in current order if it's the same table
      const kitchenOrder = kitchenOrders.find(o => o.id === orderId);
      if (kitchenOrder && selectedTable?.id === kitchenOrder.tableNumber) {
        setOrderItems(prev =>
          prev.map(item => ({ ...item, status: 'ready' as const }))
        );
      }
      showNotification('success', `✅ ¡Orden lista para servir!`);
    }
  };

  const handleUpdateKitchenItemStatus = (orderId: string, itemId: string, status: OrderItem['status']) => {
    setKitchenOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map(item =>
                item.menuItem.id === itemId ? { ...item, status } : item
              ),
            }
          : order
      )
    );
  };

  const handleSaveSupabaseConfig = (url: string, key: string) => {
    initSupabase(url, key);
    showNotification('success', '☁️ Conexión con Supabase guardada correctamente');
  };

  const handleCheckout = () => {
    if (orderItems.length > 0) {
      setShowCheckout(true);
    } else {
      showNotification('error', '⚠️ Agrega productos para poder cobrar');
    }
  };

  const handleConfirmPayment = (paymentMethod: string, customerName: string) => {
    // 1. Create completed order
    const newOrder: Order = {
      id: Date.now().toString(),
      tableNumber: selectedTable?.id || 0,
      tableName: selectedTable?.name || 'Sin mesa',
      items: orderItems,
      status: 'paid',
      createdAt: new Date(),
      subtotal,
      tax,
      tip,
      total,
      paymentMethod: paymentMethod as 'cash' | 'card' | 'transfer',
      customerName
    };

    setCompletedOrders(prev => [...prev, newOrder]);

    // 2. Decrease Stock
    const updatedProducts = [...products];
    orderItems.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.menuItem.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stock: Math.max(0, (updatedProducts[productIndex].stock || 0) - item.quantity)
        };
      }
    });
    setProducts(updatedProducts);

    // 3. Update sales stats
    setTotalSales((prev) => prev + total);
    setOrdersCount((prev) => prev + 1);

    // 4. Remove related kitchen orders
    if (selectedTable) {
      setKitchenOrders(prev => prev.filter(ko => ko.tableNumber !== selectedTable.id));
    }

    // 5. Remove from paused orders if exists
    if (selectedTable) {
      setPausedOrders(prev => prev.filter(po => po.table.id !== selectedTable.id));
    }

    // 6. Clear order
    setOrderItems([]);
    setTipPercentage(10);
    setIsPausedOrder(false);
    
    // 7. Free up table
    if (selectedTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTable.id ? { ...t, status: 'available' } : t
        )
      );
      setSelectedTable(null);
    }
    
    setShowCheckout(false);

    const paymentMethodText = paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia';
    showNotification('success', `🎉 ¡Venta completada!\n\nCliente: ${customerName}\nTotal: C$ ${total.toFixed(2)}\nPago: ${paymentMethodText}\n\n¡Gracias por visitar Cafetín Ali!`);
  };

  // Kitchen View
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (showKitchen) {
    return (
      <KitchenView
        orders={kitchenOrders}
        onUpdateOrderStatus={handleUpdateKitchenOrderStatus}
        onUpdateItemStatus={handleUpdateKitchenItemStatus}
        onClose={() => setShowKitchen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] max-w-sm p-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="flex-1">
              <p className="font-medium whitespace-pre-line text-sm">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserManager={() => setShowUserManager(true)}
        selectedTable={selectedTable}
        onOpenTableSelector={() => setShowTableSelector(true)}
        onOpenReports={() => setShowReports(true)}
        onOpenKitchen={() => setShowKitchen(true)}
        onOpenInventory={() => setShowInventory(true)}
        onOpenProductManager={() => setShowProductManager(true)}
        onOpenHelp={() => setShowHelp(true)}
        totalSales={totalSales}
        ordersCount={ordersCount}
        kitchenOrders={kitchenOrders}
        pausedOrdersCount={pausedOrders.length}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Menu Section */}
        <div className={`flex-1 flex flex-col p-4 md:p-6 overflow-hidden transition-all duration-300 ${
          !isOrderPanelMinimized ? 'lg:mr-0' : ''
        }`}>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-base"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <CategoryBar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Menu Grid */}
          <div className={`flex-1 overflow-y-auto ${isOrderPanelMinimized ? 'pb-24' : ''}`}>
            {filteredItems.length > 0 ? (
              <MenuGrid items={filteredItems} onAddItem={handleAddItem} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-6xl mb-4">🔍</span>
                <p className="text-xl">No se encontraron productos</p>
                <p className="text-sm mt-1">Intenta con otro término</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Ver todos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Panel - Desktop */}
        <div className={`hidden lg:block w-96 flex-shrink-0 transition-all duration-300 ${
          isOrderPanelMinimized ? 'w-0 overflow-hidden' : ''
        }`}>
          <OrderPanel
            selectedTable={selectedTable}
            orderItems={orderItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
            onCheckout={handleCheckout}
            onPauseOrder={handlePauseOrder}
            onSendToKitchen={handleSendToKitchen}
            tipPercentage={tipPercentage}
            onTipChange={setTipPercentage}
            onAddNote={handleAddNote}
            isPaused={isPausedOrder}
            isMinimized={false}
            onToggleMinimize={() => setIsOrderPanelMinimized(true)}
          />
        </div>

        {/* Order Panel - Mobile/Tablet (Minimizable) */}
        <div className="lg:hidden">
          {isOrderPanelMinimized ? (
            <OrderPanel
              selectedTable={selectedTable}
              orderItems={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearOrder={handleClearOrder}
              onCheckout={handleCheckout}
              onPauseOrder={handlePauseOrder}
              onSendToKitchen={handleSendToKitchen}
              tipPercentage={tipPercentage}
              onTipChange={setTipPercentage}
              onAddNote={handleAddNote}
              isPaused={isPausedOrder}
              isMinimized={true}
              onToggleMinimize={() => setIsOrderPanelMinimized(false)}
            />
          ) : (
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOrderPanelMinimized(true)}>
              <div 
                className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <OrderPanel
                  selectedTable={selectedTable}
                  orderItems={orderItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearOrder={handleClearOrder}
                  onCheckout={handleCheckout}
                  onPauseOrder={handlePauseOrder}
                  onSendToKitchen={handleSendToKitchen}
                  tipPercentage={tipPercentage}
                  onTipChange={setTipPercentage}
                  onAddNote={handleAddNote}
                  isPaused={isPausedOrder}
                  isMinimized={false}
                  onToggleMinimize={() => setIsOrderPanelMinimized(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTableSelector && (
        <TableSelector
          tables={tables}
          selectedTable={selectedTable}
          pausedOrders={pausedOrders}
          onSelectTable={handleSelectTable}
          onChangeTableStatus={handleChangeTableStatus}
          onResumePausedOrder={handleResumePausedOrder}
          onClose={() => setShowTableSelector(false)}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          table={selectedTable}
          orderItems={orderItems}
          subtotal={subtotal}
          tax={tax}
          tip={tip}
          total={total}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
      
      {showReports && canViewReports && (
        <SalesReportModal
          isOpen={showReports}
          onClose={() => setShowReports(false)}
          orders={completedOrders}
        />
      )}

      {showInventory && canViewInventory && (
        <InventoryModal
          products={products}
          onUpdateStock={handleUpdateStock}
          onClose={() => setShowInventory(false)}
        />
      )}

      {showProductManager && canManageProducts && (
        <ProductManager
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onClose={() => setShowProductManager(false)}
        />
      )}

      {showUserManager && canManageUsers && (
        <UserManager
          onClose={() => setShowUserManager(false)}
        />
      )}

      {showHelp && (
        <HelpModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          onOpenSupabaseConfig={() => setShowSupabaseConfig(true)}
        />
      )}
      
      {showSupabaseConfig && (
        <SupabaseConfigModal
          isOpen={showSupabaseConfig}
          onClose={() => setShowSupabaseConfig(false)}
          onSave={handleSaveSupabaseConfig}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
