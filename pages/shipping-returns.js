import React from 'react'
import Head from 'next/head'

export default function ShippingReturns() {
  return (
    <>
      <Head>
        <title>Shipping & Returns | Noadua</title>
        <meta name="description" content="Shipping, delivery, cancellation, returns and refund information for Noadua orders." />
      </Head>
      <main className="editorial-page policy-page">
        <div className="editorial-eyebrow">FROM OUR STORE TO YOUR DOOR</div>
        <h1>Shipping <em>& returns.</em></h1>
        <p className="editorial-lead">The essential information for receiving an order, requesting a return, and understanding refunds.</p>
        <p className="policy-note">Before publishing, confirm the actual dispatch timelines, serviceable PIN codes, shipping fees, return window, exclusions, and refund timelines for your store.</p>
        <div className="editorial-rule" />
        <section className="editorial-copy">
          <h2>1. Order processing</h2>
          <p>After an order is placed, you should receive an order confirmation through the contact channel provided at checkout. Orders are processed after payment and order checks are complete. Processing may take longer during sale periods, holidays, or periods of unusually high demand.</p>
          <h2>2. Shipping and delivery</h2>
          <p>Available delivery options, applicable charges, and estimated delivery dates should be displayed at checkout when available. Delivery estimates depend on the destination PIN code, courier service, product availability, and other operational factors. Please ensure the shipping address and phone number are accurate.</p>
          <h2>3. Tracking and delivery issues</h2>
          <p>Where tracking is available, order progress can be checked using the order details or tracking information provided. If a parcel appears delayed, is marked delivered but has not been received, or arrives damaged, contact customer support with your order number and relevant details.</p>
          <h2>4. Cancellation requests</h2>
          <p>Cancellation may be possible before an order is processed or handed to the delivery partner. Once dispatch has occurred, a cancellation request may need to be handled under the return process. Any eligible refund should be processed to the original payment method or as otherwise permitted by applicable law.</p>
          <h2>5. Return eligibility</h2>
          <p>Return eligibility, the applicable return window, and any product exclusions must be clearly stated on the website and/or order documentation. Products requested for return should generally be unused, unwashed, undamaged, and returned with original tags and packaging, subject to applicable consumer rights and any product-specific conditions.</p>
          <h2>6. How to request a return</h2>
          <p>Contact the official customer-support channel with your order number, the item you wish to return, and the reason for the request. Please wait for return instructions before sending an item back. Return requests may require photos where an item is damaged, defective, or incorrect.</p>
          <h2>7. Damaged, defective, or incorrect items</h2>
          <p>If an item arrives damaged, defective, or different from what was ordered, contact support as soon as reasonably possible and include clear photos and the order number. The company should assess the issue and provide an appropriate resolution in accordance with applicable law and the published policy.</p>
          <h2>8. Refunds</h2>
          <p>Once a return or cancellation is approved and any required checks are complete, eligible refunds should be initiated through the original payment method where possible. The time for the amount to appear can depend on the payment provider or bank. Any approved shipping-charge refund and any non-refundable charges must be communicated clearly in the final policy.</p>
          <h2>9. Exchanges</h2>
          <p>Exchanges are subject to stock availability and the store’s published exchange rules. If an exchange cannot be fulfilled, the customer should be informed of the available alternatives.</p>
          <h2>10. Contact and policy updates</h2>
          <p>For shipping, return, or refund questions, use the official customer-support details published on the website and include your order number. This policy may be updated; the live version should clearly state its effective date.</p>
        </section>
      </main>
    </>
  )
}
