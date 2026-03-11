import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Loader2, MessageSquare, Utensils, Users, BarChart3, Coffee, LogOut, Send } from 'lucide-react';
import Login from './components/Login';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [view, setView] = useState<'ventas' | 'cocina' | 'reportes' | 'usuarios' | 'chat'>('ventas');
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('pos_current_user');
    if (stored) setCurrentUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
      // Suscribirse a mensajes en tiempo real
      const subscription = supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', table: 'messages' }, payload => {
          setMessages(prev => [payload.new, ...prev]);
        }).subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [currentUser]);

  async function loadData() {
    const { data: prod } = await supabase.from('products').select('*');
    const { data: tabs } = await supabase.from('tables').select('*');
    const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(20);
    setProducts(prod || []);
    setTables(tabs || []);
    setMessages(msgs || []);
  }

  const handleSendMessage = async () => {
    if (!newMessage) return;
    await supabase.from('messages').insert();
    setNewMessage('');
  };

  const handleCompleteSale = async (customerName: string) => {
    const total = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const { error } = await supabase.from('sales').insert([{
      customer_name: customerName,
      total,
      items: orderItems,
      status: 'completed'
    }]);
    if (!error) {
      alert("✅ Venta Guardada y Reportada");
      setOrderItems([]);
    }
  };

  if (!currentUser) return <Login onLoginSuccess={(u) => { setCurrentUser(u); localStorage.setItem('pos_current_user', JSON.stringify(u)); }} />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER PROFESIONAL */}
      <header className="bg-orange-600 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 font-black text-xl italic">
          <Coffee /> CAFETÍN ALÍ
        </div>
        <nav className="flex gap-4">
          <button onClick={() => setView('ventas')} className={`p-2 rounded ${view === 'ventas' ? 'bg-orange-800' : ''}`}>🛒 Ventas</button>
          <button onClick={() => setView('cocina')} className={`p-2 rounded ${view === 'cocina' ? 'bg-orange-800' : ''}`}>👨‍🍳 Cocina</button>
          <button onClick={() => setView('chat')} className={`p-2 rounded ${view === 'chat' ? 'bg-orange-800' : ''}`}>💬 Chat</button>
          {currentUser.role === 'admin' && (
            <>
              <button onClick={() => setView('reportes')} className="p-2">📊 Reportes</button>
              <button onClick={() => setView('usuarios')} className="p-2">👥 Usuarios</button>
            </>
          )}
        </nav>
        <button onClick={() => { localStorage.removeItem('pos_current_user'); window.location.reload(); }} className="flex items-center gap-1 bg-red-700 px-3 py-1 rounded-lg">
          <LogOut size={16} /> Salir
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex overflow-hidden">
        {view === 'ventas' && (
          <div className="flex-1 flex">
            {/* Productos */}
            <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto">
              {products.map(p => (
                <button key={p.id} onClick={() => setOrderItems([...orderItems, {...p, quantity: 1}])} className="bg-white p-4 rounded-2xl shadow hover:scale-105 transition-all text-center">
                  <span className="text-3xl">{p.image}</span>
                  <p className="font-bold block">{p.name}</p>
                  <p className="text-orange-600">C$ {p.price}</p>
                </button>
              ))}
            </div>
            {/* Carrito */}
            <div className="w-80 bg-white shadow-xl p-4 flex flex-col">
              <h2 className="font-bold text-xl mb-4 border-b">Orden Actual</h2>
              <div className="flex-1 overflow-y-auto">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between mb-2 text-sm">
                    <span>{item.name}</span>
                    <span className="font-bold">C$ {item.price}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <p className="text-2xl font-black mb-4">Total: C$ {orderItems.reduce((acc, i) => acc + i.price, 0)}</p>
                <button onClick={() => handleCompleteSale('Cliente General')} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">COBRAR AHORA</button>
              </div>
            </div>
          </div>
        )}

        {view === 'chat' && (
          <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
            <div className="flex-1 bg-white rounded-2xl shadow p-4 overflow-y-auto mb-4 flex flex-col-reverse">
              {messages.map(m => (
                <div key={m.id} className={`mb-3 p-3 rounded-xl max-w-[80%] ${m.user_name === currentUser.name ? 'bg-orange-100 self-end' : 'bg-gray-100 self-start'}`}>
                  <p className="text-[10px] font-bold uppercase">{m.user_name} ({m.role})</p>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escribe a cocina o administración..." className="flex-1 p-3 border rounded-xl" />
              <button onClick={handleSendMessage} className="bg-orange-600 text-white p-3 rounded-xl"><Send /></button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
