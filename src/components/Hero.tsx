import React from 'react';
import { Shield, Beaker, Sparkles, Heart, CheckCircle2 } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gold-200/15 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gray-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-16 left-20 w-72 h-72 bg-gold-100/15 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob animation-delay-4000"></div>
      </div>

      {/* Compact Content Container */}
      <div className="relative container mx-auto px-4 py-6 md:py-8 lg:py-10">
        <div className="text-center max-w-5xl mx-auto">
          
          {/* Premium Badge - Compact */}
          <div className="inline-flex items-center gap-2 md:gap-2.5 bg-gradient-to-r from-white via-gold-50/40 to-white backdrop-blur-md px-5 py-2.5 md:px-6 md:py-3 rounded-full shadow-lg mb-4 md:mb-5 border border-gold-300/50 hover:border-gold-400 transition-all">
            <Sparkles className="w-4 h-4 md:w-4 md:h-4 text-gold-600 animate-pulse" />
            <span className="text-sm md:text-base font-bold text-black">
              ✨ Premium Quality Guaranteed ✨
            </span>
            <Sparkles className="w-4 h-4 md:w-4 md:h-4 text-gold-600 animate-pulse" />
          </div>

          {/* Main Heading - Enhanced with Visual Effects */}
          <div className="mb-5 md:mb-6 relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              <div className="inline-block">
                {/* First Line */}
                <span className="relative inline-block mb-1">
                  <span className="text-black font-extrabold tracking-tight drop-shadow-sm">Premium </span>
                  <span className="relative inline-block group">
                    <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-700 bg-clip-text text-transparent font-extrabold drop-shadow-sm relative z-10">
                      pep solutions
                    </span>
                    <span className="absolute -bottom-0.5 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></span>
                  </span>
                  <span className="text-gray-700 font-semibold"> for</span>
                </span>
                <br className="hidden sm:block" />
                
                {/* Second Line - Benefits with gradients and hover effects */}
                <span className="relative inline-block mt-1 sm:mt-2">
                  <span className="relative inline-block group">
                    <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 bg-clip-text text-transparent font-extrabold drop-shadow-sm relative z-10 transition-all duration-300 group-hover:scale-105">
                      radiance
                    </span>
                    <span className="absolute -inset-1 bg-gold-500/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </span>
                  <span className="text-gray-500 mx-1">,</span>
                  
                  <span className="relative inline-block group">
                    <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 bg-clip-text text-transparent font-extrabold drop-shadow-sm relative z-10 transition-all duration-300 group-hover:scale-105">
                      confidence
                    </span>
                    <span className="absolute -inset-1 bg-gold-500/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </span>
                  <span className="text-gray-500 mx-1"> & </span>
                  
                  <span className="relative inline-block group">
                    <span className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 bg-clip-text text-transparent font-extrabold drop-shadow-sm relative z-10 transition-all duration-300 group-hover:scale-105">
                      vitality
                    </span>
                    <span className="absolute -inset-1 bg-gold-500/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <Heart className="absolute -right-5 sm:-right-6 md:-right-7 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gold-500 animate-pulse drop-shadow-sm" />
                  </span>
                </span>
              </div>
            </h1>
            
            {/* Enhanced decorative underline with shimmer effect */}
            <div className="flex items-center justify-center gap-2 mt-3 md:mt-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="h-0.5 w-10 md:w-14 bg-gradient-to-r from-transparent via-gold-400/60 to-gold-400/60 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse shadow-sm shadow-gold-500/50"></div>
              <div className="h-0.5 w-10 md:w-14 bg-gradient-to-l from-transparent via-gold-400/60 to-gold-400/60 rounded-full"></div>
            </div>
          </div>
          
          {/* Compact Trust Badges - 2 Cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-xl md:max-w-2xl mx-auto mb-5 md:mb-6">
            <div className="group bg-white/95 backdrop-blur-sm rounded-lg p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-gold-300">
              <div className="bg-gradient-to-br from-black to-gray-900 p-2.5 md:p-3 rounded-lg mb-2.5 md:mb-3 inline-block shadow-md border border-gold-500/30 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-gold-500" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h3 className="text-sm md:text-base font-bold text-black">Premium Quality</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Lab verified</p>
            </div>
            
            <div className="group bg-gradient-to-br from-gold-50/60 via-white to-gold-50/60 backdrop-blur-sm rounded-lg p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gold-200/50 hover:border-gold-400/50">
              <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-2.5 md:p-3 rounded-lg mb-2.5 md:mb-3 inline-block shadow-md group-hover:scale-105 transition-transform">
                <Beaker className="w-5 h-5 md:w-6 md:h-6 text-black" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h3 className="text-sm md:text-base font-bold text-black">Excellence</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Luxury standard</p>
            </div>
          </div>
          
          {/* Compact Premium Banner */}
          <div className="bg-white backdrop-blur-sm rounded-lg border border-gray-200 p-3 md:p-4 shadow-lg max-w-3xl mx-auto hover:border-gold-300 transition-all">
            <p className="text-xs sm:text-sm md:text-base text-center text-gray-700 leading-relaxed font-medium">
              <span className="inline-flex items-center gap-1.5 md:gap-2">
                <Shield className="w-3 h-3 md:w-4 md:h-4 text-gold-600" />
                <strong className="text-black">PREMIUM QUALITY:</strong>
              </span>
              {' '}EXPERIENCE LUXURY AND ELEGANCE IN EVERY DETAIL
            </p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Hero;
