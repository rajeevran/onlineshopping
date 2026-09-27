import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FiArrowLeft, FiCheck, FiCreditCard, FiEdit2, FiMapPin, FiPlus, FiShield } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { imageUrl } from "../lib/imageUrl";
import api from "../lib/axiosInstance";

const emptyAddress = {
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CheckoutPage = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [checkoutSource, setCheckoutSource] = useState("cart");
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to continue to checkout.");
      router.replace("/login");
      return;
    }

    try {
      const storedItems = JSON.parse(sessionStorage.getItem("checkoutItems") || "[]");
      const source = sessionStorage.getItem("checkoutSource") || "cart";
      if (!Array.isArray(storedItems) || storedItems.length === 0) {
        toast.error("Your checkout session is empty.");
        router.replace("/cart");
        return;
      }
      setItems(storedItems);
      setCheckoutSource(source);
    } catch (error) {
      console.error(error);
      router.replace("/cart");
    }
  }, [router]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/checkout");
      const data = response.data;
      setUser(data.user);
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      setBanks(Array.isArray(data.banks) ? data.banks : []);
      setSelectedAddressId(data.defaultAddress?._id || data.addresses?.[0]?._id || "");
      setSelectedBankId(data.defaultBank?._id || data.banks?.[0]?._id || "");
    } catch (error) {
      console.error("Checkout data error:", error);
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || "Unable to load checkout details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      loadCheckoutData();
    }
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.product?.price ?? item.price ?? 0) * Number(item.quantity || 1), 0),
    [items]
  );

  const shipping = 0;
  const total = subtotal + shipping;
  const selectedAddress = addresses.find((address) => address._id === selectedAddressId);
  const selectedBank = banks.find((bank) => bank._id === selectedBankId);

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({ ...emptyAddress, name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(), phone: user?.phone || "" });
    setShowAddressModal(true);
  };

  const openEditAddress = (address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      name: address.name || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      isDefault: Boolean(address.isDefault),
    });
    setShowAddressModal(true);
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    try {
      const response = editingAddressId
        ? await api.put("/checkout", { ...addressForm, _id: editingAddressId })
        : await api.post("/checkout", addressForm);

      if (editingAddressId) {
        setAddresses((current) => current.map((address) => address._id === editingAddressId ? response.data : address));
      } else {
        setAddresses((current) => [...current, response.data]);
      }

      if (addressForm.isDefault || !selectedAddressId) {
        setSelectedAddressId(response.data._id);
      }

      setShowAddressModal(false);
      setEditingAddressId(null);
      setAddressForm(emptyAddress);
      await loadCheckoutData();
      toast.success(editingAddressId ? "Address updated." : "Address saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save address.");
    }
  };

  const startPayment = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }

    if (!items.length) {
      toast.error("There are no items to checkout.");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    setPlacingOrder(true);

    try {
      const paymentOrderResponse = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: total,
          items: items.map((item) => ({
            productId: item.product?._id || item.productId || item._id,
            quantity: Number(item.quantity || 1),
          })),
        }),
      });

      const paymentOrder = await paymentOrderResponse.json();
      if (!paymentOrderResponse.ok) {
        throw new Error(paymentOrder.message || paymentOrder.error || "Unable to start payment.");
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Noadua",
        image: `${imageUrl('/Logo.png')}`,
        description: `${items.length} item${items.length > 1 ? "s" : ""} order`,
        order_id: paymentOrder.id,
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.email || "",
          contact: user?.phone || selectedAddress?.phone || "",
        },
        notes: {
          addressId: selectedAddressId,
          bankAccountId: selectedBankId || "",
          checkoutSource,
        },
        theme: { color: "#292621" },
        modal: {
          ondismiss: () => setPlacingOrder(false),
        },
        handler: async (response) => {
          try {
            const orderResponse = await fetch("/api/order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                products: items.map((item) => ({
                  productId: item.product?._id || item.productId || item._id,
                  quantity: Number(item.quantity || 1),
                  price: Number(item.product?.price ?? item.price ?? 0),
                  size: item.size || "",
                })),
                totalAmount: total,
                addressId: selectedAddressId,
                bankAccountId: selectedBankId || null,
                paymentMethod: "Razorpay",
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const orderData = await orderResponse.json();
            if (!orderResponse.ok) {
              throw new Error(orderData.error || orderData.message || "Unable to create order.");
            }

            if (checkoutSource === "cart") {
              await fetch("/api/cart/removeAll", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              });
            }

            sessionStorage.removeItem("checkoutItems");
            sessionStorage.removeItem("checkoutSource");
            toast.success("Payment successful. Your order has been placed!");
            router.replace("/myorders");
          } catch (error) {
            console.error("Order creation error:", error);
            toast.error(error.message || "Payment completed, but order confirmation failed. Please contact support.");
          } finally {
            setPlacingOrder(false);
          }
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment start error:", error);
      toast.error(error.message || "Unable to start payment.");
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <main className="checkout-page"><div className="checkout-loading">Preparing your secure checkout…</div></main>;
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-topbar">
          <button className="checkout-back" onClick={() => router.back()}><FiArrowLeft /> Back</button>
          <div className="checkout-brand">SECURE CHECKOUT</div>
          <div className="checkout-secure"><FiShield /> Secure</div>
        </div>

        <div className="checkout-progress">
          <div className="checkout-progress-step active"><span><FiCheck /></span><b>Review</b></div>
          <div className="checkout-progress-line" />
          <div className="checkout-progress-step active"><span>2</span><b>Payment</b></div>
          <div className="checkout-progress-line" />
          <div className="checkout-progress-step"><span>3</span><b>Confirmation</b></div>
        </div>

        <div className="checkout-heading">
          <div>
            <p className="checkout-eyebrow">ALMOST THERE</p>
            <h1>Confirm your order</h1>
            <p>Review your delivery details and payment information before placing your order.</p>
          </div>
          <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="checkout-grid">
          <section className="checkout-main">
            <div className="checkout-card">
              <div className="checkout-card-header">
                <div><span className="checkout-number">01</span><div><h2>Delivery address</h2><p>Where should we deliver your order?</p></div></div>
                <button className="checkout-outline-btn" onClick={openNewAddress}><FiPlus /> Add new</button>
              </div>

              {addresses.length === 0 ? (
                <div className="checkout-empty-state">
                  <FiMapPin size={30} />
                  <h3>Add your delivery address</h3>
                  <p>You need a delivery address before you can place the order.</p>
                  <button className="checkout-primary-btn small" onClick={openNewAddress}>Add address</button>
                </div>
              ) : (
                <div className="checkout-address-list">
                  {addresses.map((address) => (
                    <label key={address._id} className={`checkout-address ${selectedAddressId === address._id ? "selected" : ""}`}>
                      <input type="radio" name="checkout-address" checked={selectedAddressId === address._id} onChange={() => setSelectedAddressId(address._id)} />
                      <span className="checkout-radio" />
                      <span className="checkout-address-content">
                        <span className="checkout-address-title"><b>{address.name}</b>{address.isDefault && <em>DEFAULT</em>}</span>
                        <span>{address.street}, {address.city}, {address.state} - {address.pincode}</span>
                        <span className="checkout-phone">+91 {address.phone}</span>
                      </span>
                      <button type="button" className="checkout-icon-btn" onClick={(event) => { event.preventDefault(); openEditAddress(address); }} aria-label="Edit address"><FiEdit2 /></button>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="checkout-card">
              <div className="checkout-card-header">
                <div><span className="checkout-number">02</span><div><h2>Payment method</h2><p>Pay securely using Razorpay.</p></div></div>
              </div>

              <div className="payment-method-selected">
                <div className="payment-method-icon"><FiCreditCard /></div>
                <div className="payment-method-copy"><b>Razorpay</b><span>UPI, cards, net banking and supported payment methods</span></div>
                <span className="payment-secure"><FiShield /> Secure</span>
              </div>

              {banks.length > 0 && (
                <div className="saved-bank-section">
                  <div className="saved-bank-title"><span>Saved bank details</span><small>For your reference</small></div>
                  <div className="saved-bank-list">
                    {banks.map((bank) => {
                      const masked = bank.accountNumber ? `•••• •••• ${String(bank.accountNumber).slice(-4)}` : "Account number hidden";
                      return (
                        <label key={bank._id} className={`saved-bank ${selectedBankId === bank._id ? "selected" : ""}`}>
                          <input type="radio" name="bank-account" checked={selectedBankId === bank._id} onChange={() => setSelectedBankId(bank._id)} />
                          <span className="checkout-radio" />
                          <span><b>{bank.bankName}</b><small>{bank.accountHolder} · {masked} · {bank.ifsc}</small></span>
                          {bank.isDefault && <em>DEFAULT</em>}
                        </label>
                      );
                    })}
                  </div>
                  <p className="payment-note">Your bank details are masked here. Payment is completed through Razorpay's secure checkout.</p>
                </div>
              )}
            </div>

            <div className="checkout-card order-items-card">
              <div className="checkout-card-header">
                <div><span className="checkout-number">03</span><div><h2>Order items</h2><p>Review what you're purchasing.</p></div></div>
              </div>
              <div className="checkout-items">
                {items.map((item, index) => {
                  const product = item.product || item;
                  const itemPrice = Number(product.price ?? item.price ?? 0);
                  return (
                    <div className="checkout-item" key={`${product._id || item.productId}-${index}`}>
                      <div className="checkout-item-image"><img src={imageUrl(product.images?.[0])} alt={product.name || "Product"} /></div>
                      <div className="checkout-item-copy"><b>{product.name}</b><span>{item.size ? `Size: ${String(item.size).toUpperCase()} · ` : ""}Qty: {item.quantity || 1}</span></div>
                      <strong>{money(itemPrice * Number(item.quantity || 1))}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="checkout-summary-card">
            <div className="checkout-summary-head"><span>ORDER SUMMARY</span><b>{items.length} item{items.length !== 1 ? "s" : ""}</b></div>
            <div className="checkout-summary-address">
              <span><FiMapPin /> Deliver to</span>
              {selectedAddress ? <b>{selectedAddress.name}, {selectedAddress.city}</b> : <small>Select an address above</small>}
            </div>
            <div className="checkout-summary-lines">
              <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div><span>Shipping</span><b className="free">FREE</b></div>
              <div className="checkout-total"><span>Total</span><b>{money(total)}</b></div>
            </div>
            <button className="checkout-primary-btn" disabled={placingOrder || !selectedAddressId} onClick={startPayment}>
              {placingOrder ? "Opening secure payment…" : `Pay ${money(total)}`}
            </button>
            <div className="checkout-trust"><FiShield /><span>Secure payment · Encrypted checkout · Order confirmation by email</span></div>
            <p className="checkout-terms">By placing this order, you agree to our terms, privacy policy and return policy.</p>
          </aside>
        </div>
      </div>

      {showAddressModal && (
        <div className="checkout-modal-backdrop" onMouseDown={() => setShowAddressModal(false)}>
          <div className="checkout-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="checkout-modal-header"><div><p>DELIVERY</p><h2>{editingAddressId ? "Edit address" : "Add address"}</h2></div><button onClick={() => setShowAddressModal(false)}>×</button></div>
            <form onSubmit={saveAddress}>
              <div className="checkout-form-grid">
                {[
                  ["name", "Full name"],
                  ["phone", "Phone number"],
                  ["street", "Address / Street"],
                  ["city", "City"],
                  ["state", "State"],
                  ["pincode", "PIN code"],
                ].map(([name, label]) => (
                  <label key={name} className={name === "street" ? "full" : ""}>{label}<input name={name} value={addressForm[name]} onChange={(event) => setAddressForm({ ...addressForm, [name]: event.target.value })} required /></label>
                ))}
              </div>
              <label className="checkout-default-check"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} /> Set as default delivery address</label>
              <div className="checkout-modal-actions"><button type="button" className="checkout-outline-btn" onClick={() => setShowAddressModal(false)}>Cancel</button><button type="submit" className="checkout-primary-btn small">Save address</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CheckoutPage;
