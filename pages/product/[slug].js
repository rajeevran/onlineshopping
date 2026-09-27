import React, { useState, useEffect } from 'react'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import { useStateContext } from '../../context/StateContext';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { imageUrl } from "../../lib/imageUrl";
import { normalizeId } from "../../lib/id";
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
            const productId = normalizeId(slug);
            if (!productId) return;
            fetch(`/api/products/${encodeURIComponent(productId)}`)
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
  const handleBuyNow = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to continue.");
      router.push("/login");
      return;
    }

    if (!size) {
      toast.error("Please select size");
      return;
    }

    const checkoutItem = {
      product: products,
      productId: products._id,
      quantity: qty,
      size,
      price: products.price,
    };

    sessionStorage.setItem("checkoutItems", JSON.stringify([checkoutItem]));
    sessionStorage.setItem("checkoutSource", "buy-now");
    router.push("/checkout");
  };
    return (
        <div className='products'>
            <div className='product-detail-container'>
                <div className='product-images'>
                    <div className='small-images-container'>
                        {images?.map((item, ind) => (
                            <button
                                key={ind}
                                type="button"
                                className={`product-thumbnail ${index === ind ? 'is-active' : ''}`}
                                onMouseEnter={() => setIndex(ind)}
                                onClick={() => setIndex(ind)}
                                aria-label={`View product image ${ind + 1}`}
                            >
                                <img
                                    src={item}
                                    width={100}
                                    height={100}
                                    className='small-image'
                                    alt={`${name} view ${ind + 1}`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className='big-image-container'>
                        <img
                            src={images && images[index]}
                            width={900}
                            height={1100}
                            className='big-product-image'
                            alt={name}
                        />
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
                        <button className='btn' type='button' onClick={handleBuyNow}>Buy Now</button>

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
