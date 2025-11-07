import React, { useEffect, useState } from 'react'
import {client} from '../lib/client'
import { AllProducts } from '../components'

const kids = ({AllKidsProducts}) => {
    const [products, setProducts] = useState([]);
    useEffect(() => {

        fetch("/api/products?category=kid")
        .then((res) => res.json())
        .then((data) => setProducts(data));
    },[])
    return (
        <div className='Allproducts-container'>
            {products && products.length>0?products?.map(prod => (
                <AllProducts key={prod._id} allproducts={prod} />
            )):"No Kids Product found"}
        </div>
      )
}

export const getServerSideProps = async () => {
    const query = '*[category == "Kids"]';
    const AllKidsProducts = await client.fetch(query);

    return {
      props: { AllKidsProducts }
    }
}

export default kids
