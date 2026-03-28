import React, { useState, useEffect, useContext } from 'react';
import { FiMenu, FiSearch, FiX, FiUser, FiShoppingCart, FiHeart, FiHome } from 'react-icons/fi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SignupModal from './SignupModal';
import { motion, AnimatePresence } from 'framer-motion';
import VerifyEmail from './VerifyEmail';
import Login from './Login';
import ProductCartSection from '@/pages/ProductCartSection';
import { AuthContext } from '../../context/AuthContext';

const navItems = [
  { label: 'HOME', path: '/' },
  { label: "MEN'S SCENTS", path: '/mens-collection' },
  { label: "WOMEN'S SCENTS", path: '/womens-collection' },
  { label: 'UNISEX SCENTS', path: '/unisex-collection' },
  { label: 'GIFTS', path: '/gift-collection' }
];

const Header = ({ darkMode, setDarkMode }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const INITIAL_HEIGHT = 120;
  const STICKY_HEIGHT = 80;
  const MOBILE_HEIGHT = 'auto';
  const SCROLL_THRESHOLD = 50;

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const top = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(top > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [menuOpen, searchOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) setSearchQuery('');
  };

  const toggleUserDropdown = () => setIsUserDropdownOpen(!isUserDropdownOpen);

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    setIsUserDropdownOpen(false);
    logout();
    setShowLogoutNotification(true);
    setTimeout(() => {
      setShowLogoutNotification(false);
    }, 3000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActiveNavItem = (path) => location.pathname === path;

  const currentHeight = isMobile ? MOBILE_HEIGHT : (isScrolled ? STICKY_HEIGHT : INITIAL_HEIGHT);

  const logoTop = isScrolled ? '18px' : '10px';
  const logoLeft = isScrolled ? '40px' : '50%';
  const logoTransform = isScrolled ? 'translateX(0%)' : 'translateX(-50%)';

  const navLayerTop = isScrolled ? '18px' : '75px';
  const iconLayerTop = isScrolled ? '22px' : '55px';

  const navFontSize = isScrolled ? '13px' : '14px';
  const navPadding = isScrolled ? '2px 6px' : '8px 6px';
  const navMinWidth = isScrolled ? '60px' : '90px';

  const spacerHeight = isMobile ? 100 : INITIAL_HEIGHT;

  return (
    <>
      <style>{`
        html::-webkit-scrollbar { display: none; }
        html { -ms-overflow-style: none; scrollbar-width: none; overflow-y: scroll; overflow-x: hidden; }
        body, #root { margin: 0; padding: 0; overflow-x: hidden; width: 100%; max-width: 100vw; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isMobile ? (
        <header className="fixed top-0 left-0 right-0 bg-white border-b z-[9999]" style={{ borderColor: '#B59B8E' }}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Link to="/">
                <img src="/images/Logo.png" alt="Logo" style={{ width: 60, height: 30, objectFit: 'contain' }} />
              </Link>

              <div className="flex-1 relative">
                <input
                  readOnly
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search For Perfume"
                  className="w-full pl-10 pr-4 py-2.5 border-2 focus:outline-none"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '13px',
                    fontWeight: '500',
                    borderRadius: '10px',
                    borderColor: '#8B6F47',
                    color: '#6b3f2a',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: '#8B6F47' }} />
              </div>

              <div className="flex gap-3">
                <Link to="/wishlist-collection"><FiHeart size={22} color="#341405" /></Link>
                <button onClick={() => setIsCartOpen(true)}><FiShoppingCart size={22} color="#341405" /></button>
                {user ? (
                  <button onClick={() => setIsUserDropdownOpen(v => !v)}>
                    <div className="w-6 h-6 rounded-full bg-[#341405] text-white flex items-center justify-center text-xs">
                      {(user.username || user.email)[0].toUpperCase()}
                    </div>
                  </button>
                ) : (
                  <button onClick={() => setIsSignupOpen(true)}><FiUser size={22} color="#341405" /></button>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap flex-shrink-0"
                style={{
                  border: '1.5px solid #8B6F47',
                  backgroundColor: '#F5F3F0',
                  color: '#6b3f2a',
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '13px',
                  fontWeight: '500',
                  letterSpacing: '1.2px'
                }}
              >
                <FiHome size={16} color="#6b3f2a" />
                HOME
              </button>

              {navItems.slice(1).map(item => {
                const active = isActiveNavItem(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-4 py-2.5 rounded-lg whitespace-nowrap flex-shrink-0 text-center"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '13px',
                      fontWeight: '500',
                      letterSpacing: '1.2px',
                      color: '#6b3f2a',
                      backgroundColor: active ? '#E8D4A0' : '#F5F3F0',
                      border: '1.5px solid #8B6F47'
                    }}
                  >
                    {item.label.replace("'S SCENTS", "'S").replace(" SCENTS", "")}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>
      ) : (
        <motion.header
          animate={{
            height: currentHeight,
            backgroundColor: '#ffffff',  // Always white like when scrolled
            borderBottomWidth: '0px'  // No border like when scrolled
          }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999]"
          style={{
            width: '100%',
            height: currentHeight,
            border: '1px solid #B59B8E',
            backgroundColor: '#ffffff',

            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="relative w-full h-full max-w-full mx-auto px-[52px] flex items-center justify-between">
            <div
              className="absolute flex items-center transition-all duration-300"
              style={{
                width: isScrolled ? 'auto' : '80px',
                height: '40px',
                top: logoTop,
                left: logoLeft,
                transform: logoTransform,
                zIndex: 10001,
                gap: isScrolled ? '12px' : '0'
              }}
            >
              {isScrolled && (
                <button
                  onClick={toggleSearch}
                  style={{
                    width: '24px',
                    height: '24px',
                    color: '#341405',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FiSearch size={22} />
                </button>
              )}
              <Link to="/">
                <motion.img
                  src="/images/Logo.png"
                  alt="Logo"
                  animate={{ scale: 0.78 }}
                  transition={{ duration: 0.25 }}
                  style={{ width: '90px', height: '45px', objectFit: 'contain' }}
                />
              </Link>
            </div>

            {/* Center Section: Navigation */}
            <motion.div
              transition={{ duration: 0.3 }}
              className="hidden md:flex items-center"
              style={{
                gap: '12px',
                pointerEvents: 'auto',
                zIndex: 10000,
                flex: 1,
                justifyContent: 'center',
                marginTop: isScrolled ? '0' : '35px' // Push nav down when not scrolled
              }}

            >
              {navItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    minWidth: navMinWidth,
                    padding: navPadding,
                    borderBottom: isActiveNavItem(item.path) ? '1px solid #341405' : 'none',
                    textAlign: 'center'
                  }}
                >
                  <Link
                    to={item.path}
                    className="hover:opacity-70"
                    style={{
                      fontFamily: 'Manrope',
                      fontWeight: '400',
                      fontSize: navFontSize,
                      textTransform: 'uppercase',
                      color: '#341405'
                    }}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </motion.div>

            {/* Right Section: Icons */}
            <div className="flex items-center" style={{ gap: '28px', flexShrink: 0 }}>
              {/* KEPT: Original commented code for reference */}
              {/* <div
                className="flex items-center transition-all duration-300"
                style={{
                  transform: isScrolled ? 'scale(0.95)' : 'scale(1)',
                  marginRight: isScrolled ? '18px' : '0px'
                }}
              >
                <button
                  onClick={toggleSearch}
                  style={{
                    width: '34px',
                    height: '34px',
                    color: '#341405'
                  }}
                >
                  <FiSearch size={34} />
                </button>
                {!isScrolled && (
                  <button
                    onClick={toggleSearch}
                    style={{
                      width: '26px',
                      height: '26px',
                      color: '#341405'
                    }}
                  >
                    <FiSearch size={24} />
                  </button>
                )}
              </div> */}

              <div className="flex items-center" style={{ gap: '22px' }}>
                <Link
                  to="/wishlist-collection"
                  style={{
                    width: '26px',
                    height: '26px',
                    color: '#341405',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <FiHeart size={24} />
                </Link>

                <button
                  onClick={openCart}
                  style={{
                    width: '26px',
                    height: '26px',
                    color: '#341405',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <FiShoppingCart size={24} />
                </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={toggleUserDropdown}
                    style={{
                      width: '24px',  // Reduced from 34px
                      height: '24px'
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center"
                      style={{
                        width: '26px',
                        height: '26px'
                      }}
                    >
                      {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 right-0 shadow-lg rounded-md overflow-hidden bg-[#F9F7F6]"
                        style={{
                          minWidth: '150px',
                          border: '1px solid #B59B8E',
                          padding: '8px 0',
                          zIndex: 10050
                        }}
                      >
                        <Link
                          to="/userProfile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="block px-4 py-2 hover:bg-[#E8D4A0] transition-colors"
                          style={{ color: '#341405', fontSize: '15px', fontWeight: '500' }}
                        >
                          My Profile
                        </Link>

                        <button
                          onClick={() => {
                            setIsLogoutModalOpen(true);
                            setIsUserDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-[#E8D4A0] transition-colors"
                          style={{ color: '#341405', fontSize: '15px', fontWeight: '500' }}
                        >
                          Logout
                        </button>
                      </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSignupOpen(true)}
                    style={{
                      width: '26px',
                      height: '26px',
                      color: '#341405',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <FiUser size={24} />
                  </button>
                )}
              </div>
            </div>


          </div>
        </motion.header>
      )}

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-64 bg-[#F9F7F6] shadow-lg"
            style={{ zIndex: 10010 }}
          >
            <div className="p-6">
              <button onClick={toggleMenu} className="mb-6 text-[#341405]">
                <FiX size={28} />
              </button>

              {navItems.map((item) => (
                <div key={item.label} className="mb-4">
                  <Link
                    to={item.path}
                    onClick={toggleMenu}
                    className="block py-2 text-lg text-[#341405]"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32"
            style={{ zIndex: 10030 }}
            onClick={toggleSearch}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-2xl p-8 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearchSubmit} className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for your perfect scent..."
                  className="flex-1 px-6 py-4 border-2 border-[#B59B8E] text-lg"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#79300f] to-[#5a2408] text-white px-8 py-4 font-semibold shadow-lg"
                >
                  Search
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ height: spacerHeight }} />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openVerify={() => {
          setIsSignupOpen(false);
          setIsVerifyOpen(true);
        }}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        setEmail={setEmail}
      />

      <VerifyEmail
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        openLogin={() => {
          setIsVerifyOpen(false);
          setIsLoginOpen(true);
        }}
        email={email}
      />

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ProductCartSection isOpen={isCartOpen} onClose={closeCart} />

      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
            style={{ zIndex: 10040 }}
            onClick={() => setIsLogoutModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#F9F7F6] border border-[#B59B8E] shadow-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-semibold text-[#341405] mb-4">Confirm Logout</h3>
              <p className="text-[#341405] mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-6 py-2 border-2 border-[#B59B8E] text-[#341405] font-semibold hover:bg-[#B59B8E] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-gradient-to-r from-[#79300f] to-[#5a2408] text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 right-8 bg-green-600 text-white px-6 py-4 shadow-2xl flex items-center gap-3 z-[10060]"
            style={{
              zIndex: 10060,
              borderRadius: '8px'
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold text-lg">Successfully logged out!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(Header);
