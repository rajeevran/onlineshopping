
import { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-hot-toast';
import { jwtDecode } from "jwt-decode";
import api from "../lib/axiosInstance";
const FeaturesBanner =()=> {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handlePayment = async (amount) => {

    const token = localStorage.getItem("token");
    if (!token) return;
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
            productId: products[0]._id,
            quantity: 1,
            price: products[0].price
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
 
  };

  if (!products.length) return <p style={{ padding: 20 }}>No products found.</p>;

  return (

      <div
      >
          
     <section className='features-section'>

      <div className='content'>
        

        <div className='right'>
           <Image src={products[0].images[0]} width={800} height={450} alt='img' />
          <div>
<p>This piece is ethically crafted in our small family-owned workshop in Peru with unmatched attention to detail and care. The Natural color is the actual natural color of the fiber, undyed and 100% traceable.</p>
            <Link href={'/products'}>
              <button className='btn' type='button'
              onClick={() => handlePayment(products[0].price)}
              
              >Buy now</button>
             </Link>
           </div>
         </div>
       </div>
     </section>
      </div>
  );
}


export default FeaturesBanner