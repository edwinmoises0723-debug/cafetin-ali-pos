import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, OrderItem, Table, User, Category } from './types';
import { supabase } from './lib/supabase';

// IMPORTACIONES - Asegúrate de que estos componentes existan en tu carpeta
import Login from './components/Login';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { MenuGrid } from './components/MenuGrid';
import { OrderPanel } from './components/OrderPanel';
import { CheckoutModal } from './components/CheckoutModal';
import UserManager from './components/UserManager';
import ProductManager from './components/ProductManager';
import Footer from './components/Footer';
import { Loader2 } from 'lucide-react';

function App() {
  // --- 1. ESTADOS DE CONTROL ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 2. ESTADOS DE DATOS (IMPORTANTE: Siempre inicializados como [] para evitar el error 'filter') ---
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);

  // 3. EFECTO: Recuperar sesión al cargar
  useEffect(() => {
    const storedUser = localStorage.getItem('pos_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed) setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('pos_current_user');
      }
    }
    setIsHydrated(true);
  }, []);

  // 4. EFECTO: Cargar datos de Supabase
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

          // ESCUDO: Si los datos vienen nulos o indefinidos, forzamos un array vacío []
          setProducts(resProd.data || []);
          setTables(resTable.data || []);
          setCategories(resCats.data || []);
        } catch (err) {
          console.error("Error crítico de sincronización:", err);
          setProducts([]);
          setCategories([]);
        } finally {
          setLoading(false);
        }
      };
      loadAppData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  // --- 5. LÓGICA DE FILTRADO (BLINDADA CONTRA EL ERROR 'FILTER') ---
  const filteredItems = useMemo(() => {
    // Si 'products' no es un array válido por cualquier razón, devolvemos [] de inmediato
    if (!products || !Array.isArray(products)) return [];
    
    try {
      let result = [...products];
      
      if (selectedCategory && selectedCategory !== 'all') {
        result = result.filter(i => i && i.category === selectedCategory);
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(i => i && i.name && i.name.toLowerCase().includes(q));
      }
      
      return result;
    } catch (e) {
      return []; // Si algo falla dentro del filtro, devolvemos vacío para no romper la UI
    }
  }, [products, selectedCategory, searchQuery]);

  // --- 6. MANEJADORES ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setOrderItems([]);
    setSelectedTable(null);
  };

  const total = orderItems.reduce((sum, item) => sum + (item.menuItem?.price || 0) * item.quantity, 0);

  // --- 7. RENDERIZADO CONDICIONAL ---
  if (!isHydrated) return null;

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-orange-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Conectando con Cafetín Alí...</h2>
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
            
            {/* Si no hay productos cargados aún, mostramos un mensaje amigable */}
            {filteredItems && filteredItems.length > 0 ? (
              <MenuGrid 
                items={filteredItems}
                onAddItem={(item) => setOrderItems(prev => {
                  const exist = prev.find(i => i.menuItem?.id === item.id);
                  if (exist) return prev.map(i => i.menuItem?.id === item.id ? {...i, quantity: i.quantity + 1} : i);
                  return [...prev, { menuItem: item, quantity: 1, status: 'pending' }];
                })}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-5xl mb-4">☕</span>
                <p className="text-lg">No hay productos disponibles en este momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Orden */}
        <OrderPanel 
          orderItems={orderItems}
          total={total}
          selectedTable={selectedTable}
          onUpdateQuantity={(id, q) => setOrderItems(prev => q <= 0 ? prev.filter(i => i.menuItem?.id !== id) : prev.map(i => i.menuItem?.id === id ? {...i, quantity: q} : i))}
          onRemoveItem={(id) => setOrderItems(prev => prev.filter(i => i.menuItem?.id !== id))}
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
          subtotal={total}
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
      {showProductManager && (
        <ProductManager 
          products={products}
          categories={categories}
          onAddProduct={(p) => setProducts(prev => [...prev, p])}
          onUpdateProduct={(p) => setProducts(prev => prev.map(i => i.id === p.id ? p : i))}
          onDeleteProduct={(id) => setProducts(prev => prev.filter(i => i.id !== id))}
          onClose={() => setShowProductManager(false)} 
        />
      )}
      
      <Footer />
    </div>
  );
}

export default App;
