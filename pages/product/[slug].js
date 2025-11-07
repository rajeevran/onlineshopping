import React, { useState, useEffect } from 'react'
import { client, urlFor } from '../../lib/client'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import {CgShoppingCart} from 'react-icons/cg'
import { useStateContext } from '../../context/StateContext';
import { useRouter } from 'next/dist/client/router';

const ProductDetails = ({product}) => {
    const router = useRouter();
  const { slug } = router.query; // ✅ gets the dynamic [slug] value
    console.log('product--',slug);
  if (!slug) {
    return <p>Loading...</p>; // show loading until slug is available
  }
    const [products, setProducts] = useState([]);
    useEffect(() => {
    fetch(`/api/products/${slug}`)
        .then((res) => res.json())
        .then((data) => setProducts(data));
    }, []);
    const { images, name, description, price, tags, care } = products;
    const [index, setIndex] = useState(0);
    const {decQty, incQty, qty, onAdd} = useStateContext();

    const careList = [];
    if(care && care.length>0){
    for (let i = 0; i < care.length; i++) {
        careList.push(care[i])
    }
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
                            <li>XS</li>
                            <li>S</li>
                            <li>M</li>
                            <li>L</li>
                            <li>XL</li>
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
                        <button className='btn' type='button' onClick={() => onAdd(products, qty)}><CgShoppingCart size={20} />Add to Cart</button>
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

// export const getStaticProps = async ({params: {slug}}) => {
//     const query = `*[_type == "product" && slug.current == '${slug}'][0]`;
//     const productsQuery = '*[_type == "product"]'
//     const product = await client.fetch(query);
//     const products = await client.fetch(productsQuery)
  
//     return {
//       props: { products, product }
//     }
// }

// // Generates `/product/1` and `/product/2`
// export const getStaticPaths = async () => {
//     const query = `*[_type == "product"] {
//         slug {
//             current
//         }
//     }`;

//     const products = await client.fetch(query);

//     const paths = products.map((product) => ({
//         params: {
//             slug: product.slug.current
//         }
//     }));

//     return {
//       paths,
//       fallback: 'blocking'
//     }
// }
