import React from 'react'
import PropTypes from 'prop-types'
import fetch from 'isomorphic-fetch'
import { PageNotFoundError } from '../../../dist/modules/router'

const ProjectPage = ({ post }) => (
  <div>
    <h1>{post.name}</h1>
  </div>
)

ProjectPage.displayName = 'ProjectPage'
ProjectPage.propTypes = {
  className: PropTypes.string,
}
ProjectPage.defaultProps = {
  className: undefined,
}

ProjectPage.getInitialProps = ({ render, params: { slug } }) => {
  return fetch(`/api/post/${slug}`)
    .then(res => res.json())
    .then(post => ({ post }))
    .catch(error => {
      if (error.type === 'NotFound') {
        throw new PageNotFoundError()
      }

      throw error
    })
}

export default ProjectPage
