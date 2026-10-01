import { motion } from 'framer-motion';
import { Store, Send, Navigation, HeartHandshake } from 'lucide-react';

const steps = [
  {
    id: 1,
    name: 'Donor Uploads Surplus',
    description: 'A restaurant or supermarket logs in and posts available surplus food details.',
    icon: Store,
  },
  {
    id: 2,
    name: 'NGOs Notified',
    description: 'Nearby verified NGOs receive an alert and can instantly claim the food.',
    icon: Send,
  },
  {
    id: 3,
    name: 'Volunteer Collects',
    description: 'An assigned volunteer picks up the food and follows the optimized route.',
    icon: Navigation,
  },
  {
    id: 4,
    name: 'Food Delivered',
    description: 'The NGO receives the food safely and distributes it to those in need.',
    icon: HeartHandshake,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-orange-500 font-semibold tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            A simple process for a massive impact
          </p>
        </div>

        <div className="mt-16">
          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" aria-hidden="true"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md mb-6 relative">
                    <step.icon className="w-8 h-8" aria-hidden="true" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shadow-sm">
                      {step.id}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.name}</h3>
                  <p className="text-slate-500">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
