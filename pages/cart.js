import React, { use, useEffect, useRef } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineShopping } from 'react-icons/ai';
import {HiOutlineTrash} from 'react-icons/hi'
import toast from 'react-hot-toast';
import { useStateContext } from '../context/StateContext';
import { jwtDecode } from "jwt-decode";

import api from "../lib/axiosInstance";

const Cart = () => {
  const cartRef = useRef();
  const {cartItems, onGetCartItems, totalPrice, totalQty, onRemove, toggleCartItemQuantity} = useStateContext();

  const handleCheckout = async (amount) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode(token);
    const userId = decoded.id;
    const defaultUser =  await api.get(`/users/${userId}`);
    const defaultAddress =  await api.get(`/address?userId=${userId}&isDefault=true`);
    console.log('defaultAddress-----',defaultAddress);
    
      if(!defaultAddress.data || defaultAddress.data.length===0){
        toast.error('Please set default address before placing order');
        return;
    }

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
      handler: async function (response) {
          toast.success('Payment successful! 🎉');
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id
          const productsPayload = cartItems.map((item) => ({
            productId: item.product?._id || item._id,
            quantity: item.quantity,
            price: item.price,
          }));

          const defaultAddressId =  defaultAddress.data[0]?._id || '';
          await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ products: productsPayload, totalAmount: amount, addressId: defaultAddressId, orderId, paymentId }),
          });
          // const deleteCartItems = async (product, quantity) => {
          //   await onRemove(product, quantity);
          // }
          // for (let index = 0; index < cartItems.length; index++) {
          //   const item = cartItems[index];
          //   deleteCartItems(item?.product,item.quantity)
          // }
          await fetch("/api/cart/removeAll", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization":`Bearer ${token}` }
          })
          await onGetCartItems();
         window.location.href = "/myorders";
         

        } catch (err) {
          console.error('Failed to create order after payment', err);
        }
      },
      prefill: {
        name: defaultUser.data.firstName + ' ' + defaultUser.data.lastName,
        email: defaultUser.data.email,
        contact: defaultUser.data.phone,
      },
      theme: {
        color: "#3399cc",
      },
    };

    const razor = new window.Razorpay(options);
    razor.open();
  }
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
                <img src={(item?.product?.images[0])} alt='img' />
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
            <button className='btn' type='button' onClick={()=>handleCheckout(totalPrice)}>Process to Checkout</button>
          </div>         
        </div>
        )}   

      </div>
    </div>
  )
}

export default Cart