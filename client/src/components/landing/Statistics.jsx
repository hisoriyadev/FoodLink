import { motion } from 'framer-motion';

const stats = [
  { id: 1, name: 'Meals Saved', value: '1.2M+' },
  { id: 2, name: 'Active Donors', value: '8,500+' },
  { id: 3, name: 'Partner NGOs', value: '450+' },
  { id: 4, name: 'Volunteers', value: '2,100+' },
];

const Statistics = () => {
  return (
    <div className="bg-emerald-600 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-3 text-base font-medium text-emerald-100 uppercase tracking-wide">
                {stat.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
