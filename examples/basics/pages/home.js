import React from 'react'
import s from './home.css'
import image from './image.jpg'
import Link from '../../../dist/modules/router/link'

const HomePage = ({ items, renderForm }) => (
  <div className={s.page}>
    <img src={image} alt="" />
    <Link href="/about">asdasdasdasdasdasdqweqwe</Link>
    <h1>{items.join(', ')} a<button onClick={() => console.log('asdasdasdasdqweqw')}>Hey</button>
    </h1>
  </div>
)

HomePage.displayName = 'HomePage'
HomePage.getInitialProps = () => {
  return { items: [1,2,3,5, 6,, 7, 8, 4] }
}

export default HomePage
