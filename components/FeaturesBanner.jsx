
import { useEffect, useState } from "react";
import Image from 'next/image'
import img from '../src/assets/feature.png'
import Link from 'next/link'
const FeaturesBanner =()=> {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handlePayment = async (amount) => {
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