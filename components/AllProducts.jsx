import React from 'react'
import Link from 'next/link'
import { normalizeId } from '../lib/id'
import { imageUrl } from '../lib/imageUrl'

const Allproducts = ({ allproducts = {} }) => {
  const { images, name, tags, price } = allproducts
  const id = normalizeId(allproducts?._id || allproducts?.productId)
  if (!id) return null

  return (
    <div>
      <Link href={`/product/${encodeURIComponent(id)}`}>
        <div className='Allproduct-card'>
          <img src={imageUrl(images && images[0])} width={250} height={270} alt={name || 'Product'} />
          <p className='Allproduct-name'>{name}</p>
          <p className='Allproduct-tags'>{tags}</p>
          <p className='Allproduct-price'>${price}</p>
        </div>
      </Link>
    </div>
  )
}

export default Allproducts
