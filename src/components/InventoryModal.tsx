import React, { useState } from 'react';
import { MenuItem } from '../types';

interface InventoryModalProps {
  products: MenuItem[];
  onUpdateStock: (id: string, newStock: number) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  products,
  onUpdateStock,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  const getStatus = (product: MenuItem) => {
    const stock = product.stock || 0;
    const min = product.minStock || 0;
    if (stock <= min) return 'low';
    return 'ok';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStatus(product);
    
    if (filter === 'low') return matchesSearch && status === 'low';
    if (filter === 'ok') return matchesSearch && status === 'ok';
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-4 border-b bg-blue-600 text-white flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📦 Control de Inventario
          </h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-full transition-colors">
            ✖
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border shadow-sm w-full md:w-auto">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'low' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⚠️ Stock Bajo ({products.filter(p => getStatus(p) === 'low').length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pl-2">Producto</th>
                <th className="pb-3 text-center">Estado</th>
                <th className="pb-3 text-center">Mínimo</th>
                <th className="pb-3 text-center">Máximo</th>
                <th className="pb-3 text-center">Stock Actual</th>
                <th className="pb-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const status = getStatus(product);
                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50 group">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{product.image}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        status === 'low' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {status === 'low' ? 'BAJO' : 'OK'}
                      </span>
                    </td>
                    <td className="py-3 text-center text-gray-600">{product.minStock}</td>
                    <td className="py-3 text-center text-gray-600">{product.maxStock}</td>
                    <td className="py-3 text-center">
                      <span className={`font-mono font-bold text-lg ${
                        status === 'low' ? 'text-red-600' : 'text-gray-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => onUpdateStock(product.id, (product.stock || 0) - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                          disabled={(product.stock || 0) <= 0}
                        >
                          -
                        </button>
                        <button
                          onClick={() => onUpdateStock(product.id, (product.stock || 0) + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p className="text-xl">No se encontraron productos</p>
              <p>Intenta cambiar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
