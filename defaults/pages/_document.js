import React from 'react'
import PropTypes from 'prop-types'
import serialize from 'serialize-javascript'

/* eslint-disable react/no-danger */
const Document = ({ scripts, head, styles, appState, children }) => (
  <html className="no-js" lang="en">
    <head>
      {scripts.map(script => <link key={script.src} rel="preload" href={script.src} as="script" />)}
      <meta charSet="utf-8" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {head.title.toComponent()}
      {head.meta.toComponent()}
      {head.style.toComponent()}
      {head.script.toComponent()}
      {head.link.toComponent()}
      {styles.map(style => (
        style.url
          ? <link rel="stylesheet" key={style.url} href={style.url} />
          : <style key={style.id} data-style-loaded="true">{style.body}</style>
      ))}
    </head>
    <body>
      <div id="root" dangerouslySetInnerHTML={{ __html: children }} />
      <script dangerouslySetInnerHTML={{
        __html: `
          window.__BEIMO_REGISTERED_PAGES = [];
          window.__BEIMO_REGISTER_PAGE = function(route, load) {
            window.__BEIMO_REGISTERED_PAGES.push([route, load]);
          }
          window.APP_STATE=${serialize(appState)};
        `,
      }}
      />
      {scripts.map(script => <script type="text/javascript" key={script.src} {...script} />)}
    </body>
  </html>
)

Document.displayName = 'Document'
Document.propTypes = {
  scripts: PropTypes.arrayOf(
    PropTypes.shape({ src: PropTypes.string.isRequired }),
  ),
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
  styles: PropTypes.arrayOf(
    PropTypes.shape({
      filepath: PropTypes.string,
      content: PropTypes.string,
      url: PropTypes.string,
    }),
  ),
}

Document.defaultProps = {
  scripts: [],
  styles: [],
}

export default Document
