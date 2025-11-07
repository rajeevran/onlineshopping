import React,{useEffect,useState} from 'react'
import {client} from '../lib/client'
import { AllProducts } from '../components'

const male = ({AllMaleProducts}) => {
        const [products, setProducts] = useState([]);
        useEffect(() => {
    
            fetch("/api/products?category=male")
            .then((res) => res.json())
            .then((data) => setProducts(data));
        },[])
    return (
        <div className='Allproducts-container'>
            {products && products.length>0?products?.map(prod => (
                <AllProducts key={prod._id} allproducts={prod} />
            )):"No Male Product found"}
        </div>
      )
}

export const getServerSideProps = async () => {
    const query = '*[category == "Male"]';
    const AllMaleProducts = await client.fetch(query);

    return {
      props: { AllMaleProducts }
    }
}

export default male
