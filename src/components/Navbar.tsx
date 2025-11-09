import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">Khidma</Link>
        <div className="flex items-center gap-6 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700'}`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700'}`
            }
          >
            Contact
          </NavLink>
        </div>
      </div>
    </nav>
  )
}


