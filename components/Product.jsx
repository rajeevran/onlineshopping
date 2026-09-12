import React from 'react'
import Link from 'next/link'
import { imageUrl } from '../lib/imageUrl'
import { normalizeId } from '../lib/id'

const Product = ({ product = {} }) => {
  const { images, name, price } = product;
  const id = normalizeId(product?._id || product?.productId);
  if (!id) return null;

  return (
    <div>
      <Link href={`/product/${encodeURIComponent(id)}`}>
        <div className='product-card'>
          <img src={imageUrl(images && images[0])} width={380} height={400} className='product-image' alt={name || 'Product'} />
          <p className='product-name'>{name}</p>
          <p className='product-price'>Rs {price}</p>
        </div>
      </Link>
    </div>
  )
}

export default Product