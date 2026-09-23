import React, { useState, useMemo } from 'react';
import { CATEGORIES } from '../data/categories';
import { CategoryName } from '../types';
import { Search, ArrowRight, Sparkles, Filter } from 'lucide-react';

interface CategorySectionProps {
  selectedCategory: CategoryName | null;
  onSelectCategory: (category: CategoryName | null) => void;
  productCounts?: Record<string, number>;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
  onSelectCategory,
  productCounts = {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterGroup, setActiveFilterGroup] = useState<'all' | 'clothing' | 'beauty' | 'home' | 'accessories' | 'other'>('all');

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilterGroup === 'all') return true;
      if (activeFilterGroup === 'clothing') {
        return cat.name.includes("Unstitched") || cat.name.includes("Stitched") ||
               cat.name.includes("Clothing") || cat.name.includes("Shawls") ||
               cat.name.includes("Festive") || cat.name.includes("Undergarments");
      }
      if (activeFilterGroup === 'beauty') {
        return cat.name === 'Cosmetics' || cat.name === 'Jewellery' || cat.name === 'Perfumes';
      }
      if (activeFilterGroup === 'home') {
        return cat.name.includes("Home") || cat.name === 'Kitchenware' || cat.name === 'Bedding';
      }
      if (activeFilterGroup === 'accessories') {
        return cat.name.includes("Accessories") || cat.name.includes("Handbags") ||
               cat.name === 'Bags' || cat.name === 'Shoes';
      }
      if (activeFilterGroup === 'other') {
        return cat.name === 'Mother & Baby' || cat.name === 'Books & Stationery' ||
               cat.name === 'Fitness' || cat.name === 'Electronics' || cat.name === 'Other';
      }
      return true;
    });
  }, [searchTerm, activeFilterGroup]);

  return (
    <section id="categories-section" className="py-12 lg:py-16 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Collections</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
              Browse by Category
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl">
              Discover millions of products across every category
            </p>
          </div>

          {/* Category Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Find category (e.g. Lawn, Jewellery)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {selectedCategory && (
              <button
                onClick={() => onSelectCategory(null)}
                className="shrink-0 text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Group Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none text-xs">
          <button
            onClick={() => setActiveFilterGroup('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              activeFilterGroup === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            All 31 Categories
          </button>
          <button
            onClick={() => setActiveFilterGroup('clothing')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              activeFilterGroup === 'clothing'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            Clothing & Festive
          </button>
          <button
            onClick={() => setActiveFilterGroup('beauty')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              activeFilterGroup === 'beauty'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            Cosmetics & Jewellery & Perfumes
          </button>
          <button
            onClick={() => setActiveFilterGroup('accessories')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              activeFilterGroup === 'accessories'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            Bags, Shoes & Accessories
          </button>
          <button
            onClick={() => setActiveFilterGroup('home')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              activeFilterGroup === 'home'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            Home, Decor & Kitchen
          </button>
          <button
            onClick={() => setActiveFilterGroup('other')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              activeFilterGroup === 'other'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            Baby, Books, Electronics & More
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredCategories.map((category) => {
            const isSelected = selectedCategory === category.name;
            const count = productCounts[category.name] ?? 0;

            return (
              <button
                key={category.name}
                onClick={() => onSelectCategory(isSelected ? null : category.name)}
                className={`group text-left relative overflow-hidden rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 bg-white hover:shadow-md ${
                  isSelected
                    ? 'border-amber-600 ring-2 ring-amber-600/30 bg-amber-50/40'
                    : 'border-stone-200/80 hover:border-amber-400'
                }`}
              >
                {/* Image background thumbnail */}
                <div className="w-full aspect-16/10 rounded-lg overflow-hidden bg-stone-100 mb-2.5 relative">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {count > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-stone-900/80 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded-md font-semibold">
                      {count} items
                    </span>
                  )}
                </div>

                {/* Category title */}
                <div className="min-h-8 flex flex-col justify-center">
                  <h4 className={`text-xs sm:text-sm font-semibold leading-tight line-clamp-1 group-hover:text-amber-700 transition-colors ${
                    isSelected ? 'text-amber-900 font-bold' : 'text-stone-900'
                  }`}>
                    {category.name}
                  </h4>
                  <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                    {category.description}
                  </p>
                </div>

                {/* Selection indicator */}
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-medium text-stone-600">
                  <span className={isSelected ? 'text-amber-800 font-bold' : 'text-stone-500'}>
                    {isSelected ? 'Selected' : 'Explore'}
                  </span>
                  <ArrowRight className={`w-3 h-3 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all ${
                    isSelected ? 'text-amber-700 translate-x-0.5' : ''
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty state when searching categories */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
            <Filter className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-800">No categories found matching "{searchTerm}"</p>
            <p className="text-xs text-stone-500 mt-1">Try searching for Lawn, Jewellery, Bags, Shoes, or Bedding.</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveFilterGroup('all'); }}
              className="mt-3 text-xs text-amber-700 font-semibold underline hover:text-amber-800"
            >
              Show all 31 categories
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
