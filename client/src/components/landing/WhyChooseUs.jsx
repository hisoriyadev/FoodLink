import { motion } from 'framer-motion';
import { Leaf, Users, Cpu, Zap, Shield, RefreshCw } from 'lucide-react';

const reasons = [
  { name: 'Reduce Food Waste', icon: Leaf },
  { name: 'Help Communities', icon: Users },
  { name: 'AI Powered', icon: Cpu },
  { name: 'Fast Distribution', icon: Zap },
  { name: 'Secure Platform', icon: Shield },
  { name: 'Real-Time Updates', icon: RefreshCw },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-emerald-900 text-white overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 w-96 h-96 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl text-white">
            Why Choose FoodLink?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col items-center p-6 bg-emerald-800/50 rounded-2xl border border-emerald-700/50 backdrop-blur-sm hover:bg-emerald-700 transition-colors"
            >
              <reason.icon className="w-10 h-10 text-orange-400 mb-4" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-center">{reason.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
