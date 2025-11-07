import React,{useState,useEffect} from 'react'
import {client} from '../lib/client'
import { AllProducts } from '../components'

const products = ({Allproducts}) => {
            const [products, setProducts] = useState([]);
            useEffect(() => {
                fetch("/api/products")
                .then((res) => res.json())
                .then((data) => setProducts(data));
            },[])
    return (
        <div className='Allproducts-container'>
            {products?.map(prod => (
                <AllProducts key={prod._id} allproducts={prod} />
            ))}
        </div>
      )
}

export const getServerSideProps = async () => {
    const query = '*[_type == "product"]';
    const Allproducts = await client.fetch(query);
  
    return {
      props: { Allproducts }
    }
}

export default products
