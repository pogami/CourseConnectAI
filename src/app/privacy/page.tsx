"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { HideAISupport } from "@/components/hide-ai-support";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  const lastUpdated = "January 5, 2026";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Last updated: {lastUpdated}
            </p>
          </motion.div>

          {/* Intro */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose prose-lg dark:prose-invert max-w-none"
          >
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-10">
              This Policy explains what we collect, how we use it, and your choices. It applies to the CourseConnect AI website and platform (the “Service”). We are committed to protecting your academic data and being transparent about our practices. <strong>Please note that our AI tools are designed to supplement your learning—not to replace essential academic engagement such as reading course materials or communicating with your professors.</strong>
            </p>

            <Separator className="my-10 bg-gray-100 dark:bg-gray-800" />

            {/* Section 1 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">1.</span> What We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 marker:text-blue-600 dark:marker:text-blue-500">
                <li><strong>Account:</strong> email, name (if provided), university affiliation, preferences/goals.</li>
                <li><strong>Study Materials:</strong> uploaded syllabi, notes, flashcards, questions to AI, schedules/tasks.</li>
                <li><strong>Device/Usage:</strong> browser/OS, IP, pages used, timestamps, cookies.</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                We do not collect precise GPS location. We do not share data with advertisers. We do not sell your study materials.
              </p>
                </div>

            {/* Section 2 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">2.</span> How We Use Data
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 marker:text-blue-600 dark:marker:text-blue-500">
                <li><strong>Deliver the Service:</strong> personalized study plans and AI tutoring.</li>
                <li><strong>Improve features:</strong> usage insights to make tools better.</li>
                <li><strong>Security:</strong> prevent abuse and protect platform integrity.</li>
                <li><strong>Consent-based features:</strong> optional settings or emails when required.</li>
              </ul>
                </div>

            {/* Section 3 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">3.</span> AI Processing & Automated Logic
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Zero Training:</strong> We do not use your User Content (syllabi, notes, or chat history) to train our own models or those of our third-party AI providers. Your academic journey is your own.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Automated Decision-Making (ADMT):</strong> We use AI to analyze course materials. The logic involves parsing text to identify academic requirements, deadlines, and learning goals to generate personalized assistance.
                </p>
              </div>
                </div>

            {/* Section 4 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">4.</span> Cookies & Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We use cookies to operate the Service, remember settings, and measure usage. You can control cookies in your browser; disabling some may affect functionality.
              </p>
                </div>

            {/* Section 5 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">5.</span> Sharing & Third-Party AI
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We don’t sell personal data. We share only with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 marker:text-blue-600 dark:marker:text-blue-500">
                <li><strong>AI Providers:</strong> For real-time inference via secure APIs with Zero Data Retention (ZDR) agreements.</li>
                <li><strong>Service Providers:</strong> Cloud infrastructure (Vercel/AWS) for secure hosting and database management.</li>
                <li><strong>Law Enforcement:</strong> Only when required by a valid subpoena or court order.</li>
                <li><strong>Successors:</strong> If we reorganize, subject to the protections of this Policy.</li>
              </ul>
              </div>
              
            {/* Section 6 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">6.</span> International Transfers
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                If data moves outside your country, we use appropriate safeguards.
              </p>
        </div>

            {/* Section 7 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">7.</span> Students & Age
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                The Service is intended for university and college students who are at least 18 years old. If we learn a person under the minimum age has provided data, we’ll delete it immediately.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">8.</span> Your Rights
            </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                You can request: access, correction, deletion, portability, and where applicable, objection/restriction. To exercise rights, see Section 10.
            </p>
          </div>
          
            {/* Section 9 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">9.</span> Security
            </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                TLS 1.3 in transit, industry‑standard encryption at rest, strict access controls, and regular reviews. No system is 100% secure; use strong passwords.
            </p>
          </div>
          
            {/* Section 10 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">10.</span> Requests & Contact
            </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Email privacy requests to <span className="text-blue-600 dark:text-blue-500 font-medium underline underline-offset-4 cursor-pointer">courseconnect.noreply@gmail.com</span> with your account email and request type (access, correction, deletion, portability, objection). We may verify your identity and respond within legally required timeframes.
            </p>
          </div>
          
            {/* Section 11 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">11.</span> Do Not Sell or Share & GPC
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We do not sell personal data. Our Service is configured to recognize and honor <strong>Global Privacy Control (GPC)</strong> signals from your browser in compliance with modern privacy regulations.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  If “Do Not Sell or Share” rules apply to you, email us at <span className="text-blue-600 dark:text-blue-500 font-medium underline underline-offset-4 cursor-pointer">courseconnect.noreply@gmail.com</span> and we will honor your request.
                </p>
          </div>
        </div>

            {/* Section 12 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">12.</span> Updates
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update this Policy and will post the “Last updated” date. Material changes may be announced in‑app or by email. Continued use after the effective date means you accept the changes.
              </p>
              </div>
              
            {/* Section 13 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">13.</span> Jurisdiction
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                This Policy is governed by Georgia law. You may have additional rights under other U.S. state or federal laws; we will honor them where applicable.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <HideAISupport />
    </div>
  );
}
