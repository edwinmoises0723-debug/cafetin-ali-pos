import { useState, useEffect } from 'react';
import { User, MenuItem, Table, OrderItem } from './types';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { OrderPanel } from './components/OrderPanel';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // 1. Efecto inicial para cargar la sesión guardada
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

  // 2. Efecto para cargar datos de Supabase si hay usuario
  useEffect(() => {
    if (isHydrated && currentUser) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [resProd, resTable] = await Promise.all([
            supabase.from('products').select('*').order('name'),
            supabase.from('tables').select('*').order('id')
          ]);
          if (resProd.data) setProducts(resProd.data);
          if (resTable.data) setTables(resTable.data);
        } catch (err) {
          console.error("Error sincronizando:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  // Manejador del Login con el nombre exacto que espera Login.tsx
  const handleLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setOrderItems([]);
  };

  // --- RENDERIZADO ---
  if (!isHydrated) return null;

  if (!currentUser) {
    // IMPORTANTE: onLoginSuccess debe coincidir con el componente Login
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Conectando con la nube...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
           <MenuGrid items={products} onAddItem={(item) => setOrderItems(prev => [...prev, { menuItem: item, quantity: 1, status: 'pending' }])} />
        </div>
        <OrderPanel 
          orderItems={orderItems} 
          total={orderItems.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)} 
          onClear={() => setOrderItems([])} 
        />
      </main>
    </div>
  );
}

export default App;
