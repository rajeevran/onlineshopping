import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  FiSliders,
  FiSearch,
  FiX,
  FiArrowDown
} from 'react-icons/fi'
import { AllProducts } from '../components'

const MENU_CATEGORIES = [
  { label: 'All pieces', value: '' }, { label: 'New in', value: 'new-in' },
  { label: 'Dresses', value: 'dresses' }, { label: 'Suits', value: 'suits' },
  { label: 'Collections', value: 'collections' }, { label: 'Sale', value: 'sale' },
]

const ProductsPage = () => {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('featured')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!router.isReady) return
    setCategory(typeof router.query.category === 'string' ? router.query.category : '')
    setSearch(typeof router.query.search === 'string' ? router.query.search : '')
  }, [router.isReady, router.query.category, router.query.search])

  useEffect(() => {
    if (!router.isReady) return
    let active = true
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search.trim()) params.set('search', search.trim())
    params.set('sort', sort)
    setLoading(true)
    setError('')
    fetch(`/api/products?${params.toString()}`)
      .then((response) => { if (!response.ok) throw new Error('fetch failed'); return response.json() })
      .then((data) => { if (active) setProducts(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setError('We couldn’t load the collection. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [router.isReady, category, search, sort, refreshKey])

  const visibleProducts = useMemo(() => inStockOnly ? products.filter((product) => product.inStock !== false) : products, [products, inStockOnly])
  const activeLabel = MENU_CATEGORIES.find((item) => item.value === category)?.label || 'All pieces'
  const chooseCategory = (value) => {
    setCategory(value)
    const query = { ...router.query }
    delete query.category
    if (value) query.category = value
    router.push({ pathname: '/products', query }, undefined, { shallow: true })
  }
  const updateSearch = (value) => {
    setSearch(value)
    const query = { ...router.query }
    delete query.search
    if (value.trim()) query.search = value.trim()
    router.replace({ pathname: '/products', query }, undefined, { shallow: true })
  }
  const clearFilters = () => {
    setCategory(''); setSearch(''); setSort('featured'); setInStockOnly(false)
    router.push('/products', undefined, { shallow: true })
  }

  return <main className="catalog-page">
    <section className="catalog-content" id="catalog-grid">
      <div className="catalog-heading-row"><div><p className="catalog-eyebrow">SHOP THE COLLECTION</p><h2>{activeLabel}</h2><p className="catalog-result-count">{loading ? 'Finding your pieces…' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'piece' : 'pieces'} to explore`}</p></div>
        <label className="catalog-search"><FiSearch size={18} /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search the collection" aria-label="Search products" />{search && <button type="button" onClick={() => updateSearch('')} aria-label="Clear search"><FiX /></button>}</label>
      </div>
      <div className="catalog-toolbar"><div className="catalog-category-tabs" role="group" aria-label="Product category">{MENU_CATEGORIES.map((item) => <button key={item.value || 'all'} type="button" className={category === item.value ? 'active' : ''} onClick={() => chooseCategory(item.value)}>{item.label}</button>)}</div>
        <div className="catalog-toolbar-actions"><button className={`catalog-filter-toggle ${filtersOpen ? 'active' : ''}`} type="button" onClick={() => setFiltersOpen(!filtersOpen)}><FiSliders /> Filters</button>
          <label className="catalog-sort"><FiArrowDown size={16} /><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A–Z</option></select></label>
        </div>
      </div>
      {filtersOpen && <div className="catalog-filter-panel"><label className="catalog-stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /> In-stock items only</label><button type="button" onClick={clearFilters}>Clear all filters <FiX /></button></div>}
      {error ? <div className="catalog-state"><p>{error}</p><button onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></div> : loading ? <div className="catalog-loading" aria-live="polite">{[1,2,3,4,5,6,7,8].map((item) => <div className="catalog-skeleton" key={item}><span /><i /><i /></div>)}</div> : visibleProducts.length ? <div className="Allproducts-container catalog-product-grid">{visibleProducts.map((product) => <AllProducts key={product._id || product.productId} allproducts={product} />)}</div> : <div className="catalog-empty"><span>✳</span><h3>No pieces found just yet.</h3><p>Try another category or clear your filters to see the full edit.</p><button onClick={clearFilters}>View all pieces</button></div>}
    </section>
    <div className="catalog-bottom-note"><span>MADE TO BE YOURS</span><span>Thoughtful style, every day.</span></div>
  </main>
}

export default ProductsPage
