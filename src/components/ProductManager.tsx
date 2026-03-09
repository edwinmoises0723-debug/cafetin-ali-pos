import React, { useState } from 'react';
import { MenuItem } from '../types';
import { categories } from '../data/menuData';

interface ProductManagerProps {
  products: MenuItem[];
  onAddProduct: (product: MenuItem) => void;
  onUpdateProduct: (product: MenuItem) => void;
  onDeleteProduct: (id: string) => void;
  onClose: () => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClose
}) => {
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const initialFormState: MenuItem = {
    id: '',
    name: '',
    price: 0,
    category: 'principales',
    image: '🍽️',
    description: '',
    hasTax: true,
    stock: 0,
    minStock: 0,
    maxStock: 0
  };

  const [formData, setFormData] = useState<MenuItem>(initialFormState);

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData(product);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      onDeleteProduct(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      onUpdateProduct(formData);
    } else {
      const newProduct = {
        ...formData,
        id: Date.now().toString()
      };
      onAddProduct(newProduct);
    }
    
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  const handleCreateNew = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-orange-500 text-white">
          <h2 className="text-xl font-bold">Gestión de Productos</h2>
          <button onClick={onClose} className="hover:bg-orange-600 p-1 rounded">✖</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!isFormOpen ? (
            <div>
              <div className="flex justify-between mb-4">
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  className="border rounded px-3 py-2 w-64"
                />
                <button 
                  onClick={handleCreateNew}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <span>➕</span> Nuevo Producto
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border text-left">Producto</th>
                      <th className="py-2 px-4 border text-left">Categoría</th>
                      <th className="py-2 px-4 border text-right">Precio</th>
                      <th className="py-2 px-4 border text-center">IVA</th>
                      <th className="py-2 px-4 border text-center">Stock</th>
                      <th className="py-2 px-4 border text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{product.image}</span>
                            <div>
                              <div className="font-semibold">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4 border">
                          {categories.find(c => c.id === product.category)?.name}
                        </td>
                        <td className="py-2 px-4 border text-right">
                          C$ {product.price.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 border text-center">
                          {product.hasTax ? '✅' : '❌'}
                        </td>
                        <td className="py-2 px-4 border text-center">
                          {product.stock}
                        </td>
                        <td className="py-2 px-4 border text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleEdit(product)}
                              className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border rounded p-2"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio (C$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Icono (Emoji)</label>
                  <input
                    required
                    type="text"
                    value={formData.image}
                    onChange={e => setFormData({...formData, image: e.target.value})}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Configuración de Inventario e Impuestos</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasTax}
                        onChange={e => setFormData({...formData, hasTax: e.target.checked})}
                        className="mr-2 h-5 w-5"
                      />
                      <span>Aplica IVA (15%)</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Actual</label>
                    <input
                      required
                      type="number"
                      value={formData.stock || 0}
                      onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                    <input
                      required
                      type="number"
                      value={formData.minStock || 0}
                      onChange={e => setFormData({...formData, minStock: parseInt(e.target.value)})}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Máximo</label>
                    <input
                      required
                      type="number"
                      value={formData.maxStock || 0}
                      onChange={e => setFormData({...formData, maxStock: parseInt(e.target.value)})}
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
