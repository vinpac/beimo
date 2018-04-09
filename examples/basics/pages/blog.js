import React from 'react'
import PropTypes from 'prop-types'
import Button from '../components/button'

const Blog = ({ className }) => (
  <h1>BLOG  qwqweqweeqwe qweqwewq asdasd
  <Button />
  </h1>
)

Blog.displayName = 'Blog'
Blog.propTypes = {
  className: PropTypes.string,
}
Blog.defaultProps = {
  className: undefined,
}

export default Blog
