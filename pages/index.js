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
import { normalizeId } from '../lib/id';

    // API responses contain one or more section records. Each record can contain
    // multiple populated products and a matching list of selected images. Flatten
    // every record so the homepage renders ALL configured products/images.
    const getProductIds = (data) => {
      if (!Array.isArray(data)) return []

      return data.flatMap((record) => {
        const products = Array.isArray(record?.productId)
          ? record.productId
          : record?.productId
            ? [record.productId]
            : []
        const selectedImages = Array.isArray(record?.images)
          ? record.images.filter(Boolean)
          : []

        return products
          .filter(Boolean)
          .map((product, index) => {
            // Always normalize the populated/unpopulated product ID. Passing a
            // Mongoose ObjectId-like object into a Next Link produces
            // /product/[object Object], which then makes the product API fail.
            const productId = normalizeId(product?._id || product?.productId)
            if (!productId) return null

            // Prefer the image explicitly selected for this section. If the API
            // has an older record where the image/product relationship wasn't
            // stored separately, match the URL against the populated product.
            const productImages = Array.isArray(product?.images) ? product.images : []
            const selectedImage =
              selectedImages.find((url) => productImages.includes(url)) ||
              selectedImages[index] ||
              productImages[0]

            return {
              ...product,
              _id: productId,
              productId,
              images: selectedImage ? [selectedImage] : productImages,
            }
          })
          .filter(Boolean)
      })
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
        setCustomerReview(Array.isArray(reviews) ? reviews.map((review) => {
          const product = review?.productId && !Array.isArray(review.productId) ? review.productId : null
          if (!product) return review
          const productImages = Array.isArray(product.images) ? product.images : []
          const selected = Array.isArray(review.images)
            ? review.images.find((url) => productImages.includes(url)) || review.images[0]
            : null
          return { ...review, productId: { ...product, images: selected ? [selected] : productImages } }
        }) : [])
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