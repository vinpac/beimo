import React from 'react'
import PropTypes from 'prop-types'

const Blog = ({ className }) => (
  <h1>BLOG asdasdasdasd qweqwe qweqwe asdasd
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
