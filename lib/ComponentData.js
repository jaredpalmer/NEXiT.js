import React from 'react'
import { Resolver } from './Resolver'
import {isClient } from './utils'

/* 
  - Handles passing of data down the tree and re-hydration between server and client
  - Wraps child with <Resolver> which mediates getting data from this component via context or fetching it directly if not available ...
  - Or if child is React Router it adds the createElement hook to Router so that route components always get wrapped with <Resolver>
  - When rendered on the server:
    - Saves props.data to state and makes it available via context for <Resolver> components
    - Renders a <script> tag to the DOM that contains props.data (for client-side re-hydration)
  - When rendered on the client:
    - Gets <script> data from DOM (before DOM gets wiped by client-side render)
    - Saves <script> data to state and makes it available via context for <Resolver> components
*/

class ComponentData extends React.PureComponent {

  constructor(props, context){
    super(props)

    this.state = {
      data: null
    }
  }

  getChildContext () {
    return {
      method: this.props.method,
      data: this.state.data,
      time: this.state.time
    }
  }

  componentWillMount() {
    // If client-side grab <script> data from DOM before it's wiped clean
    // This way we don't have to require that the library user add the <script> tag themself
    let time
    if (isClient()) {
      const d = new Date()
      time = d.getTime()
    } 

    if (this.props.data != null) {
      this.setState({ 
        data: this.props.data,
        time: time
      })
    }
  }

  render() {
    const { children } = this.props
    const Child = React.Children.only(children)

    let NewChild

    if (Child.type.displayName === 'Router' || Child.type.displayName === 'RouterContext'){
      NewChild = React.cloneElement(Child, { createElement: routerCreateElement() })
    } else {
      NewChild = wrapWithResolver(Child.type, Child.props)
    }

    return (
      <span>
        {NewChild}
      </span>
    )
  }
}

ComponentData.childContextTypes = {
  method: React.PropTypes.string,
  data: React.PropTypes.object,
  time: React.PropTypes.number
}

ComponentData.defaultProps = {
  method: 'getInitialProps',
  data: null
}

// Value for React Router createElement prop
// We use location key so that Resolver re-mounts on route change
function routerCreateElement() {
  return function(Component, props) {
    return wrapWithResolver(Component, props, props.location.key)
  }
}

function wrapWithResolver(WrappedComponent, props, key) {
  return (
    <Resolver key={key} mainComponent={true}>
      <WrappedComponent {...props} />
    </Resolver>
  )
}

// HOC (added manually to nested components)
// TODO: Merge with wrapWithResolver()
const withData = (WrappedComponent) => {
  return (props, context) => (
    <Resolver>
      <WrappedComponent {...props} />
    </Resolver>
  )
}


export { ComponentData, withData }