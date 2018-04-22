import React from 'react'
import PropTypes from 'prop-types'
import Head from 'react-helmet'

const RE_VARIABLE = /\$([\w-]+)/
const compile = (source, variables) => {
  if (!variables || Object.keys(variables).length === 0) {
    return source
  }

  return source.replace(RE_VARIABLE, (match, name) => variables[name])
}

let StyleComponent
if (process.env) {
  class Style extends React.Component {
    static propTypes = {
      css: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    }

    state = {
      css: String(this.props.css),
    }

    componentDidMount() {
      if (this.props.css.addOnChange) {
        this.props.css.addOnChange(css => {
          this.setState({ css })
        })
      }
    }

    render() {
      const { css, variables } = this.props
      return (
        <Head>
          <style id="qweqwe">{compile(this.state.css, variables)}</style>
        </Head>
      )
    }
  }

  StyleComponent = Style
} else {
  const Style = ({ css, variables }) => (
    <Head>
      <style>{compile(css, variables)}</style>
    </Head>
  )

  Style.displayName = 'Style'
  Style.propTypes = {
    css: PropTypes.string.isRequired,
    variables: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  }
  Style.defaultProps = { variables: undefined }
  StyleComponent = Style
}

export default StyleComponent
