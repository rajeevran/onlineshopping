import React, { useState, useEffect } from 'react'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import {CgShoppingCart} from 'react-icons/cg'
import { useStateContext } from '../../context/StateContext';
import { useRouter } from 'next/dist/client/router';
import { toast } from 'react-hot-toast';
import { jwtDecode } from "jwt-decode";
import api from "../../lib/axiosInstance";
const ProductDetails = ({}) => {
    const router = useRouter();
    const [size, setSize] = useState('');
    const [index, setIndex] = useState(0);
    const { decQty, incQty, qty, onAdd } = useStateContext();
    const [products, setProducts] = useState(null);
    const { slug } = router.query; // ✅ gets the dynamic [slug] value
    const isReady = router.isReady;
    
    console.log('product--', slug);
    useEffect(() => {
        if (isReady && slug) {
            fetch(`/api/products/${slug}`)
                .then((res) => res.json())
                .then((data) => setProducts(data));
        }
    }, [isReady, slug]);

    // Prepare variables for rendering
    let images = products?.images || [];
    let name = products?.name || '';
    let description = products?.description || '';
    let price = products?.price || 0;
    let tags = products?.tags || '';
    let care = products?.care || [];
    let careList = [];
    if (care && care.length > 0) {
        for (let i = 0; i < care.length; i++) {
            careList.push(care[i]);
        }
    }

    if (!isReady || !slug || !products) {
        return <p>Loading...</p>;
    }
  const handleCheckout = async (amount) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if(size==''){
        toast.error('Please select size');
        return;
    }

    const decoded = jwtDecode(token);
    const userId = decoded.id;
    const defaultUser =  await api.get(`/users/${userId}`);
    const defaultAddress =  await api.get(`/address?userId=${userId}&isDefault=true`);
    console.log('defaultAddress-----',defaultAddress,defaultUser);
    
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
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id
          const productsPayload = [{
            productId: products._id,
            quantity: qty,
            price: products.price * qty
          }];
          toast.success('Payment successful! 🎉');
          const defaultAddressId =  defaultAddress.data[0]?._id || '';
          await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ products: productsPayload, totalAmount: amount, addressId: defaultAddressId, orderId, paymentId }),
          });
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
    return (
        <div className='products'>
            <div className='product-detail-container'>
                <div className='product-images'>
                    <div className='small-images-container'>
                        {images?.map((item, ind) => (
                            <img 
                            key={ind}
                            src={(item)} 
                            height={400} width={600} 
                            className='small-image' 
                            onMouseEnter={() => setIndex(ind)} />
                        ))}
                    </div>
                    <div className='big-image-container'>
                        <img src={(images && images[index])} height={600} width={600} />
                    </div>
                </div>
                <div className='product-details'>
                    <div className='name-and-category'>
                        <h3>{name}</h3>
                        <span>{tags}</span>   
                    </div>
                    <div className='size'>
                        <p>SELECT SIZE</p>
                        <ul>
                            <li className={size=='xs'?'size-active':""} onClick={()=>setSize('xs')}>XS</li>
                            <li className={size=='s'?'size-active':""} onClick={()=>setSize('s')}>S</li>
                            <li className={size=='m'?'size-active':""} onClick={()=>setSize('m')}>M</li>
                            <li className={size=='l'?'size-active':""} onClick={()=>setSize('l')}>L</li>
                            <li className={size=='xl'?'size-active':""} onClick={()=>setSize('xl')}>XL</li>
                        </ul>
                    </div>
                    <div className='quantity-desc'>
                        <h4>Quantity: </h4>
                        <div>
                            <span className='minus' onClick={decQty}><AiOutlineMinus /></span>
                            <span className='num' onClick=''>{qty}</span>
                            <span className='plus' onClick={incQty}><AiOutlinePlus /></span>
                        </div>
                    </div>
                    <div className='add-to-cart'>
                        <button className='btn' type='button' onClick={() => {
                            if(size==''){
                                toast.error('Please select size');
                                return;
                            }
                            onAdd(products, qty, size)}
                        }
                            >
                                {/* <CgShoppingCart size={20} /> */}
                                Add to Cart</button>
                        <button className='btn' type='button' onClick={()=>handleCheckout(price *qty)}>Buy Now</button>

                        <p className='price'>Rs {price *qty}.00</p>  
                    </div>
                </div>
            </div>

            <div className='product-desc-container'>
                <div className='desc-title'>
                    <div className="desc-background">
                        Overview
                    </div>
                    <h2>Product Information</h2>  
                </div>
                <div className='desc-details'>
                    <h4>PRODUCT DETAILS</h4>
                </div>
                    {description}

                <div className='desc-care'>
                    <h4>PRODUCT CARE</h4>
                </div>
                                    <ul>
                    {careList.map(list => (
                        <li>{list}</li>
                    ))}
                    </ul>

            </div>
        </div>
    )
}
export default ProductDetails
