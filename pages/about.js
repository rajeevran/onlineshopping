import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function About() {
  return (
    <>
      <Head>
        <title>About RanRax Fashion Pvt. Ltd. | Noadua</title>
        <meta name="description" content="Learn about RanRax Fashion Pvt. Ltd. and the Noadua fashion and lifestyle brand." />
      </Head>
      <main className="editorial-page about-page">
        <div className="editorial-eyebrow">THE STORY BEHIND NOADUA</div>
        <h1>Style that feels <em>like you.</em></h1>
        <p className="editorial-lead">Fashion and lifestyle, thoughtfully brought together for the way people live today.</p>
        <div className="editorial-rule" />
        <section className="editorial-copy">
          <h2>About RanRax Fashion Pvt. Ltd.</h2>
          <p>RanRax Fashion Pvt. Ltd. is a startup in the branded lifestyle fashion space in India. The Company operates a portfolio of distinctive fashion and lifestyle brands, designed to deliver relevant, accessible, and differentiated offerings to a diverse and evolving consumer base.</p>
          <p>Guided by a customer-first philosophy, RanRax Fashion Pvt. Ltd. has built the Noadua brand to be desirable, accessible, and distinct, while staying closely attuned to evolving consumer preferences.</p>
          <h2>Our approach</h2>
          <p>We believe great style should feel personal and accessible. Our focus is on listening to customers, responding to changing preferences, and creating a shopping experience that feels considered from discovery to delivery.</p>
          <p>As we grow, we aim to keep the customer at the centre of every decision and build lasting trust through clear information, thoughtful service, and an evolving selection of fashion and lifestyle products.</p>
        </section>
        <Link className="editorial-cta" href="/products">Discover Noadua <span aria-hidden="true">↗</span></Link>
      </main>
    </>
  )
}
