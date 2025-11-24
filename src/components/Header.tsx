import React, { useState } from 'react';
import { ShoppingCart, Menu, X, MessageCircle, Sparkles, Instagram, Phone } from 'lucide-react';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Links
  const messengerMessage = encodeURIComponent('Hi! I am interested in your products.');
  const messengerUrl = `https://m.me/renalyndv?text=${messengerMessage}`;
  const instagramUrl = 'https://www.instagram.com/hpglowpeptides';
  const viberUrl = `tel:+639062349763`; // Opens phone/Viber on mobile devices

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gold-300/30">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Brand */}
            <button 
              onClick={() => { onMenuClick(); setMobileMenuOpen(false); }}
              className="flex items-center space-x-2 md:space-x-3 hover:opacity-90 transition-all group min-w-0 flex-1 max-w-[calc(100%-130px)] sm:max-w-none sm:flex-initial"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-black to-gray-900 shadow-xl flex items-center justify-center group-hover:shadow-gold-glow transition-all overflow-hidden border-2 border-gold-500/30 ring-1 ring-gold-500/20">
                  <img 
                    src="/logo.jpg" 
                    alt="HP GLOW" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full p-1.5 shadow-lg">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-black" />
                </div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-black leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  HP GLOW
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-gold-600 flex-shrink-0" />
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="hidden sm:inline">Premium pep solutions</span>
                    <span className="sm:hidden">Premium</span>
                  </span>
                </p>
              </div>
            </button>

            {/* Right Side Navigation */}
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2 lg:gap-3">
                <button
                  onClick={onMenuClick}
                  className="px-3 py-2 lg:px-4 lg:py-2 text-sm lg:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all font-medium"
                >
                  Products
                </button>
                <a
                  href="/coa"
                  className="px-3 py-2 lg:px-4 lg:py-2 text-sm lg:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all font-medium"
                >
                  Lab Reports
                </a>
                <a
                  href={messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg transition-all font-semibold text-sm lg:text-base shadow-md hover:shadow-gold-glow transform hover:scale-105 border border-gold-500/20"
                >
                  <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                  Messenger
                </a>
              </nav>

              {/* Cart Button */}
              <button
                onClick={onCartClick}
                className="relative bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-gold-glow text-sm sm:text-base md:text-lg border border-gold-500/20"
              >
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                <span className="hidden sm:inline">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black text-xs md:text-sm font-bold rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center animate-bounce shadow-lg">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-[66px] sm:top-[72px] right-0 left-0 bg-white shadow-2xl rounded-b-lg animate-slideIn border-t border-gold-300/30"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    onMenuClick();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-gold-300"
                >
                  🧪 Products
                </button>
                <a
                  href="/coa"
                  className="text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-gold-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📋 Lab Reports
                </a>
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm shadow-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                  <a
                    href={viberUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm shadow-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Phone className="w-4 h-4" />
                    Viber
                  </a>
                  <a
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-black to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all font-semibold text-sm shadow-md border border-gold-500/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat on Messenger
                  </a>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-1">
                  <button
                    onClick={() => {
                      onCartClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-black to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all font-semibold text-sm shadow-md border border-gold-500/20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View Cart ({cartItemsCount})
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
