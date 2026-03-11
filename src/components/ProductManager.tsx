import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { supabase } from '../lib/supabase'; // Importamos la conexión
import { X, Plus, Edit2, Trash2, Save, Package } from 'lucide-react';

interface ProductManagerProps {
  products: MenuItem[];
  categories: Category[];
  onAddProduct: (product: MenuItem) => void;
  onUpdateProduct: (product: MenuItem) => void;
  onDeleteProduct: (id: string) => void;
  onClose: () => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClose
}) => {
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialFormState: MenuItem = {
    id: '',
    name: '',
    price: 0,
    category: 'bebidas-calientes',
    image: '☕',
    description: '',
    has_tax: false,
    stock: 0
  };

  const [formData, setFormData] = useState<MenuItem>(initialFormState);

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto de la nube?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        onDeleteProduct(id);
      } else {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const productData = {
      name: formData.name,
      price: formData.price,
      category: formData.category,
      image: formData.image,
      description: formData.description,
      stock: formData.stock,
      has_tax: formData.has_tax
    };

    if (editingProduct) {
      // ACTUALIZAR EN SUPABASE
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      
      if (!error) {
        onUpdateProduct({ ...formData, id: editingProduct.id });
        alert("✅ Producto actualizado");
      }
    } else {
      // INSERTAR EN SUPABASE
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (!error && data) {
        onAddProduct(data);
        alert("✅ Producto creado en la nube");
      }
    }
    
    setLoading(false);
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-orange-600 text-white">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Gestión de Menú (Cloud)</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {!isFormOpen ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                   <input type="text" placeholder="Buscar producto..." className="w-full pl-4 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-orange-500" />
                </div>
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" /> Nuevo Producto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl bg-gray-50 w-14 h-14 flex items-center justify-center rounded-xl">{product.image}</span>
                      <div>
                        <div className="font-bold text-gray-800">{product.name}</div>
                        <div className="text-orange-600 font-black">C$ {Number(product.price).toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Stock: {product.stock}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required placeholder="Nombre del producto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-3 border rounded-xl" />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="p-3 border rounded-xl">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <input required type="number" placeholder="Precio (C$)" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="p-3 border rounded-xl" />
                <input required placeholder="Icono (Emoji)" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="p-3 border rounded-xl text-center text-2xl" />
                <input type="number" placeholder="Stock Actual" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="p-3 border rounded-xl" />
                <div className="flex items-center gap-2 px-3">
                   <input type="checkbox" id="tax" checked={formData.has_tax} onChange={e => setFormData({...formData, has_tax: e.target.checked})} className="w-5 h-5 accent-orange-600" />
                   <label htmlFor="tax" className="font-bold text-gray-700">Aplica IVA (15%)</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="px-10 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 flex items-center gap-2">
                  {loading ? 'Sincronizando...' : <><Save size={20}/> Guardar Producto</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ESTO ES LO QUE ARREGLA EL ERROR DE VERCEL:
export default ProductManager;
