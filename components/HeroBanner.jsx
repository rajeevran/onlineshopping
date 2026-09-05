import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const fallbackSlides = [
  {
    image: '/uploads/jiu6qd24nzy1btuxlcqc98jwt.png',
    eyebrow: 'NEW COLLECTION',
    title: 'Timeless Elegance\nRedefined',
    description: 'Discover graceful styles crafted for every moment that matters.',
  },
]

const HeroBanner = () => {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/homeproducts')
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
  }, [])

  const slides = products.length ? products : fallbackSlides
console.log('slides-----------',slides);

  return (
    <section className="modern-hero-section" aria-label="Featured collection">
      <Swiper
        spaceBetween={0}
        centeredSlides
        loop={slides.length > 1}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={{ nextEl: '.hero-next', prevEl: '.hero-prev' }}
        modules={[Autoplay, Pagination, Navigation]}
        className="modern-hero-swiper"
      >
        {slides.map((product, index) => {
          const image = product.images?.[0] || product.image || '/uploads/jiu6qd24nzy1btuxlcqc98jwt.png'
          const title = product.title || product.name || 'Timeless Elegance Redefined'
          const description = product.description || 'Discover graceful styles crafted for every moment that matters.'

          return (
            <SwiperSlide key={product._id || product.productId || index}>
              <div className="modern-hero-slide">
                <img src={image} alt={title} className="modern-hero-image" />
                <div className="modern-hero-overlay" />
                <div className="modern-hero-content">
                  <span className="modern-hero-eyebrow">NEW COLLECTION</span>
                  <h1>{String(title).replace(/\s+(?=Redefined$)/, '\n')}</h1>
                  <p>{description}</p>
                  <Link href={product.productId ? `/product/${product.productId}` : '/products'} className="modern-hero-button">
                    SHOP NOW
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          )
        })}

        <button className="hero-arrow hero-prev" aria-label="Previous slide"><FiArrowLeft size={22} /></button>
        <button className="hero-arrow hero-next" aria-label="Next slide"><FiArrowRight size={22} /></button>
      </Swiper>

      <div className="hero-benefits">
        <div className="hero-benefit-item"><span className="benefit-icon">✧</span><div><strong>Premium Quality</strong><small>Carefully curated collection</small></div></div>
        <div className="hero-benefit-item"><span className="benefit-icon">◇</span><div><strong>Secure Payment</strong><small>100% secure checkout</small></div></div>
        <div className="hero-benefit-item"><span className="benefit-icon">♧</span><div><strong>Customer Support</strong><small>We’re here to help</small></div></div>
        <div className="hero-benefit-item"><span className="benefit-icon">◇</span><div><strong>Exclusive Offers</strong><small>Best deals &amp; discounts</small></div></div>
      </div>
    </section>
  )
}

export default HeroBanner
