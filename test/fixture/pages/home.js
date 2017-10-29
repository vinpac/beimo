import React from 'react'
import PropTypes from 'prop-types'
import Link from 'beimo/link' // eslint-disable-line

class HomeView extends React.Component {
  static propTypes = { color: PropTypes.string.isRequired };
  static path = '/home'

  static getInitialProps = async ({ store, yieldProps }) => {
    yieldProps({ color: store.getState().color })
    await new Promise(resolve => setTimeout(resolve, 1000))

    return { color: 'red' }
  }

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
      <div className="home">
        <h4>Color: {color}</h4>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Count: { this.state.count }
        </button>
        <ul>
          {this.renderList()}
        </ul>
        {color}
        <Link to="/adfsdf"> asdasd</Link>
      </div>
    )
  }
}

export default HomeView
