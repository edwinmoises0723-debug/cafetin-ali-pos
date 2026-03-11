import { useState, useMemo, useEffect } from 'react';
import { MenuItem, Order, OrderItem, Table, User } from './types';
import { categories } from './data/menuData'; // Solo las categorías se mantienen locales
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
  // --- ESTADOS DE CONTROL Y SEGURIDAD ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); // Evita error de hidratación en Vercel
  const [loading, setLoading] = useState(true); // Espera a que Supabase responda

  // --- ESTADOS DE DATOS (Vacíos al iniciar) ---
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Estados de UI
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Visibilidad de Modales
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showKitchen, setShowKitchen] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // 1. EFECTO INICIAL: Hidratación y Sesión
  useEffect(() => {
    const storedUser = localStorage.getItem('pos_current_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('pos_current_user');
      }
    }
    setIsHydrated(true);
  }, []);

  // 2. EFECTO: Cargar Productos y Mesas de Supabase
  useEffect(() => {
    if (isHydrated && currentUser) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [resProducts, resTables] = await Promise.all([
            supabase.from('products').select('*').order('name'),
            supabase.from('tables').select('*').order('id')
          ]);

          if (resProducts.data) setProducts(resProducts.data);
          if (resTables.data) setTables(resTables.data);
        } catch (err) {
          console.error("Error sincronizando con la nube:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  // --- MANEJADORES DE EVENTOS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
    // Al loguear, el useEffect de carga se disparará automáticamente
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setOrderItems([]);
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- LÓGICA DE FILTRADO Y CÁLCULOS ---
  const filteredItems = useMemo(() => {
    let items = products;
    if (selectedCategory !== 'all') items = items.filter(i => i.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [products, selectedCategory, searchQuery]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxableSubtotal = orderItems.reduce((sum, item) => (item.menuItem.hasTax ? sum + item.menuItem.price * item.quantity : sum), 0);
  const tax = taxableSubtotal * 0.15;
  const tip = subtotal * (tipPercentage / 100);
  const total = subtotal + tax + tip;

  // --- RENDERIZADO ---

  // A. Evitar choque de versiones (Hydration)
  if (!isHydrated) return null;

  // B. Si no hay sesión, mostrar el Login corregido
  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // C. Si está cargando datos de Supabase
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Sincronizando Cafetín Alí...</h2>
        <p className="text-gray-500">Esto solo tomará un momento</p>
      </div>
    );
  }

  // D. Interfaz Principal
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
        {/* Lado Izquierdo: Menú */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryBar 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full p-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <MenuGrid 
              items={filteredItems}
              onAddItem={(item) => {
                const inCart = orderItems.find(i => i.menuItem.id === item.id)?.quantity || 0;
                if ((item.stock || 0) - inCart <= 0) {
                  showNotification('error', '❌ ¡Sin stock!');
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

        {/* Lado Derecho: Panel de Orden */}
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

      {/* MODALES CLAVE */}
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
            showNotification('success', '✅ Venta guardada exitosamente');
            setOrderItems([]);
            setSelectedTable(null);
            setShowCheckout(false);
          }}
        />
      )}

      {showUserManager && <UserManager onClose={() => setShowUserManager(false)} />}
      {showProductManager && <ProductManager onClose={() => setShowProductManager(false)} />}
      
      {/* Notificaciones flotantes */}
      {notification && (
        <div className={`fixed bottom-24 right-4 p-4 rounded-2xl shadow-2xl z-50 animate-bounce ${
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
