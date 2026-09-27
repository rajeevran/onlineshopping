import React, { createContext, useContext, useState } from "react";
import { toast } from "react-hot-toast";

const Context = createContext();

export const StateContext = ({ children }) => {
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [qty, setQty] = useState(1);

  // Always get the latest token.
  // Do not keep the token in a variable outside the functions.
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const resetCart = () => {
    setCartItems([]);
    setTotalPrice(0);
    setTotalQty(0);
  };

  const handleUnauthorized = (redirectToLogin = false) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }

    resetCart();

    if (redirectToLogin) {
      toast.error("Please login to continue.");

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 500);
    }
  };

  /**
   * Get user's cart
   */
  const onGetCartItems = async () => {
    const token = getToken();

    // User is not logged in.
    // This is a normal state, not an error.
    if (!token) {
      resetCart();
      return;
    }

    try {
      const res = await fetch("/api/cart/get", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Token expired / invalid
      if (res.status === 401) {
        handleUnauthorized(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to get cart");
      }

      // IMPORTANT:
      // Always keep cartItems as an array.
      const items = Array.isArray(data?.items) ? data.items : [];

      setCartItems(items);
      setTotalPrice(Number(data?.totalAmount || 0));
      setTotalQty(Number(data?.totalQuantity || 0));
    } catch (error) {
      console.error("Get cart error:", error);

      // Never allow cartItems to become undefined.
      resetCart();
    }
  };

  /**
   * Add product to cart
   */
  const onAdd = async (product, quantity, size) => {
    const token = getToken();

    // --------------------------------------------------
    // NOT LOGGED IN
    // --------------------------------------------------
    if (!token) {
      toast.error("Please login to add items to cart.");

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 500);

      return false;
    }

    // --------------------------------------------------
    // SAFETY:
    // cartItems must ALWAYS be an array
    // --------------------------------------------------
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    const checkProductInCart = safeCartItems.find(
      (item) =>
        item?._id === product?._id ||
        item?.product?._id === product?._id
    );

    try {
      /*
       * If product already exists:
       * We only send the quantity being added.
       *
       * The backend itself increments the existing quantity.
       */
      if (checkProductInCart) {
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: Number(quantity),
            size,
          }),
        });

        // Token expired / invalid
        if (res.status === 401) {
          handleUnauthorized(true);
          return false;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Unable to add product to cart");
        }

        await onGetCartItems();

        toast.success(
          `${quantity} ${product.name} added to the cart.`
        );

        return true;
      }

      // --------------------------------------------------
      // NEW PRODUCT
      // --------------------------------------------------
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: Number(quantity),
          size,
        }),
      });

      // Token expired / invalid
      if (res.status === 401) {
        handleUnauthorized(true);
        return false;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to add product to cart");
      }

      await onGetCartItems();

      toast.success(
        `${quantity} ${product.name} added to the cart.`
      );

      return true;
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Unable to add product to cart.");
      return false;
    }
  };

  /**
   * Remove product quantity
   */
  const onRemove = async (product, quantity) => {
    const token = getToken();

    if (!token) {
      handleUnauthorized(true);
      return;
    }

    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    const foundProduct = safeCartItems.find(
      (item) =>
        item?._id === product?._id ||
        item?.product?._id === product?._id
    );

    if (!foundProduct) {
      return;
    }

    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      if (res.status === 401) {
        handleUnauthorized(true);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to remove item");
      }

      await onGetCartItems();
    } catch (error) {
      console.error("Remove cart item error:", error);
      toast.error(error.message || "Unable to remove item.");
    }
  };

  /**
   * Remove all cart items
   */
  const onRemoveAll = async () => {
    const token = getToken();

    if (!token) {
      handleUnauthorized(true);
      return;
    }

    try {
      const res = await fetch("/api/cart/removeAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleUnauthorized(true);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to clear cart");
      }

      resetCart();
    } catch (error) {
      console.error("Remove all cart error:", error);
      toast.error(error.message || "Unable to clear cart.");
    }
  };

  /**
   * Increase / decrease quantity
   */
  const toggleCartItemQuantity = async (id, value) => {
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    const foundProduct = safeCartItems.find(
      (item) => item?._id === id
    );

    if (!foundProduct) {
      return;
    }

    if (value === "inc") {
      await onAdd(
        foundProduct.product,
        1,
        foundProduct.size
      );
    }

    if (value === "dec") {
      if (foundProduct.quantity > 1) {
        await onRemove(
          foundProduct.product,
          1
        );
      }
    }
  };

  const incQty = () => {
    setQty((prevQty) => prevQty + 1);
  };

  const decQty = () => {
    setQty((prevQty) => {
      if (prevQty - 1 < 1) return 1;
      return prevQty - 1;
    });
  };

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
        onRemoveAll,
        setTotalPrice,
        setTotalQty,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useStateContext = () => useContext(Context);