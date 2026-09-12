import React from 'react'
import Link from 'next/link'
import { imageUrl } from '../lib/imageUrl'
import { normalizeId } from '../lib/id'
import StarRatings from 'react-star-ratings';
import Avatar from 'react-avatar';

const Review = ({ product = {}, comment, rating, userId }) => {
  const { images } = product || {};
  const id = normalizeId(product?._id || product?.productId);
  if (!id) return null;

  return (
    <div>
      <Link href={`/product/${encodeURIComponent(id)}`}>
        <div className='product-card'>
          <div
            slot="container-start"
            className="product-image review-image"
            data-swiper-parallax="-23%"
          >
            <img
              src={imageUrl(images && images[0])}
              alt="Customer review product"
              className="review-product-image"
            />
            <div className="text" data-swiper-parallax="-100">
              <p className='rating'><StarRatings
                rating={rating}
                starRatedColor="white"
                numberOfStars={rating}
                starDimension="20px"
                starSpacing="5px"
                name='rating'
              /></p>
              <p className='comment'>"{comment}"</p>
              <div className="image-container">
                <div className='bottom-left-avatar'><Avatar name="Foo Bar" size={40} color="pink" round={true} /></div>
                <div className="bottom-left-text"></div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default Review