import { Component } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

class ProtectedRouteView extends Component {
  static contextType = AuthContext

  render() {
    const { session } = this.context
    return session ? <Outlet /> : <Navigate to="/login" replace state={{ from: this.props.location }} />
  }
}

export function ProtectedRoute() {
  const location = useLocation()
  return <ProtectedRouteView location={location} />
}
