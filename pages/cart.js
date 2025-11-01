import React, { useRef } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineShopping } from 'react-icons/ai';
import {HiOutlineTrash} from 'react-icons/hi'
import toast from 'react-hot-toast';
import { useStateContext } from '../context/StateContext';
import { urlFor } from '../lib/client';
import getStripe from '../lib/getStripe';

const Cart = () => {
  const cartRef = useRef();
  const {cartItems, totalPrice, totalQty, onRemove, toggleCartItemQuantity} = useStateContext();

  const handleCheckout = async (amount) => {
    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "My Shop",
      description: "Test Payment",
      order_id: order.id,
      handler: function (response) {
        alert("Payment successful! 🎉");
        console.log(response);
      },
      prefill: {
        name: "John Doe",
        email: "john@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const razor = new window.Razorpay(options);
    razor.open();
  }

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
                <img src={(item?.images[0])} alt='img' />
              </div>
              <div className='item-details'>
                <div className='name-and-remove'>
                  <h3>{item.name}</h3>  
                  <button type='buttin' onClick={() => onRemove(item)} className='remove-item'>
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
            <button className='btn' type='button' onClick={()=>handleCheckout(totalPrice)}>Process to Checkout</button>
          </div>         
        </div>
        )}   

      </div>
    </div>
  )
}

export default Cart