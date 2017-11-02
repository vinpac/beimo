import React from 'react'
import PropTypes from 'prop-types'
import serialize from 'serialize-javascript'

/* eslint-disable react/no-danger */
const Document = ({ title, children, scripts, styles, appState }) => (
  <html className="no-js" lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {scripts.map(script => (
        <link key={script} rel="preload" href={script} as="script" />
      ))}
      {styles.map(style => (
        style.url
          ? <link rel="stylesheet" key={style.url} href={style.url} />
          : <style key={style.id} data-style-loaded="true">{style.body}</style>
      ))}
    </head>
    <body>
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
  title: PropTypes.string,
  scripts: PropTypes.arrayOf(PropTypes.string.isRequired),
  children: PropTypes.string.isRequired,
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
  title: '',
}

export default Document
