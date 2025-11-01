import React from 'react'
import Link from 'next/link'
import { urlFor } from '../lib/client'

const HomeProduct = ({product: {images,productId, name, slug, price}}) => {
  
  return (
    <div>
      <Link href={`/product/${productId}`}>
        <div className='home-product-card'>
           <img src={(images && images[0])}  className='product-image' />
          {/* <p className='product-name'>{name}</p>
          <p className='product-price'>${price}</p> */}
        </div>
      </Link>
    </div>
  )
}

export default HomeProduct