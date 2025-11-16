import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import { publicAsset } from '../config';
import { 
  FiHome, FiUsers, FiUserCheck, FiUser, FiCalendar, FiBook, 
  FiMenu, FiSearch, FiSun, FiMoon, FiGrid, FiArrowRight, FiLayers, FiCheckSquare
} from 'react-icons/fi';

export default function DashboardLayout({ children }) {
  const { logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Get search placeholder based on current route
  const getSearchPlaceholder = () => {
    if (location.pathname.startsWith('/students')) {
      return 'Search students...';
    } else if (location.pathname.startsWith('/teachers')) {
      return 'Search teachers...';
    } else if (location.pathname.startsWith('/admin')) {
      return 'Search admins...';
    } else if (location.pathname.startsWith('/schools')) {
      return 'Search schools...';
    }
    return 'Search...';
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile when resizing to mobile
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      // Auto-open sidebar on desktop when resizing to desktop
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/students', label: 'Students', icon: FiUsers },
    { path: '/teachers', label: 'Teachers', icon: FiUserCheck },
    { path: '/admin', label: 'Admins', icon: FiUser },
    { path: '/schools', label: 'Schools', icon: FiLayers },
    { path: '/subjects', label: 'Subjects', icon: FiBook },
    { path: '/timetable', label: 'Timetable', icon: FiCalendar },
    { path: '/attendance', label: 'Attendance', icon: FiCheckSquare },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`dashboard-layout ${isDark ? 'dark-theme' : 'light-theme'} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {sidebarOpen && isMobile && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="dashboard-sidebar-header">
          <div className="dashboard-logo-container">
            <img 
              src={publicAsset('Images/logo.png')} 
              alt="Midland International School" 
              className="dashboard-logo dashboard-logo-big"
            />
            <img 
              src={publicAsset('Images/sideLogo.png')} 
              alt="Midland International School" 
              className="dashboard-logo dashboard-logo-small"
            />
          </div>
        </div>
        
        <nav className="dashboard-sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            // Improved active state detection for nested routes
            const isActive = item.path === '/' 
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`dashboard-nav-link ${isActive ? 'active' : ''}`}
                title={item.label}
                onClick={(e) => {
                  // Ensure navigation works properly
                  if (location.pathname === item.path) {
                    e.preventDefault();
                  }
                  // Close sidebar on mobile when clicking a link
                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-sidebar-footer">
          <button
            onClick={handleLogout}
            className="dashboard-logout-btn"
            title="Logout"
          >
            <span>Logout</span>
            <FiArrowRight size={16} />
          </button>
        </div>
      </aside>

      <div className="dashboard-content-wrapper">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button 
              className="topbar-menu-btn" 
              aria-label="Menu"
              onClick={toggleSidebar}
            >
              <FiMenu size={20} />
            </button>
            {!location.pathname.startsWith('/students') && 
             !location.pathname.startsWith('/teachers') && 
             !location.pathname.startsWith('/admin') && 
             !location.pathname.startsWith('/schools') && (
              <div className="topbar-search">
                <FiSearch size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            )}
          </div>
          <div className="topbar-right">
            <button className="topbar-icon-btn" aria-label="Grid">
              <FiGrid size={20} />
            </button>
            <button 
              className="topbar-icon-btn theme-toggle" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </header>

        <main className="dashboard-main">
        {children}
      </main>
      </div>
    </div>
  );
}

