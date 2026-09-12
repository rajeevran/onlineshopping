import React from 'react'
import Link from 'next/link'
import { urlFor } from '../lib/client'
import { normalizeId } from '../lib/id'
import { imageUrl } from '../lib/imageUrl'

const HomeProduct = ({ product = {} }) => {
  const { images } = product;
  const productId = normalizeId(product?.productId?._id || product?.productId || product?._id);
  if (!productId) return null;

  return (
    <div>
      <Link href={`/product/${encodeURIComponent(productId)}`}>
        <div className='home-product-card'>
           <img src={imageUrl(images && images[0])}  className='product-image' />
          {/* <p className='product-name'>{name}</p>
          <p className='product-price'>${price}</p> */}
        </div>
      </Link>
    </div>
  )
}

export default HomeProduct