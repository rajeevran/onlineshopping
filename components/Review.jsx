import React from 'react'
import Link from 'next/link'
import { urlFor } from '../lib/client'
import StarRatings from 'react-star-ratings';
import Avatar from 'react-avatar';

const Review = ({ product: { images, name, _id, price }, comment, rating, userId }) => {
  return (
    <div>
      <Link href={`/product/${_id}`}>
        <div className='product-card'>
          <div
            slot="container-start"
            className="product-image"
            style={{
              backgroundImage: `url(${images && images[0]})`,
              height: 380,
              width: 400,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            data-swiper-parallax="-23%"
          >
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
                <div className="bottom-left-text">{userId.name}</div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default Review