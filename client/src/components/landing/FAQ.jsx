import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Who can donate food?",
    answer: "Any registered business with a food license (restaurants, hotels, supermarkets, caterers) or individuals with large quantities of safe surplus food can donate."
  },
  {
    question: "How does pickup work?",
    answer: "Once an NGO claims your donation, our system assigns a nearby verified volunteer. You'll receive real-time updates and an ETA. At pickup, the volunteer will scan a unique QR code to confirm."
  },
  {
    question: "Is FoodLink free to use?",
    answer: "Yes, FoodLink is completely free for donors, NGOs, and volunteers. Our goal is to eliminate barriers to food redistribution."
  },
  {
    question: "How is food safety ensured?",
    answer: "Donors must agree to our strict food safety guidelines. NGOs inspect the food upon delivery, and our rating system ensures accountability. Perishable foods are prioritized for immediate transfer."
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left bg-slate-50 hover:bg-slate-100 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white px-6 overflow-hidden"
                  >
                    <p className="py-4 text-slate-600">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
