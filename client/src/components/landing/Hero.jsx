import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Heart } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="relative bg-slate-50 overflow-hidden pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Connecting <span className="text-emerald-600">Surplus Food</span> With Those Who Need It Most
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl">
              Join our mission to reduce food waste and combat hunger. FoodLink makes it easy for restaurants, supermarkets, and individuals to donate surplus food to local NGOs and shelters instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register?role=donor"
                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <Heart className="mr-2 h-5 w-5" />
                Donate Food
              </Link>
              <Link
                to="/register?role=ngo"
                className="inline-flex justify-center items-center px-6 py-3 border border-emerald-600 text-base font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 shadow-sm transition-colors"
              >
                <Search className="mr-2 h-5 w-5" />
                Find Food
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Image Placeholder */}
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-emerald-100 aspect-[4/3] relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-orange-400/20 mix-blend-multiply"></div>
               <span className="text-emerald-800 font-medium text-lg">Hero Illustration Placeholder</span>
            </div>
            
            {/* Floating Stat Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4"
            >
              <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Meals Donated</p>
                <p className="text-xl font-bold text-slate-900">50,000+</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-30"></div>
    </section>
  );
};

export default Hero;
