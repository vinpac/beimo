import React from 'react'
import PropTypes from 'prop-types'
import serialize from 'serialize-javascript'

/* eslint-disable react/no-danger */
const Document = ({ head, children, scripts, styles, appState }) => (
  <html className="no-js" lang="en" {...head.htmlAttributes.toComponent()}>
    <head>
      <meta charSet="utf-8" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {head.title.toComponent()}
      {head.meta.toComponent()}
      {head.style.toComponent()}
      {head.link.toComponent()}
      {scripts.map(script => (
        <link key={script} rel="preload" href={script} as="script" />
      ))}
      {styles.map(style => (
        style.url
          ? <link rel="stylesheet" key={style.url} href={style.url} />
          : <style key={style.id} data-style-loaded="true">{style.body}</style>
      ))}
    </head>
    <body {...head.bodyAttributes.toComponent()}>
      <div id="root" dangerouslySetInnerHTML={{ __html: children }} />
      <script
        dangerouslySetInnerHTML={{ __html: `window.APP_STATE=${serialize(appState)}` }}
      />
      {scripts.map(script => <script key={script} src={script} />)}
    </body>
  </html>
)

Document.displayName = 'Document'

Document.propTypes = {
  scripts: PropTypes.arrayOf(PropTypes.string.isRequired),
  children: PropTypes.string.isRequired,
  head: PropTypes.shape({
    htmlAttributes: PropTypes.object.isRequired,
    bodyAttributes: PropTypes.object.isRequired,
    title: PropTypes.object.isRequired,
    meta: PropTypes.object.isRequired,
    style: PropTypes.object.isRequired,
    link: PropTypes.object.isRequired,
  }).isRequired,
  appState: PropTypes.shape({ pageProps: PropTypes.object }).isRequired,
  styles: PropTypes.arrayOf(PropTypes.shape({
    filepath: PropTypes.string,
    content: PropTypes.string,
    url: PropTypes.string,
  })),
}

Document.defaultProps = {
  scripts: [],
  styles: [],
}

export default Document
