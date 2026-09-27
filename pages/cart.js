import React, { useEffect, useRef } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineShopping } from 'react-icons/ai';
import {HiOutlineTrash} from 'react-icons/hi'
import toast from 'react-hot-toast';
import { useStateContext } from '../context/StateContext';
import { useRouter } from 'next/router';

import { imageUrl } from "../lib/imageUrl";
const Cart = () => {
  const cartRef = useRef();
  const {cartItems, onGetCartItems, totalPrice, totalQty, onRemove, toggleCartItemQuantity} = useStateContext();

  const router = useRouter();

  const handleCheckout = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to continue to checkout.");
      router.push("/login");
      return;
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // Keep the checkout page independent from the cart drawer/page.
    // This also makes it possible to support Buy Now without adding the item to the cart.
    sessionStorage.setItem("checkoutItems", JSON.stringify(cartItems));
    sessionStorage.setItem("checkoutSource", "cart");
    router.push("/checkout");
  };
  console.log('cartitems',cartItems);
  
  useEffect(() => {
    onGetCartItems();
  }, []);
  return (
    <div className='cart-wrapper' ref={cartRef}>
      <h2>Shopping Cart</h2>
      <div className='cart-container'>
        <div className='cart-items'>
          {cartItems.length < 1 && (
            <div className='empty-cart'>
              <AiOutlineShopping size={150} />
              <h1>Your shopping bag is empty</h1>
            </div>
          )}

          {cartItems.length >= 1 && cartItems.map((item) => (
            <div key={item._id} className='item-card'>
              <div className='item-image'>
                <img src={imageUrl(item?.product?.images?.[0])} alt='img' />
              </div>
              <div className='item-details'>
                <div className='name-and-remove'>
                  <h3>{item?.product?.name}</h3>  
                  <button type='buttin' onClick={() => onRemove(item?.product,item.quantity)} className='remove-item'>
                  <HiOutlineTrash size={28} />  
                  </button>
                </div>
                <p className='item-tag'>Dress</p>
                <p className='delivery-est'>Delivery Estimation</p>
                <p className='delivery-days'>5 Working Days</p>
                <div className='price-and-qty'>
                  <span className='price'>Rs {item.price * item.quantity}</span>  
                  <div>
                    <span className='minus' onClick={() => toggleCartItemQuantity(item._id, 'dec')}><AiOutlineMinus /></span>
                    <span className='num' onClick=''>{item.quantity}</span>
                    <span className='plus' onClick={() => toggleCartItemQuantity(item._id, 'inc')}><AiOutlinePlus /></span>
                  </div>   
                </div>
              </div>
            </div>
            ))}    
        </div>
 
        {cartItems.length >= 1 && (
        <div className='order-summary'>
          <h3>Order Summary</h3>
          <div className='qty'>
            <p>Quantity</p>
            <span>{totalQty} Product</span>
          </div>
          <div className='subtotal'>
            <p>Sub Total</p>
            <span>Rs {totalPrice}</span>
          </div>
           {/* <div className='total'>
            <p>Total</p>
            <span>Rs {totalPrice}</span>
          </div>   */}
          <div>
            <button className='btn' type='button' onClick={handleCheckout}>Process to Checkout</button>
          </div>         
        </div>
        )}   

      </div>
    </div>
  )
}

export default Cart