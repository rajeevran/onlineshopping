import React, { useEffect, useState } from 'react'
import {client} from '../lib/client'
import { HeroBanner, EventsBanner, Newsletter, FeaturesBanner, Product } from '../components'
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';


// import required modules
import { Navigation,A11y } from 'swiper/modules';
import Review from '../components/Review';

const Home = ({products}) => {
    const [festiveWave, setFestiveWave] = useState([]);
    const [recommendedProduct, setRecommendedProduct] = useState([]);
    const [customerReview, setCustomerReview] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [exploreCollection, setExploreCollection] = useState([]);
    useEffect(() => {

      fetch("/api/festiveWave")
        .then((res) => res.json())
        .then((data) => setFestiveWave(data));

      fetch("/api/recommendedProduct")
        .then((res) => res.json())
        .then((data) => setRecommendedProduct(data));
        
      fetch("/api/customerReview")
        .then((res) => res.json())
        .then((data) => setCustomerReview(data));
        
      fetch("/api/recentlyViewed")
        .then((res) => res.json())
        .then((data) => setRecentlyViewed(data));
        
      fetch("/api/exploreCollection")
        .then((res) => res.json())
        .then((data) => setExploreCollection(data));

    }, []);
    console.log('festiveWave',festiveWave);
    
  return (
    <>
      <HeroBanner />
      <div className='products-outer-container'>
        <Swiper
          breakpoints={{
              // width >= 300
              300: {
                slidesPerView: 1,
                spaceBetween: 100
              },
              // width >= 1000
              1000: {
                slidesPerView: 2,
                spaceBetween: 0
              },
              // width >= 1260
              1260: {
                slidesPerView: 3,
                spaceBetween: 0
              }
          }}
          modules={[Navigation, A11y]}
          spaceBetween={0}
          slidesPerView={3}
          navigation
        >
          <div className='products-container'>
            {festiveWave && festiveWave.length>0 &&  festiveWave[0].productId.length>0 && festiveWave[0].productId?.map(product => (
              <SwiperSlide>
                <Product key={product._id} product={product} />
              </SwiperSlide>
            ))}
          </div>
        </Swiper>
      </div>
      <div className='products-outer-container'>
        <div className='subtitle'>
          {/* <span>PRODUCTS</span> */}
          <h1>RECOMMENDED FOR YOU</h1>
        </div>
        <Swiper
          breakpoints={{
              // width >= 300
              300: {
                slidesPerView: 1,
                spaceBetween: 100
              },
              // width >= 1000
              1000: {
                slidesPerView: 2,
                spaceBetween: 0
              },
              // width >= 1260
              1260: {
                slidesPerView: 3,
                spaceBetween: 0
              }
          }}
          
          modules={[Navigation, A11y]}
          spaceBetween={0}
          slidesPerView={3}
          navigation
        >
          <div className='products-container'>
         {recommendedProduct && recommendedProduct.length>0 &&  recommendedProduct[0].productId.length>0 && recommendedProduct[0].productId?.map(product => (
              <SwiperSlide>
                <Product key={product._id} product={product} />
              </SwiperSlide>
            ))}
          </div>
        </Swiper>
      </div>

      <FeaturesBanner />
      
      <div className='products-outer-container'>
        <div className='subtitle'>
          {/* <span>PRODUCTS</span> */}
          <h1>EXPLORE COLLECTION</h1>
        </div>
        <Swiper
          breakpoints={{
              // width >= 300
              300: {
                slidesPerView: 1,
                spaceBetween: 100
              },
              // width >= 1000
              1000: {
                slidesPerView: 2,
                spaceBetween: 0
              },
              // width >= 1260
              1260: {
                slidesPerView: 3,
                spaceBetween: 0
              }
          }}
          modules={[Navigation, A11y]}
          spaceBetween={0}
          slidesPerView={3}
          navigation
        >
          <div className='products-container'>
          {exploreCollection && exploreCollection.length>0 &&  exploreCollection[0].productId.length>0 && exploreCollection[0].productId?.map(product => (
              <SwiperSlide>
                <Product key={product._id} product={product} />
              </SwiperSlide>
            ))}
          </div>
        </Swiper>
      </div>


      <div className='products-outer-container'>
        <div className='subtitle'>
          {/* <span>PRODUCTS</span> */}
          <h1>RECENTLY VIEWED</h1>
        </div>
        <Swiper
          breakpoints={{
              // width >= 300
              300: {
                slidesPerView: 1,
                spaceBetween: 100
              },
              // width >= 1000
              1000: {
                slidesPerView: 2,
                spaceBetween: 0
              },
              // width >= 1260
              1260: {
                slidesPerView: 3,
                spaceBetween: 0
              }
          }}
          modules={[Navigation, A11y]}
          spaceBetween={0}
          slidesPerView={3}
          navigation
        >
          <div className='products-container'>
           {recentlyViewed && recentlyViewed.length>0 &&  recentlyViewed[0].productId.length>0 && recentlyViewed[0].productId?.map(product => (
              <SwiperSlide>
                <Product key={product._id} product={product} />
              </SwiperSlide>
            ))}
          </div>
        </Swiper>
      </div>
      
      <div className='products-outer-container'>
        <div className='subtitle'>
          {/* <span>PRODUCTS</span> */}
          <h1>CUSTOMER REVIEWS</h1>
        </div>
        <Swiper
          breakpoints={{
              // width >= 300
              300: {
                slidesPerView: 1,
                spaceBetween: 100
              },
              // width >= 1000
              1000: {
                slidesPerView: 2,
                spaceBetween: 0
              },
              // width >= 1260
              1260: {
                slidesPerView: 3,
                spaceBetween: 0
              }
          }}
          modules={[Navigation, A11y]}
          spaceBetween={0}
          slidesPerView={3}
          navigation
        >
          <div className='products-container'>
            {customerReview && customerReview.length>0 && customerReview?.map(product => (
              <SwiperSlide>
                 <Review key={product.productId._id}  userId={product.userId} comment={product.comment} rating={product.rating} product={product.productId} /> 
              </SwiperSlide>
            ))}
          </div>
        </Swiper>
      </div>
      <Newsletter />
    </>
  )
}

export const getServerSideProps = async () => {
  const query = '*[_type == "product"]';
  const products = await client.fetch(query);
  // const bannerQuery = '*[_type == "banner"]';
  // const bannerData = await client.fetch(bannerQuery);

  return {
    props: { products }
  }
}

export default Home