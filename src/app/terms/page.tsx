"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { HideAISupport } from "@/components/hide-ai-support";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
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
              Terms of Service
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
              Welcome to CourseConnect AI. These Terms of Service govern your use of our platform and services. By accessing or using our website, you agree to follow these rules designed to keep our academic community productive and fair.
            </p>

            <Separator className="my-10 bg-gray-100 dark:bg-gray-800" />

            {/* Section 1 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">1.</span> Definitions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                “Service” means the CourseConnect AI platform, website, mobile experiences, and related features. “User,” “you,” and “your” mean the individual accessing or using the Service. “User Content” means notes, flashcards, syllabi, messages, and any materials you upload or create within the Service. “Account” means your registered profile used to access the Service.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">2.</span> Eligibility & Accounts
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                You must be at least 18 years old to use the Service. If you create an Account, you agree to provide accurate information and to keep it updated. You are responsible for safeguarding your login credentials and for all activity under your Account. Notify us immediately of any suspected unauthorized use.
              </p>
            </div>

            {/* Section 3 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">3.</span> Changes to Service & Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update features or these Terms to improve the learning experience. When material changes occur, we will provide notice (e.g., via in‑app banner or email) and indicate the “Last updated” date. Continued use after changes become effective constitutes acceptance of the updated Terms.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">4.</span> Termination & Suspension
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                We may suspend or terminate access to the Service at any time for violations of these Terms, legal requirements, or to protect users and the platform. We will attempt to provide notice where reasonable.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 marker:text-blue-600 dark:marker:text-blue-500">
                <li>You may terminate your Account at any time.</li>
                <li>Upon termination, your access will cease; certain provisions (e.g., ownership, disclaimers, and limitations of liability) will survive.</li>
                <li>If permitted by law and our policies, you may request export of your User Content before termination.</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">5.</span> License to Process User Content
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                You retain all rights in your User Content. By uploading User Content, you grant us a non‑exclusive, worldwide, revocable, limited license to host, process, analyze, and display your content solely to provide and improve the Service’s features for you (e.g., study aids, syllabus analysis). We do not sell your User Content.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">6.</span> Third‑Party Services
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                The Service may link to or integrate third‑party tools (e.g., learning management systems). We are not responsible for third‑party services or their privacy practices. Your use of third‑party services is governed by their terms.
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">7.</span> DMCA & Content Complaints
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                If you believe content on the Service infringes your rights, contact us at courseconnect.noreply@gmail.com with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 marker:text-blue-600 dark:marker:text-blue-500">
                <li>Your contact information;</li>
                <li>Identification of the content;</li>
                <li>A statement of your rights; and</li>
                <li>A good‑faith declaration of accuracy.</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                We may remove content and, where appropriate, notify the uploader.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">8.</span> Accessibility
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We aim to make CourseConnect AI accessible to all learners. If you encounter barriers, please contact us so we can address them.
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">9.</span> Warranty Disclaimer & AI Hallucinations
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Inaccuracy (Hallucinations):</strong> You acknowledge that the Service uses artificial intelligence which may produce inaccurate "hallucinations" regarding deadlines, grading scales, or course policies. It is your absolute duty to verify all AI-generated output against official sources provided by your institution.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-bold uppercase italic opacity-80">
                  THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR‑FREE.
                </p>
              </div>
            </div>

            {/* Section 10 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">10.</span> Limitation of Liability & Academic Integrity
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Not a Substitute:</strong> The Service is an organizational aid and not a substitute for your own study, attending lectures, or reading official course materials. <strong>AI tools are intended to supplement your learning—they do not replace essential academic interactions, such as communicating directly with your professors and instructors.</strong>
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Academic Penalties:</strong> We are not liable for any academic penalties (e.g., failed grades, suspension) resulting from your use of the Service. It is your responsibility to ensure your use of AI complies with your institution's specific policies.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-bold uppercase italic opacity-80">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, COURSECONNECT AI AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE AMOUNTS YOU PAID TO USE THE SERVICE IN THE 12 MONTHS BEFORE THE CLAIM.
                </p>
              </div>
            </div>

            {/* Section 11 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">11.</span> Governing Law & Dispute Resolution
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                These Terms are governed by the laws of the State of Georgia, without regard to conflict‑of‑law principles. You agree to submit to the exclusive jurisdiction of the state and federal courts located in Fulton County, Georgia, for disputes that are not subject to arbitration. If we mutually agree to arbitration, disputes will be resolved by a single arbitrator under the Commercial Arbitration Rules, and claims may be brought only in an individual capacity.
              </p>
            </div>

            {/* Section 12 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-500">12.</span> Notices & Contact
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Official notices may be delivered via email to the address associated with your Account or posted within the Service. For support or questions about these Terms, contact <span className="text-blue-600 dark:text-blue-500 font-medium underline underline-offset-4 cursor-pointer">courseconnect.noreply@gmail.com</span>.
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
