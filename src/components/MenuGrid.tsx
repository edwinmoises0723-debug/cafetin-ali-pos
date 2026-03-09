import { MenuItem } from '../types';

interface MenuGridProps {
  items: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

export function MenuGrid({ items, onAddItem }: MenuGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onAddItem(item)}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-100 text-left group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
            {item.image}
          </div>
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{item.name}</h3>
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
          <p className="text-orange-600 font-bold text-lg">${item.price.toFixed(2)}</p>
        </button>
      ))}
    </div>
  );
}
