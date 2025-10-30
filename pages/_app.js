import React from 'react'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import { Layout } from '../components'
import { StateContext } from '../context/StateContext'
import Script from "next/script";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <StateContext>
      <Layout>
        <Toaster />
        <Component {...pageProps} />
      </Layout>
    </StateContext>
        </>
  )
}
