'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const faqs = [
  {
    question: "What file types can I upload?",
    answer: "We support <strong>PDF, DOCX, and TXT</strong> files. You can upload your syllabus, lecture notes, reading summaries, or assignment prompts. The AI reads them all to build context for your course. <br/><br/><span class='text-sm text-gray-500 dark:text-gray-400 italic'>(Lecture notes and handwritten text support is coming soon!)</span>"
  },
  {
    question: "Does the AI actually know my specific course?",
    answer: "Yes. When you create a \"Course Chat,\" the AI references the syllabus and files you uploaded for that class. It can answer questions based on your actual course materials, deadlines, and assignments. We're continuously improving the AI's ability to extract and remember course-specific details like professor names and topics."
  },
  {
    question: "How accurate is the deadline extraction?",
    answer: "Our AI extraction is highly accurate for standard syllabus formats. It identifies exam dates, assignment deadlines, reading schedules, and grading policies. If it misses something, you can view all extracted deadlines in your dashboard. Manual editing features are coming soon."
  },
  {
    question: "Is it really free?",
    answer: "Yes. We are currently in public beta, so <strong>all features are free</strong>. You can upload unlimited files and send unlimited messages. We don't even ask for a credit card to sign up."
  },
  {
    question: "Can I edit the deadlines if the AI misses something?",
    answer: "The AI tries to extract all deadlines automatically, but it's not perfect yet. Right now, you can view the extracted deadlines in your dashboard. We are currently building the feature to let you manually add, edit, or delete deadlines if the syllabus parser misses one."
  },
  {
    question: "Can I connect with other students?",
    answer: "Yes! Coming soon: Upload your syllabus and we'll automatically connect you with students in the same course at your school or similar courses at other institutions. Form study groups, share notes, and study smarter together. Get started by uploading your syllabus now!"
  }
];

export function FAQSection() {
  return (
    <section className="py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/50 dark:from-gray-900/50 dark:via-transparent dark:to-gray-900/50" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            FAQ
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            Questions?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
              We've got answers.
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about CourseConnect.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-200"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 dark:text-white py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed pb-4 pt-0 text-base">
                  <span dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
