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

    const getProductIds = (data) => {
    if (!Array.isArray(data) || !data.length || !Array.isArray(data[0]?.productId)) {
      return []
    }

    return data[0].productId.filter(Boolean)
    }
    const HomeProductCarousel = ({
      eyebrow,
      title,
      products = [],
      type = 'product',
    }) => {
      const items = Array.isArray(products) ? products : []
      console.log('HomeProductCarousel items:', items,products,eyebrow,title,type);
      if (!items.length) return null

      return (
        <section className="home-products-section">
          <div className="home-products-header">
            <div className="home-products-heading">
              {eyebrow && <span>{eyebrow}</span>}
              <h4>{title}</h4>
            </div>
          </div>

          <div className="home-products-slider-wrap">
            <Swiper
              modules={[Navigation, A11y]}
              navigation
              a11y={{ enabled: true }}
              watchOverflow
              observer
              observeParents
              spaceBetween={18}
              slidesPerView={1.15}
              breakpoints={{
                480: {
                  slidesPerView: 1.45,
                  spaceBetween: 18,
                },
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                900: {
                  slidesPerView: 2.5,
                  spaceBetween: 22,
                },
                1100: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1400: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="modern-products-swiper"
            >
              {items.map((item, index) => {
                const key = item?._id || item?.productId?._id || `${title}-${index}`

                return (
                  <SwiperSlide key={key} className="modern-product-slide">
                    {type === 'review' ? (
                      <Review
                        userId={item.userId}
                        comment={item.comment}
                        rating={item.rating}
                        product={item.productId}
                      />
                    ) : (
                      <Product product={item} />
                    )}
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>
        </section>
      )
    }
const Home = ({products}) => {
    const [festiveWave, setFestiveWave] = useState([]);
    const [recommendedProduct, setRecommendedProduct] = useState([]);
    const [customerReview, setCustomerReview] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [exploreCollection, setExploreCollection] = useState([]);

  useEffect(() => {
    const loadHomeSections = async () => {
      try {
        const [festive, recommended, reviews, recent, explore] = await Promise.all([
          fetch('/api/festiveWave').then((res) => res.json()),
          fetch('/api/recommendedProduct').then((res) => res.json()),
          fetch('/api/customerReview').then((res) => res.json()),
          fetch('/api/recentlyViewed').then((res) => res.json()),
          fetch('/api/exploreCollection').then((res) => res.json()),
        ])

        setFestiveWave(festive)
        setRecommendedProduct(recommended)
        setCustomerReview(reviews)
        setRecentlyViewed(recent)
        setExploreCollection(explore)
      } catch (error) {
        console.error('Failed to load homepage sections:', error)
      }
    }

    loadHomeSections()
  }, [])
    console.log('customerReview',customerReview);
    
  return (
    <>
      <HeroBanner />
      <HomeProductCarousel
        eyebrow="FESTIVE EDIT"
        title="FESTIVE WAVE"
        products={getProductIds(festiveWave)}
      />
      <HomeProductCarousel
        eyebrow="CURATED FOR YOU"
        title="RECOMMENDED FOR YOU"
        products={getProductIds(recommendedProduct)}
      />
      <HomeProductCarousel
        eyebrow="SIGNATURE STYLES"
        title="EXPLORE COLLECTION"
        products={getProductIds(exploreCollection)}
      />
      <HomeProductCarousel
          eyebrow="YOUR RECENT PICKS"
          title="RECENTLY VIEWED"
          products={getProductIds(recentlyViewed)}
        />
      <HomeProductCarousel
        eyebrow="WHAT OUR CUSTOMERS SAY"
        title="CUSTOMER REVIEWS"
        products={customerReview}
        type='review'
      />
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