import React from 'react'
import Link from 'next/link'

const Allproducts = ({allproducts: {images, name, _id, tags, price}}) => {  
  return (
        <div>
          <Link href={`/product/${_id}`}>
            <div className='Allproduct-card'>
              <img src={(images && images[0])} width={250} height={270} />
              <p className='Allproduct-name'>{name}</p>
              <p className='Allproduct-tags'>{tags}</p>
              <p className='Allproduct-price'>${price}</p>
            </div>
          </Link>
        </div>
      )
}

export default Allproducts