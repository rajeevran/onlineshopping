import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CiSearch } from 'react-icons/ci'
import { CgShoppingCart } from 'react-icons/cg'
import { FiChevronDown, FiMenu, FiX, FiUser, FiTruck, FiRefreshCw, FiGlobe } from 'react-icons/fi'
import { useStateContext } from '../context/StateContext'

const Navbar = () => {
  const { showCart, setShowCart, totalQty, onGetCartItems } = useStateContext()
  const [toggleMenu, setToggleMenu] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    onGetCartItems()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setOpen(false)
    router.push('/login')
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const value = searchTerm.trim()
    if (value) router.push(`/products?search=${encodeURIComponent(value)}`)
  }

  const closeMobileMenu = () => setToggleMenu(false)

  return (
    <>
      <div className="top-promo-bar">
        <div className="promo-item"><FiTruck /><span>Free Shipping on Orders Above ₹999</span></div>
        <span className="promo-divider" />
        <div className="promo-item"><FiRefreshCw /><span>Easy 7-Day Returns</span></div>
        <span className="promo-divider" />
        <div className="promo-item"><FiGlobe /><span>Worldwide Shipping</span></div>
      </div>

      <nav className="modern-navbar">
        <Link href="/" className="brand-logo" aria-label="Noadua home">
          <Image src="/Logo.png" width={190} height={78} alt="Noadua" priority />
        </Link>

        <div className="desktop-nav-links">
          <Link href="/products">NEW IN</Link>
          <Link href="/products">DRESSES</Link>
          <Link href="/products">SUITS</Link>
          <Link href="/products">COLLECTIONS</Link>
          <Link href="/products" className="sale-link">SALE</Link>
        </div>

        <form className="modern-search" onSubmit={handleSearch}>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search for products..."
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search"><CiSearch size={25} /></button>
        </form>

        <div className="modern-nav-actions">
          {!isLoggedIn ? (
            <button className="modern-account-btn" onClick={() => router.push('/login')}>
              <FiUser size={20} />
              <span>My Account</span>
              <FiChevronDown size={16} />
            </button>
          ) : (
            <div className="account-wrapper" ref={dropdownRef}>
              <button className="modern-account-btn" onClick={() => setOpen(!open)}>
                <FiUser size={20} />
                <span>My Account</span>
                <FiChevronDown size={16} />
              </button>
              {open && (
                <div className="dropdown modern-dropdown">
                  <button onClick={() => { setOpen(false); router.push('/myaccount') }}>My Account</button>
                  <button onClick={() => { setOpen(false); router.push('/myorders') }}>My Orders</button>
                  <button onClick={() => { setOpen(false); router.push('/mywishlist') }}>My Wishlist</button>
                  <button onClick={() => { setOpen(false); router.push('/myaddress') }}>My Address</button>
                  <button onClick={() => { setOpen(false); router.push('/mybank') }}>My Bank Account</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          )}

          <Link href="/cart" aria-label="Shopping cart">
            <button className="modern-cart-btn" onClick={() => setShowCart(!showCart)}>
              <CgShoppingCart size={27} />
              <span className="modern-cart-count">{totalQty || 0}</span>
            </button>
          </Link>

          <button className="mobile-menu-btn" onClick={() => setToggleMenu(true)} aria-label="Open menu">
            <FiMenu size={27} />
          </button>
        </div>
      </nav>

      {toggleMenu && (
        <div className="mobile-nav-overlay">
          <div className="mobile-nav-header">
            <Link href="/" onClick={closeMobileMenu}>
              <Image src="/Logo.png" width={145} height={60} alt="Noadua" />
            </Link>
            <button onClick={closeMobileMenu} aria-label="Close menu"><FiX size={28} /></button>
          </div>
          <form className="mobile-search" onSubmit={(event) => { handleSearch(event); closeMobileMenu() }}>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for products..."
            />
            <button type="submit"><CiSearch size={23} /></button>
          </form>
          <div className="mobile-nav-links">
            <Link href="/products" onClick={closeMobileMenu}>NEW IN</Link>
            <Link href="/kurti" onClick={closeMobileMenu}>KURTIS</Link>
            <Link href="/products" onClick={closeMobileMenu}>DRESSES</Link>
            <Link href="/products" onClick={closeMobileMenu}>SUITS</Link>
            <Link href="/products" onClick={closeMobileMenu}>COLLECTIONS</Link>
            <Link href="/products" onClick={closeMobileMenu} className="sale-link">SALE</Link>
          </div>
          <div className="mobile-nav-bottom">
            <Link href="/cart" onClick={closeMobileMenu}>Cart ({totalQty || 0})</Link>
            <Link href={isLoggedIn ? '/myaccount' : '/login'} onClick={closeMobileMenu}>My Account</Link>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
