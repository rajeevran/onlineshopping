
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
// import required modules
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

import HomeProduct from './HomeProduct';

// import required modules

const HeroBanner = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch("/api/homeproducts")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  return (
    <header className='header'>
      <Swiper
        
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper"
        style={{ borderRadius: "10px" }}
      >
        <div className='products-container'>
          {products?.map(product => (
            <SwiperSlide>
              <HomeProduct key={product._id} product={product} />
            </SwiperSlide>
          ))}
        </div>

      </Swiper>
    </header>
  )

}

export const getServerSideProps = async () => {
  const query = '*[_type == "product"]';
  const products = await client.fetch(query);
  //const bannerQuery = '*[_type == "banner"]';
  // const bannerData = await client.fetch(bannerQuery);

  return {
    props: { products }
  }
}

export default HeroBanner