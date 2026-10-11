import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '../src/assets/Logo.png'
import { GrFacebookOption, GrInstagram, GrYoutube, GrLinkedinOption } from 'react-icons/gr'
import { FaCcMastercard, FaCcVisa, FaShieldAlt, FaArrowRight } from 'react-icons/fa'
import { RiTwitterXLine } from 'react-icons/ri'
import { SiRazorpay } from 'react-icons/si'

const FooterLink = ({ href, children }) => (
  <li><Link href={href}>{children}<FaArrowRight aria-hidden="true" /></Link></li>
)

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">


      <div className="footer-main">
        <div className="footer-brand-column">
          <p className="footer-brand-copy">A considered wardrobe, curated for the way you live. Find pieces you’ll reach for, season after season.</p>
          <div className="footer-socials" aria-label="Follow Noadua">
            <a href="https://www.facebook.com/noaduaclothings" target="_blank" rel="noreferrer" aria-label="Facebook"><GrFacebookOption /></a>
            <a href="https://www.instagram.com/noadua_clothings/" target="_blank" rel="noreferrer" aria-label="Instagram"><GrInstagram /></a>
            <a href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X"><RiTwitterXLine /></a>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><GrYoutube /></a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><GrLinkedinOption /></a>
          </div>
          <span className="footer-brand-note"><span className="footer-live-dot" /> Made for your everyday</span>
        </div>

        <nav className="footer-link-group" aria-label="Shop categories">
          <h3>Shop</h3>
          <ul>
            <FooterLink href="/products">All products</FooterLink>
            <FooterLink href="/kurti">Kurtis & ethnic wear</FooterLink>
            <FooterLink href="/male">Menswear</FooterLink>
            <FooterLink href="/kids">Kids</FooterLink>
            <FooterLink href="/products">New arrivals</FooterLink>
          </ul>
        </nav>

        <nav className="footer-link-group" aria-label="Customer support">
          <h3>Help & support</h3>
          <ul>
            <FooterLink href="/myorders">Track your order</FooterLink>
            <FooterLink href="/myaccount">My account</FooterLink>
            <FooterLink href="/myaddress">Delivery addresses</FooterLink>
            <FooterLink href="/mywishlist">Wishlist</FooterLink>
            <FooterLink href="/cart">Shopping bag</FooterLink>
          </ul>
        </nav>

        <div className="footer-contact-group">
          <h3>Here to help</h3>
          <p>Questions about an order or product? We’re here to help you find the right answer.</p>
          <Link href="/myorders" className="footer-contact-link">Get order support <FaArrowRight aria-hidden="true" /></Link>
          <div className="footer-shipping-note"><span className="footer-shipping-icon">↗</span><span><strong>Order updates</strong><small>View delivery progress in My Orders.</small></span></div>
        </div>
      </div>

      <div className="footer-trust-row">
        <div className="footer-trust-item"><span className="footer-trust-icon"><FaShieldAlt /></span><span><strong>Secure checkout</strong><small>Your payment details stay protected</small></span></div>
        <div className="footer-trust-item"><span className="footer-trust-icon">✓</span><span><strong>Order tracking</strong><small>Follow your delivery updates</small></span></div>
        <div className="footer-payment-block"><span className="footer-payment-label">PAYMENT METHODS</span><div className="footer-payment-icons" aria-label="Visa, Mastercard and Razorpay"><FaCcVisa /><FaCcMastercard /><SiRazorpay /></div></div>
      </div>

      <div className="footer-bottom">
        <p>© {year} Noadua. All rights reserved.</p>
        <div className="footer-legal-links"><Link href="/comingsoon">Privacy</Link><Link href="/comingsoon">Terms</Link><Link href="/comingsoon">Shipping & returns</Link></div>
        <span className="footer-secure-label"><FaShieldAlt /> Secure shopping</span>
      </div>
    </footer>
  )
}

export default Footer
