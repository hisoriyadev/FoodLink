import { motion } from 'framer-motion';

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">About FoodLink</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Turning Food Waste Into Social Good
            </p>
            <div className="mt-6 space-y-6 text-slate-600 text-lg">
              <p>
                Globally, one-third of all food produced is wasted, while millions go hungry. FoodLink exists to bridge this gap through technology.
              </p>
              <p>
                We provide a seamless platform connecting surplus food generators—like restaurants and supermarkets—with local NGOs and volunteers. By digitizing the donation process, we eliminate logistical friction and ensure that perfectly good food reaches those who need it most, before it perishes.
              </p>
              <p>
                Our mission is simple: Zero waste, zero hunger. Together, we can create sustainable communities and protect our planet.
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 lg:mt-0"
          >
             <div className="rounded-2xl overflow-hidden shadow-xl bg-orange-100 aspect-video relative flex items-center justify-center">
               <span className="text-orange-800 font-medium text-lg">About Image Placeholder</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
