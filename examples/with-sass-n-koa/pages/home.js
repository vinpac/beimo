import React from 'react'
import PropTypes from 'prop-types'
import Link from 'beimo/link' // eslint-disable-line
import s from './home.sass'

class HomeView extends React.Component {
  static propTypes = { color: PropTypes.string.isRequired };
  static path = '/'

  static getInitialProps = () => ({ color: 'red' })

  constructor(props) {
    super(props)

    this.state = { count: 5 }
  }

  renderList = () => {
    const r = []
    let i
    for (; i < 10000; i += 1) {
      r.push(<li key={i}>This is row { i + 1 }</li>)
    }
  }

  render() {
    const { color } = this.props

    return (
      <div className={s.component}>
        <h4>Color from store.getState: {color}</h4>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Count: { this.state.count }
        </button>
        <ul>
          {this.renderList()}
        </ul>
        <Link to="/adfsdf">Not found page</Link>
      </div>
    )
  }
}

export default HomeView
