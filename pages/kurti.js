import React, { useState, useEffect } from 'react'
import {client} from '../lib/client'
import { AllProducts } from '../components'

const kurti = ({AllFemaleProducts}) => {
        const [products, setProducts] = useState([]);
        useEffect(() => {
            fetch("/api/products?category=women")
            .then((res) => res.json())
            .then((data) => setProducts(data));
        },[])
    return (
        <div className='Allproducts-container'>
            {products && products.length>0?products?.map(prod => (
                <AllProducts key={prod._id} allproducts={prod} />
            )):"No Female Product found"}
        </div>
      )
}

export const getServerSideProps = async () => {
    const query = '*[category == "Female"]';
    const AllFemaleProducts = await client.fetch(query);

    return {
      props: { AllFemaleProducts }
    }
}

export default kurti
