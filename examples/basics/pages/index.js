// css
import '../basics.css'

// pages
import home from './home'
import about from './about'
import notFound from './notFound'
import errorPage from './error'

export default {
  pages: [
    home,
    about,
  ],
  missPage: notFound,
  // You can return different pages depending on error
  resolveErrorPage: error => errorPage
}
