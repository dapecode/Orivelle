/* ===================================================
   Orivelle - Shop Page
   General collection browser with filters & sorting
   =================================================== */

declare global { interface Window { dataLayer: any[]; } }
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Grid2X2, SlidersHorizontal, X } from 'lucide-react';

import { ProductCard } from '@/components/home';
import { FadeIn, Button, Select } from '@/components/ui';
import { useCategoryStore, useProductStore } from '@/store';

/* ─── Fisher-Yates shuffle (returns a new array) ─── */
const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/* ─────────────────────────────────────────────
   MAIN SHOP PAGE
───────────────────────────────────────────── */
export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategoryStore();

  const {
    products,
    fetchProducts,
    loading: { list: loading },
  } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  const categoryFilter = searchParams.get('category') || '';
  const sortFilter = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';

  const [priceRange, setPriceRange] = useState<[number, number]>([299, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(product => product.categorySlug === categoryFilter);
    }

    if (inStockOnly) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    filtered = filtered.filter(product => {
      const price = Number(product.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortFilter) {
      case 'price_asc':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, priceRange, inStockOnly, sortFilter]);
  const updateSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([299, 10000]);
    setInStockOnly(false);
  };

  const currentCategoryName = categories.find(c => c.slug === categoryFilter)?.name;

  const activeFilterCount = [
    categoryFilter,
    priceRange[0] > 299 || priceRange[1] < 10000,
    inStockOnly,
    searchQuery,
  ].filter(Boolean).length;

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : categoryFilter
      ? currentCategoryName || 'Shop'
      : 'Our Collection';

  /* GTM DATA LAYER — view_item_list */
  useEffect(() => {
    if (filteredProducts.length === 0) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'view_item_list',
      ecommerce: {
        item_list_name: pageTitle,
        items: filteredProducts.slice(0, 20).map((product, index) => ({
          item_id: product.id,
          item_name: product.name,
          item_category: product.category || '',
          price: Number(product.price) || 0,
          index: index,
        })),
      },
    });
  }, [filteredProducts, pageTitle]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal mb-2">
              {pageTitle}
            </h1>
            <p className="text-[#6B5B55]">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
            </p>
            <div className="luxury-line mt-4 w-16" />
          </div>
        </FadeIn>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-rose-gold text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-rose-gold hover:underline">
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
              ]}
              value={sortFilter}
              onChange={e => updateSort(e.target.value)}
              className="!py-2 text-sm"
            />
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setGridCols(3)}
                className={`p-2 rounded-lg ${gridCols === 3 ? 'bg-blush-light' : 'hover:bg-blush-light/50'} transition-colors`}
              >
                <Grid2X2 size={16} />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-2 rounded-lg ${gridCols === 4 ? 'bg-blush-light' : 'hover:bg-blush-light/50'} transition-colors`}
              >
                <Grid3X3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            MOBILE FILTER BOTTOM SHEET
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                key="mobile-filter-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                onClick={() => setShowFilters(false)}
              />

              {/* Sheet */}
              <motion.div
                key="mobile-filter-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl max-h-[82vh] overflow-y-auto"
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-blush/30">
                  <span className="text-base font-semibold text-charcoal">Filters</span>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="p-1.5 rounded-full hover:bg-blush-light transition-colors"
                    aria-label="Close filters"
                  >
                    <X size={18} className="text-[#6B5B55]" />
                  </button>
                </div>

                {/* Filter content */}
                <div className="px-5 py-5 space-y-6">

                  {/* Category */}
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Category
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.delete('category');
                          setSearchParams(p);
                        }}
                        className={`text-sm px-3 py-2 rounded-xl border transition-colors text-left ${!categoryFilter
                          ? 'bg-rose-gold text-white border-rose-gold font-medium'
                          : 'border-blush/40 text-[#6B5B55] hover:border-rose-gold'
                          }`}
                      >
                        All
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const p = new URLSearchParams(searchParams);
                            p.set('category', cat.slug);
                            setSearchParams(p);
                          }}
                          className={`text-sm px-3 py-2 rounded-xl border transition-colors text-left ${categoryFilter === cat.slug
                            ? 'bg-rose-gold text-white border-rose-gold font-medium'
                            : 'border-blush/40 text-[#6B5B55] hover:border-rose-gold'
                            }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Price Range
                    </h3>
                    <input
                      type="range"
                      min={299}
                      max={10000}
                      step={1}
                      value={priceRange[1]}
                      onChange={e => setPriceRange([299, parseInt(e.target.value)])}
                      className="w-full accent-rose-gold"
                    />
                    <div className="flex justify-between text-sm text-[#6B5B55] mt-1">
                      <span>৳299</span>
                      <span>{priceRange[1] >= 10000 ? 'No limit' : `৳${priceRange[1]}`}</span>
                    </div>
                  </div>

                  {/* In Stock */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="w-5 h-5 rounded accent-rose-gold"
                    />
                    <span className="text-sm text-[#6B5B55]">In stock only</span>
                  </label>

                  {/* Apply / Clear */}
                  <div className="flex gap-3 pt-2 pb-safe">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex-1 py-3 rounded-xl border-2 border-blush/40 text-sm font-medium text-[#6B5B55] hover:border-rose-gold transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="flex-1 py-3 rounded-xl bg-rose-gold text-white text-sm font-semibold hover:bg-deep-rose transition-colors"
                    >
                      Show {filteredProducts.length} Results
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex gap-8">

          {/* ── Desktop Sidebar Filter — hidden on mobile ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden md:block flex-shrink-0 overflow-hidden"
              >
                <div className="w-64 space-y-6">

                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Category
                    </h3>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.delete('category');
                          setSearchParams(p);
                        }}
                        className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${!categoryFilter
                          ? 'bg-blush-light text-charcoal font-medium'
                          : 'text-[#6B5B55] hover:text-charcoal'
                          }`}
                      >
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const p = new URLSearchParams(searchParams);
                            p.set('category', cat.slug);
                            setSearchParams(p);
                          }}
                          className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === cat.slug
                            ? 'bg-blush-light text-charcoal font-medium'
                            : 'text-[#6B5B55] hover:text-charcoal'
                            }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Price Range
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={299}
                        max={10000}
                        step={1}
                        value={priceRange[1]}
                        onChange={e => setPriceRange([299, parseInt(e.target.value)])}
                        className="w-full accent-rose-gold"
                      />
                      <div className="flex justify-between text-sm text-[#6B5B55]">
                        <span>৳299</span>
                        <span>{priceRange[1] >= 10000 ? 'No limit' : `৳${priceRange[1]}`}</span>
                      </div>
                    </div>
                  </div>

                  {/* In Stock */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-rose-gold"
                    />
                    <span className="text-sm text-[#6B5B55]">In stock only</span>
                  </label>

                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Products Grid ── */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-[#6B5B55]">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="heading-serif text-2xl font-semibold text-charcoal mb-2">
                  No products found
                </h3>
                <p className="text-[#6B5B55] mb-6">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <motion.div
                layout
                className={`grid gap-4 md:gap-6 ${gridCols === 3
                  ? 'grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  }`}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <ProductCard product={product} priority={index < 4} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
