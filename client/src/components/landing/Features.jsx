import { motion } from 'framer-motion';
import { PackageOpen, Users, Truck, Clock, Sparkles, Bell, BarChart2, ShieldCheck } from 'lucide-react';

const features = [
  {
    name: 'Food Donation',
    description: 'Easily list surplus food with photos, quantity, and expiry details in seconds.',
    icon: PackageOpen,
  },
  {
    name: 'Smart NGO Matching',
    description: 'AI-powered algorithm matches donations to the nearest suitable NGO instantly.',
    icon: Users,
  },
  {
    name: 'Volunteer Management',
    description: 'Assign tasks to verified delivery partners with optimized routing.',
    icon: Truck,
  },
  {
    name: 'Real-Time Tracking',
    description: 'Track the entire journey from pickup to delivery with live updates.',
    icon: Clock,
  },
  {
    name: 'AI-Based Prioritization',
    description: 'Predictive analytics prioritize highly perishable items for immediate pickup.',
    icon: Sparkles,
  },
  {
    name: 'Notifications',
    description: 'Instant alerts via push, email, and SMS for new donations and claims.',
    icon: Bell,
  },
  {
    name: 'Analytics Dashboard',
    description: 'Visualize your impact with metrics on meals saved and CO2 reduced.',
    icon: BarChart2,
  },
  {
    name: 'Secure Authentication',
    description: 'Role-based access and verified profiles ensure a safe, trusted ecosystem.',
    icon: ShieldCheck,
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to redistribute food
          </p>
          <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
            Our comprehensive platform handles the logistics, so you can focus on the impact.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{feature.name}</h3>
                <p className="text-base text-slate-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
