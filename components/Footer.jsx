import React from 'react'
import Image from 'next/image'
import logo from '../src/assets/Logo.png'
import {GrFacebookOption, GrTwitter, GrInstagram ,GrYoutube , GrLinkedinOption} from 'react-icons/gr'
import { FaCcMastercard, FaCcVisa, FaExpeditedssl   } from "react-icons/fa";
import { SiRazorpay } from 'react-icons/si';
const Footer = () => {
  return (
    <footer>
      <div className='footer'>
        {/* <div className='logo'>
          <Image src={logo} width={180} height={30} alt='logo' />
          <p>Small, artisan label that offers a thoughtfully curated collection of high quality everyday essentials made.</p>
          <div className='icon-container'>
            <div><GrTwitter size={20} /></div>
            <div><GrFacebookOption size={20} /></div>
            <div><GrLinkedinOption size={20} /></div>
          </div>
        </div> */}

        <div className='footer-links'>                                                
          <h3>TOP CATEGORIES</h3>
          <ul>
            <li>Suits</li>
            <li>Female Dress</li>
          </ul>
        </div>
        <div className='footer-links'>
          <h3>CUSTOMER SERVICE</h3>
          <ul>
            <li>Returns & Cancellation</li>
            <li>FAQS</li>
            <li>Contact Us</li>
            <li>Blog</li>
          </ul>
        </div>
        <div className='footer-links'>
          <h3>Red Kurti Brand</h3>
          <ul>
            <li>About Us</li>
            <li>Investor Information</li>
            <li>Business Inquiry</li>
            <li>Achievements</li>
            <li>Store Locator</li>
          </ul>
        </div>

        <div className='footer-links'>
          <h3>MY PROFILE</h3>
          <ul>
            <li>My Account</li>
            <li>Track Order</li>
            <li>Return and Cancellation</li>
            <li>My Cart</li>
            <li>Wishlist</li>
            <li>Order History</li>
          </ul>
        </div>

        <div className='footer-links'>
          <h3>QUICK LINKS</h3>
          <ul>
            <li>Shipping Policy</li>
            <li>Privacy Policy</li>
            <li>Carrier</li>
            <li>Terms and conditions</li>
          </ul>
        </div>
      </div>

      <div className='copyright'>
        <p>Follow us <span className='icon-container'>
            <span><GrTwitter size={20} /></span>
            <span><GrFacebookOption size={20} /></span>
            <span><GrLinkedinOption size={20} /></span>
            <span><GrInstagram size={20} /></span>
            <span><GrYoutube size={20} /></span>
          </span></p>
        <p>100% Secure Payments <span className='icon-container'>
            <span><FaCcMastercard size={20} /></span>
            <span><FaCcVisa size={20} /></span>
            <span><SiRazorpay size={20} /></span>
          </span></p>
        <p><FaExpeditedssl size={20}/>256 bit encryption</p>
      </div>
    </footer>
  )
}

export default Footer