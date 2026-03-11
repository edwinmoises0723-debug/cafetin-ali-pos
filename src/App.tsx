import { useState, useEffect } from 'react';
import { MenuItem, OrderItem, Table, User } from './types';
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
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('pos_current_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && currentUser) {
      const loadData = async () => {
        setLoading(true);
        const { data: prodData } = await supabase.from('products').select('*').order('name');
        const { data: tableData } = await supabase.from('tables').select('*').order('id');
        if (prodData) setProducts(prodData);
        if (tableData) setTables(tableData);
        setLoading(false);
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  if (!isHydrated) return null;
  if (!currentUser) return <Login onLoginSuccess={handleLogin} />;
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header currentUser={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('pos_current_user'); }} />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
           <MenuGrid items={products} onAddItem={(item) => setOrderItems(prev => [...prev, { menuItem: item, quantity: 1, status: 'pending' }])} />
        </div>
        <OrderPanel orderItems={orderItems} total={orderItems.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)} onClear={() => setOrderItems([])} />
      </main>
    </div>
  );
}

export default App;
