import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/Navbar.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          💳 Gateway
        </Link>

        <div className={`hamburger ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <li className="navbar-item">
            <Link 
              to="/" 
              className={`navbar-link ${isActive('/')}`}
              onClick={closeMenu}
            >
              🏠 Pagamento
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/history" 
              className={`navbar-link ${isActive('/history')}`}
              onClick={closeMenu}
            >
              📋 Histórico
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}