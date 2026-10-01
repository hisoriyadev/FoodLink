import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-emerald-600 tracking-tight">FoodLink</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Link to="/#about" className="text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</Link>
            <Link to="/#features" className="text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</Link>
            <Link to="/#how-it-works" className="text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">How It Works</Link>
            <Link to="/#contact" className="text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</Link>

            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3 border-l pl-4 border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-medium text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{user.role}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
                    title="Logout"
                  >
                    <FiLogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-slate-100 focus:outline-none"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200">
          <div className="pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <FiUser size={20} />
                  </div>
                  <div>
                    <div className="text-base font-medium text-slate-800">{user.name}</div>
                    <div className="text-sm font-medium text-slate-500 capitalize">{user.role}</div>
                  </div>
                </div>
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/#about"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
                >
                  About
                </Link>
                <Link 
                  to="/#features"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
                >
                  Features
                </Link>
                <Link 
                  to="/#how-it-works"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
                >
                  How It Works
                </Link>
                <Link 
                  to="/#contact"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
                >
                  Contact
                </Link>
                <Link 
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-emerald-600 border-t border-slate-100 hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link 
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
