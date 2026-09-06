import React from 'react'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import { Layout } from '../components'
import { StateContext } from '../context/StateContext'
import Script from "next/script";
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute = router.pathname === '/admin' || router.pathname === '/admin-login';

  const content = (
    <>
      <Toaster />
      <Component {...pageProps} />
    </>
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <StateContext>
        {isAdminRoute ? content : <Layout>{content}</Layout>}
      </StateContext>
    </>
  )
}
