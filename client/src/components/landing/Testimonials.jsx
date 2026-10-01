import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    content: "FoodLink has completely transformed how we handle excess food at our restaurant. Instead of throwing it away, we now feed dozens of people every week. It's effortless.",
    author: "Sarah Jenkins",
    role: "Restaurant Owner",
    image: "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=10b981&color=fff",
  },
  {
    id: 2,
    content: "As a shelter manager, unpredictable food supplies were our biggest challenge. FoodLink gives us real-time access to surplus food in our area. It's a lifesaver.",
    author: "David Chen",
    role: "NGO Manager",
    image: "https://ui-avatars.com/api/?name=David+Chen&background=f97316&color=fff",
  },
  {
    id: 3,
    content: "Volunteering with FoodLink is incredibly rewarding. The app routes me perfectly, and seeing the smiles when I deliver the food makes my day.",
    author: "Maria Garcia",
    role: "Volunteer",
    image: "https://ui-avatars.com/api/?name=Maria+Garcia&background=0f172a&color=fff",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Hear from our community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative"
            >
              <div className="flex text-orange-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
              <div className="flex items-center mt-auto">
                <img
                  className="w-12 h-12 rounded-full mr-4"
                  src={testimonial.image}
                  alt={testimonial.author}
                  loading="lazy"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{testimonial.author}</h4>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
