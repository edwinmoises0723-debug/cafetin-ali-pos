import { Category } from '../types';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryBar({ categories, selectedCategory, onSelectCategory }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
            selectedCategory === category.id
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
        </button>
      ))}
    </div>
  );
}
