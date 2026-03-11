import { useState, useMemo, useEffect } from 'react';
import { MenuItem, Order, OrderItem, Table, PausedOrder, KitchenOrder, User } from './types';
import { categories } from './data/menuData'; // Solo las categorías quedan locales
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
import { Loader2 } from 'lucide-react';

function App() {
  // --- ESTADOS DE CONTROL ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); // Para evitar error #418
  const [loading, setLoading] = useState(true); // Para esperar a Supabase

  // --- ESTADOS DE DATOS (Inician vacíos) ---
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
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
  
  const [isOrderPanelMinimized, setIsOrderPanelMinimized] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 1. EFECTO DE HIDRATACIÓN Y AUTH
  useEffect(() => {
    const storedUser = localStorage.getItem('pos_current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsHydrated(true);
  }, []);

  // 2. CARGA DE DATOS DESDE SUPABASE
  useEffect(() => {
    if (isHydrated && currentUser) {
      const loadAppData = async () => {
        setLoading(true);
        try {
          // Traer Productos
          const { data: prodData } = await supabase.from('products').select('*').order('name');
          // Traer Mesas
          const { data: tableData } = await supabase.from('tables').select('*').order('id');
          
          if (prodData) setProducts(prodData);
          if (tableData) setTables(tableData);
        } catch (err) {
          console.error("Error cargando datos:", err);
        } finally {
          setLoading(false);
        }
      };
      loadAppData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  // --- HANDLERS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setShowReports(false);
    setShowInventory(false);
    setShowProductManager(false);
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Lógica de filtrado
  const filteredItems = useMemo(() => {
    let items = products;
    if (selectedCategory !== 'all') items = items.filter(i => i.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return items;
  }, [products, selectedCategory, searchQuery]);

  // Cálculos de totales
  const subtotal = orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxableSubtotal = orderItems.reduce((sum, item) => (item.menuItem.hasTax ? sum + item.menuItem.price * item.quantity : sum), 0);
  const tax = taxableSubtotal * 0.15;
  const tip = subtotal * (tipPercentage / 100);
  const total = subtotal + tax + tip;

  // Renderizado condicional para evitar errores de Hydration
  if (!isHydrated) return null;

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
        <p className="mt-4 text-gray-600 font-bold animate-pulse">Sincronizando Cafetín Alí...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowReports={() => setShowReports(true)}
        onShowInventory={() => setShowInventory(true)}
        onShowProductManager={() => setShowProductManager(true)}
        onShowUserManager={() => setShowUserManager(true)}
        onShowKitchen={() => setShowKitchen(true)}
        onShowHelp={() => setShowHelp(true)}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isOrderPanelMinimized ? 'w-full' : 'lg:mr-96'}`}>
          <CategoryBar 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full p-3 rounded-xl border shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <MenuGrid 
              items={filteredItems}
              onAddItem={(item) => {
                const inCart = orderItems.find(i => i.menuItem.id === item.id)?.quantity || 0;
                if ((item.stock || 0) - inCart <= 0) {
                  showNotification('error', '⚠️ Sin stock suficiente');
                  return;
                }
                setOrderItems(prev => {
                  const exist = prev.find(i => i.menuItem.id === item.id);
                  if (exist) return prev.map(i => i.menuItem.id === item.id ? {...i, quantity: i.quantity + 1} : i);
                  return [...prev, { menuItem: item, quantity: 1, status: 'pending' }];
                });
              }}
            />
          </div>
        </div>

        <OrderPanel 
          orderItems={orderItems}
          subtotal={subtotal}
          tax={tax}
          tip={tip}
          total={total}
          selectedTable={selectedTable}
          onUpdateQuantity={(id, q) => setOrderItems(prev => q <= 0 ? prev.filter(i => i.menuItem.id !== id) : prev.map(i => i.menuItem.id === id ? {...i, quantity: q} : i))}
          onRemoveItem={(id) => setOrderItems(prev => prev.filter(i => i.menuItem.id !== id))}
          onCheckout={() => setShowCheckout(true)}
          onClear={() => { setOrderItems([]); setSelectedTable(null); }}
        />
      </main>

      {/* MODALES */}
      {showCheckout && (
        <CheckoutModal 
          table={selectedTable}
          orderItems={orderItems}
          subtotal={subtotal}
          tax={tax}
          tip={tip}
          total={total}
          onClose={() => setShowCheckout(false)}
          onConfirm={() => {
            showNotification('success', '✅ Venta realizada con éxito');
            setOrderItems([]);
            setSelectedTable(null);
            setShowCheckout(false);
          }}
        />
      )}

      {/* Resto de modales (UserManager, ProductManager, etc.) se activan aquí de forma similar */}
      
      {notification && (
        <div className={`fixed bottom-20 right-4 p-4 rounded-xl shadow-2xl z-50 animate-bounce ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-bold`}>
          {notification.message}
        </div>
      )}
      
      <Footer />
    </div>
  );
}

export default App;
