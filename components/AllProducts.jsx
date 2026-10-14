import React from 'react'
import Link from 'next/link'
import { normalizeId } from '../lib/id'
import { imageUrl } from '../lib/imageUrl'

const Allproducts = ({ allproducts = {} }) => {
  const { images, name, tags, price, discountPrice } = allproducts
  const id = normalizeId(allproducts?._id || allproducts?.productId)
  if (!id) return null
  const hasDiscount = Number(discountPrice) > 0 && Number(discountPrice) < Number(price || 0)
  const tagText = Array.isArray(tags) ? tags.join(' · ') : tags

  return (
    <div>
      <Link href={`/product/${encodeURIComponent(id)}`}>
        <div className='Allproduct-card'>
          <div className="catalog-product-image-wrap">
            <img src={imageUrl(images && images[0])} width={250} height={270} alt={name || 'Product'} loading="lazy" />
            {hasDiscount && <span className="catalog-sale-badge">SALE</span>}
          </div>
          <p className='Allproduct-name'>{name}</p>
          {tagText && <p className='Allproduct-tags'>{tagText}</p>}
          <p className='Allproduct-price'>
            {hasDiscount && <span className="catalog-old-price">₹{Number(price).toLocaleString('en-IN')}</span>}
            ₹{Number(hasDiscount ? discountPrice : price || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </Link>
    </div>
  )
}

export default Allproducts
