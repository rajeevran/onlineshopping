import React from 'react'
import Link from 'next/link'
import { urlFor } from '../lib/client'

const HomeProduct = ({product: {images,_id, name, slug, price}}) => {
  
  return (
    <div>
      <Link href={`/product/${_id}`}>
        <div className='product-card'>
           <img src={(images && images[0])}  className='product-image' />
          <p className='product-name'>{name}</p>
          <p className='product-price'>${price}</p>
        </div>
      </Link>
    </div>
  )
}

export default HomeProduct