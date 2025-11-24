import React from 'react';
import { MessageCircle, Shield, Heart, Sparkles, Instagram, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  // Contact Links
  const messengerMessage = encodeURIComponent('Hi! I would like to inquire about your products.');
  const messengerUrl = `https://m.me/renalyndv?text=${messengerMessage}`;
  const instagramUrl = 'https://www.instagram.com/hpglowpeptides';
  const viberUrl = `tel:+639062349763`; // Opens phone/Viber on mobile devices

  return (
    <footer className="bg-gradient-to-r from-black to-gray-900 text-white border-t border-gold-500/20">
      {/* Compact Footer Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 max-w-5xl mx-auto">
          
          {/* Brand Section */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="HP GLOW" 
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-xl object-cover border-2 border-gold-500/30"
            />
            <div className="text-center md:text-left">
              <div className="text-white font-bold text-sm md:text-base flex items-center gap-1.5">
                HP GLOW
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-gold-500" />
              </div>
              <div className="text-[10px] md:text-xs text-gray-400">Premium pep solutions</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-center md:justify-start">
            <a
              href="/coa"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all font-medium text-xs md:text-sm border border-gold-500/30"
            >
              <Shield className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Lab Reports</span>
              <span className="sm:hidden">Reports</span>
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all font-medium text-xs md:text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Instagram className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Instagram</span>
            </a>
            <a
              href={viberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all font-medium text-xs md:text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Phone className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Viber</span>
            </a>
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black px-4 py-2 md:px-5 md:py-2.5 rounded-lg transition-all font-semibold text-xs md:text-sm shadow-lg hover:shadow-gold-glow transform hover:scale-105"
            >
              <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Messenger</span>
              <span className="sm:hidden">Msg</span>
            </a>
          </div>

        </div>
      </div>

      {/* Compact Footer Bottom */}
      <div className="bg-black/50 py-3 md:py-4 border-t border-gold-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-1">
            <p className="text-[10px] md:text-xs text-gray-400 flex items-center justify-center gap-1.5 flex-wrap">
              Made with 
              <Heart className="w-3 h-3 text-gold-500 animate-pulse" />
              © {currentYear} HP GLOW. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
