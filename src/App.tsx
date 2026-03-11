import { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pos_current_user');
    if (stored) setCurrentUser(JSON.parse(stored));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && currentUser) {
      const load = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*');
        setProducts(data || []);
        setLoading(false);
      };
      load();
    } else {
      setLoading(false);
    }
  }, [isHydrated, currentUser]);

  if (!isHydrated) return null;
  if (!currentUser) return <Login onLoginSuccess={(u) => { 
    setCurrentUser(u); 
    localStorage.setItem('pos_current_user', JSON.stringify(u)); 
  }} />;

  return (
    <div className="min-h-screen bg-orange-500 p-10 text-white font-bold text-center">
      <h1 className="text-4xl mb-10">☕ CAFETÍN ALÍ - PANEL DE VENTAS</h1>
      
      {loading ? (
        <Loader2 className="animate-spin mx-auto w-12 h-12" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(products || []).map((p: any) => (
            <div key={p.id} className="bg-white text-black p-6 rounded-2xl shadow-xl">
              <span className="text-4xl">{p.image || '🍴'}</span>
              <h2 className="text-xl mt-2">{p.name}</h2>
              <p className="text-orange-600">C$ {p.price}</p>
            </div>
          ))}
          {products.length === 0 && <p>No hay productos en la base de datos.</p>}
        </div>
      )}
      
      <button 
        onClick={() => { localStorage.removeItem('pos_current_user'); window.location.reload(); }}
        className="mt-10 bg-black text-white px-6 py-2 rounded-full"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

export default App;
