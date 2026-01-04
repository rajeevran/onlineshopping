import React, { useState,useEffect, useRef } from 'react'
import Image from 'next/image'
import {CiSearch} from 'react-icons/ci'
import {CgShoppingCart} from 'react-icons/cg'
import logo from '../src/assets/Logo.png'
import Link from 'next/link'
import {RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { useStateContext } from '../context/StateContext';
import { useRouter } from "next/navigation";

const Navbar = ({Searchproducts}) => {
  const {showCart, setShowCart, totalQty, onGetCartItems } = useStateContext();
  const [navigateToCart, setNavigateToCart] = useState(false);
  const router = useRouter();

    useEffect(() => {
      onGetCartItems();
    }, []);
  const [toggleMenu, setToggleMenu] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // 👇 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  console.log('showcart',showCart);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };
  return (
    <nav>
      <Link href='/'>
        <Image src={logo} width={140} height={25} alt='logo' />
      </Link>
      <ul className='nav-links'>
        {/* <Link href='/kurti'><li>Kurti</li></Link> */}
        {/* <Link href='/male'><li>Male</li></Link>
        <Link href='/kids'><li>Kids</li></Link>
        <Link href='/products'><li>All Products</li></Link> */}
      </ul>

        {/* <div className='search-bar'>
          <CiSearch />
          <input 
            type='text' 
            placeholder='What you looking for'/>
        </div> */}
        {/* onChange={(event) => {
              setSearchTerm(event.target.value);
          }} */}

      <div className="navbar">
        {!isLoggedIn ? (
        <button
          className="login-btn"
          onClick={() => router.push("/login")}
        >
          Login
        </button>
        ) : (
        <div className="account-wrapper" ref={dropdownRef}>
          <button
            className="account-btn"
            onClick={() => setOpen(!open)}
          >
            My Account ▾
          </button>

          {open && (
            <div className="dropdown">
              <div onClick={() => router.push("/myaccount")}>
                My Account
              </div>
              <div onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
        )}
        <div>
          {showCart ?
            <Link href='/cart'><button className='cart' onClick={() => {
              setShowCart(false);
            }}>
              <CgShoppingCart size={22} />
              <span className='cart-item-qty'>{totalQty}</span> 
            </button>
            </Link>
          : 
          <Link href='/cart'><button className='cart' onClick={() => setShowCart(true)}> 
            <CgShoppingCart size={22} />
            <span className='cart-item-qty'>{totalQty}</span>
          </button> 
          </Link>
          }
        </div>
      </div>
      <div className='navbar-smallscreen'>
        <RiMenu3Line color='black' fontSize={27} onClick={() => setToggleMenu(true)} />
        {toggleMenu && (
          <div className='navbar-smallscreen_overlay'>
            <Link href='/'>
              <Image className='logo-small' src={logo} width={140} height={25} alt='logo' />
            </Link>
            <RiCloseLine  color='black' fontSize={27} className='close_icon' onClick={() => setToggleMenu(false)} />
            <ul className='navbar-smallscreen_links'>
              <Link href='/cart'>
                  <button className='cart-small-screen' onClick={() => setShowCart(false)}>   
                    <CgShoppingCart size={22} />
                    <span className='cart-item-qty'>{totalQty}</span> 
                  </button>
              </Link> 
              <Link href='/kurti'><li>Kurti</li></Link>
            </ul>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar