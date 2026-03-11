import { useState, useMemo, useEffect } from 'react';
import { MenuItem, OrderItem, Table, User, Category } from './types';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { MenuGrid } from './components/MenuGrid';
import { OrderPanel } from './components/OrderPanel';
import { CheckoutModal } from './components/CheckoutModal';
import Login from './components/Login';
import UserManager from './components/UserManager';
import ProductManager from './components/ProductManager';
import { supabase } from './lib/supabase';
import Footer from './components/Footer';
import { Loader2 } from 'lucide-react';

function App() {
  // --- 1. ESTADOS DE CONTROL Y SESIÓN ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 2. ESTADOS DE DATOS (Protegidos con listas vacías iniciales) ---
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

  // --- 3. EFECTO: HIDRATACIÓN ---
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

  // --- 4. EFECTO: CARGA DE DATOS (Desde Supabase) ---
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

          // Si la respuesta es nula, asignamos lista vacía para evitar el error de .filter()
          setProducts(resProd.data || []);
          setTables(resTable.data || []);
          setCategories(resCats.data || []);
        } catch (err) {
          console.error("Error sincronizando datos:", err);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      loadAppData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  // --- 5. MANEJADORES ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setOrderItems([]);
  };

  // --- 6. LÓGICA DE FILTRADO (BLINDADA CONTRA ERRORES) ---
  const filteredItems = useMemo(() => {
    // Escudo: Si products no es un arreglo, usamos una lista vacía.
    const items = Array.isArray(products) ? products : [];
    
    let result = [...items];
    
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(i => i && i.category === selectedCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i && i.name && i.name.toLowerCase().includes(q));
    }
    
    return result;
  }, [products, selectedCategory, searchQuery]);

  // --- 7. RENDERIZADO ---
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
                className="w-full p-4 rounded-2xl border shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Si no hay productos, mostramos un mensaje en lugar de romper la pantalla */}
            {filteredItems.length > 0 ? (
              <MenuGrid 
                items={filteredItems}
                onAddItem={(item) => setOrderItems(prev => [...prev, { menuItem: item, quantity: 1, status: 'pending' }])}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="text-lg font-medium">No hay productos en esta categoría.</p>
              </div>
            )}
          </div>
        </div>

        <OrderPanel 
          orderItems={orderItems}
          total={orderItems.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)}
          selectedTable={selectedTable}
          onUpdateQuantity={(id, q) => setOrderItems(prev => q <= 0 ? prev.filter(i => i.menuItem.id !== id) : prev.map(i => i.menuItem.id === id ? {...i, quantity: q} : i))}
          onRemoveItem={(id) => setOrderItems(prev => prev.filter(i => i.menuItem.id !== id))}
          onCheckout={() => setShowCheckout(true)}
          onClear={() => { setOrderItems([]); setSelectedTable(null); }}
        />
      </main>

      {showUserManager && <UserManager onClose={() => setShowUserManager(false)} />}
      {showProductManager && <ProductManager onClose={() => setShowProductManager(false)} />}
      
      <Footer />
    </div>
  );
}

export default App;
