import React from 'react'
import PropTypes from 'prop-types'

class HomeView extends React.Component {
  static propTypes = {
    className: PropTypes.string,
  };

  static defaultProps = {
    className: '',
  };

  constructor(props) {
    super(props);

    this.state = {
      count: 5,
    }
  }

  render() {
    const { className } = this.props

    return (
      <div className={['HomeView', className].join(' ').trim()}>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          { this.state.count }
        </button>
        asd12321321qweqweqw6as4d5as64d
      </div>
    )
  }
}

export default HomeView
