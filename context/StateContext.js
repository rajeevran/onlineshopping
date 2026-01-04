import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const Context = createContext();

export const StateContext = ({ children }) => {
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [qty, setQty] = useState(1);
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  let foundProduct;
  let index;

  const onAdd = async(product, quantity, size) => {
    const checkProductInCart = cartItems.find((item) => item._id === product._id);
    console.log('cart--',cartItems,product,quantity,size,checkProductInCart);
    

    if(checkProductInCart) {
      const updatedCartItems = cartItems.map((cartProduct) => {
        if(cartProduct._id === product._id){
          return {
            ...cartProduct,
            quantity: cartProduct.quantity + quantity,
            size: size
          };
        }
        return cartProduct;
      });
      console.log('updatedCartItems',updatedCartItems);
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({
            productId: product._id,
            quantity: updatedCartItems.find(item => item._id === product._id).quantity,
            size: size
          })
      });

      const data = await res.json();
      await onGetCartItems()
    } else {
      product.quantity = quantity;
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({
            productId: product._id,
            quantity: quantity,
            size: size
          })
      });
      //setCartItems([...cartItems, { ...product }]);
      await onGetCartItems()

    }
    //setTotalPrice((prevTotalPrice) => prevTotalPrice + product.price * quantity);
    //setTotalQty((prevTotalQty) => prevTotalQty + quantity);
    toast.success(`${qty} ${product.name} added to the cart.`);
  } 
  
  const onGetCartItems = async() => {
    const res = await fetch("/api/cart/get", {
      method: "GET",
      headers: { "Content-Type": "application/json", "Authorization":`Bearer ${token}` },
    });
    const data = await res.json();
    console.log('datacart',data);
    
    setCartItems(data.items);
    setTotalPrice(data.totalAmount)
    setTotalQty(data.totalQuantity)
  }
  const onRemove = async(product,quantity) => {
    foundProduct = cartItems.find((item) => item._id === product._id);
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({
            productId: product._id,
            quantity: quantity
          })
      });
      await onGetCartItems()
  }

  const toggleCartItemQuantity = async(id, value) => {
    foundProduct = cartItems.find((item) => item._id === id)
    index = cartItems.findIndex((product) => product._id === id);
    const newCartItems = cartItems.filter((item) => item._id !== id)
    console.log('foundProduct',foundProduct);
    
    if(value === 'inc') {
      await onAdd(foundProduct?.product, 1, foundProduct.size);
      //setCartItems([...newCartItems, { ...foundProduct, quantity: foundProduct.quantity + 1 } ]);
      //setTotalPrice((prevTotalPrice) => prevTotalPrice + foundProduct.price)
      //setTotalQty(prevTotalQty => prevTotalQty + 1)
    } else if(value === 'dec') {
      if (foundProduct.quantity > 1) {
        await onRemove(foundProduct?.product, 1);
        // setCartItems([...newCartItems, { ...foundProduct, quantity: foundProduct.quantity - 1 } ]);
        // setTotalPrice((prevTotalPrice) => prevTotalPrice - foundProduct.price)
        // setTotalQty(prevTotalQty => prevTotalQty - 1)
      }
    }
  }

  const incQty = () => {
    setQty((prevQty) => prevQty + 1);
  }

  const decQty = () => {
    setQty((prevQty) => {
      if(prevQty - 1 < 1) return 1;
     
      return prevQty - 1;
    });
  }

  return (
    <Context.Provider
      value={{
        showCart,
        setShowCart,
        cartItems,
        setCartItems,
        totalPrice,
        totalQty,
        qty,
        incQty,
        decQty,
        onAdd,
        onGetCartItems,
        toggleCartItemQuantity,
        onRemove,
        setTotalPrice,
        setTotalQty 
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useStateContext = () => useContext(Context);