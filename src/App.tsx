import { useState, useMemo, useEffect } from 'react';
import { MenuItem, OrderItem, Table, User, Category } from './types';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { MenuGrid } from './components/MenuGrid';
import { OrderPanel } from './components/OrderPanel';
import { TableSelector } from './components/TableSelector';
import { CheckoutModal } from './components/CheckoutModal';
import Login from './components/Login';
import UserManager from './components/UserManager';
import ProductManager from './components/ProductManager';
import { supabase } from './lib/supabase';
import Footer from './components/Footer';
import { Loader2 } from 'lucide-react';

function App() {
  // --- ESTADOS DE CONTROL ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE DATOS (Sincronizados con Supabase) ---
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // UI States
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modales
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);

  // 1. HIDRATACIÓN: Cargar sesión guardada al abrir la página
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

  // 2. CARGA DE DATOS: Traer todo de Supabase una vez logueado
  useEffect(() => {
    if (isHydrated && currentUser) {
      const loadAppData = async () => {
        setLoading(true);
        try {
          const [resProd, resTable, resCats] = await Promise.all([
            supabase.from('products').select('*').order('name'),
            supabase.from('tables').select('*').order('id'),
            supabase.from('categories').select('*').order('name')
          ]);

          setProducts(resProd.data || []);
          setTables(resTable.data || []);
          setCategories(resCats.data || []);
        } catch (err) {
          console.error("Error sincronizando datos:", err);
        } finally {
          setLoading(false);
        }
      };
      loadAppData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  // --- MANEJADORES ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setOrderItems([]);
  };

  // --- LÓGICA DE FILTRADO (PROTEGIDA CONTRA ERRORES) ---
  const filteredItems = useMemo(() => {
    // Si products es null o undefined, usamos una lista vacía [] para evitar error de .filter()
    const items = products || [];
    
    let result = items;
    if (selectedCategory !== 'all') {
      result = result.filter(i => i.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  // --- CÁLCULOS ---
  const total = orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  // --- RENDERIZADO CONDICIONAL ---
  if (!isHydrated) return null;

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Sincronizando Cafetín Alí...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
        onShowUserManager={() => setShowUserManager(true)}
        onShowProductManager={() => setShowProductManager(true)}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo: Menú */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryBar 
            categories={categories || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full p-4 rounded-2xl border shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <MenuGrid 
              items={filteredItems}
              onAddItem={(item) => setOrderItems(prev => {
                const exist = prev.find(i => i.menuItem.id === item.id);
                if (exist) return prev.map(i => i.menuItem.id === item.id ? {...i, quantity: i.quantity + 1} : i);
                return [...prev, { menuItem: item, quantity: 1, status: 'pending' }];
              })}
            />
          </div>
        </div>

        {/* Panel Derecho: Orden */}
        <OrderPanel 
          orderItems={orderItems}
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
          total={total}
          subtotal={total} // Simplificado para pruebas
          tax={0}
          tip={0}
          onClose={() => setShowCheckout(false)}
          onConfirm={() => {
            setOrderItems([]);
            setSelectedTable(null);
            setShowCheckout(false);
          }}
        />
      )}

      {showUserManager && <UserManager onClose={() => setShowUserManager(false)} />}
      {showProductManager && <ProductManager onClose={() => setShowProductManager(false)} />}
      
      <Footer />
    </div>
  );
}

export default App;
