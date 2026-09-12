import React from 'react'
import Link from 'next/link'
import { imageUrl } from '../lib/imageUrl'
import { normalizeId } from '../lib/id'
import StarRatings from 'react-star-ratings'
import Avatar from 'react-avatar'

const Review = ({ product = {}, comment, rating, userId }) => {
  const { images } = product || {}
  const id = normalizeId(product?._id || product?.productId)
  if (!id) return null

  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0))
  const reviewerName = userId?.name || userId?.email || 'Verified customer'
  const initial = reviewerName.charAt(0).toUpperCase()

  return (
    <Link href={`/product/${encodeURIComponent(id)}`} className="review-card-link">
      <article className="review-card">
        <div className="review-card-media">
          {images?.[0] ? (
            <img
              src={imageUrl(images[0])}
              alt={`${product?.name || 'Product'} customer review`}
              className="review-product-image"
            />
          ) : (
            <div className="review-card-placeholder">No image</div>
          )}
          <div className="review-card-shade" />

          <div className="review-card-content">
            <div className="review-rating-row" aria-label={`${safeRating} out of 5 stars`}>
              <StarRatings
                rating={safeRating}
                starRatedColor="#d39b38"
                starEmptyColor="rgba(255,255,255,.45)"
                numberOfStars={5}
                starDimension="17px"
                starSpacing="2px"
                name="customer-rating"
              />
              <span className="review-rating-number">{safeRating.toFixed(1)}</span>
            </div>

            <p className="review-comment">“{comment || 'Loved the quality and finish.'}”</p>

            <div className="review-author">
              <Avatar name={initial} size="38" color="#f0d6a8" fgColor="#3b2a1d" round />
              <div>
                <strong>{reviewerName}</strong>
                <span>Verified customer</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default Review
