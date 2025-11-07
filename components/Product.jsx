import React from 'react'
import Link from 'next/link'
import { urlFor } from '../lib/client'

const Product = ({product: {images, name, _id, price}}) => {
  return (
    <div>
      <Link href={`/product/${_id}`}>
        <div className='product-card'>
          <img src={(images && images[0])} width={380} height={400} className='product-image' />
          <p className='product-name'>{name}</p>
          <p className='product-price'>Rs {price}</p>
        </div>
      </Link>
    </div>
  )
}

export default Product