import React from 'react'
import s from './home.css'
import image from './image.jpg'
import Link from '../../../dist/modules/router/link'
import abacate from '../lib'

const HomePage = ({ items, renderForm }) => (
  <div className={s.page}>
    <Link href="/about">qweqqweqweqwewqqweweqweqwe</Link>
    <h1>{items.join(', ')} a<button onClick={() => console.log('asdasdasdasdqweqw')}>Hey</button>
    </h1>
  </div>
)

HomePage.displayName = 'HomePage'
HomePage.getInitialProps = ({ send }) => {
  return { items: [1,2,3,5, 6,, 7, 8, 4] }
}

export default abacate(HomePage)
