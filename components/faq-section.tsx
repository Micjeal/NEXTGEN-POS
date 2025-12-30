"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronRight } from "lucide-react"

const faqs = [
  {
    question: "How long does it take to set up SMMS POS?",
    answer: "Most stores can be up and running within 1-2 hours. Our setup wizard guides you through the process, and our support team is available to help with any questions."
  },
  {
    question: "Can I import my existing product catalog?",
    answer: "Yes! SMMS POS supports CSV import for your existing products. We also offer migration assistance for stores switching from other POS systems."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption, regular security audits, and comply with industry standards. Your data is backed up daily and stored in secure, redundant servers."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We provide 24/7 customer support via chat, email, and phone. Professional and Enterprise plans include dedicated account managers and priority support."
  },
  {
    question: "Can I use SMMS POS on mobile devices?",
    answer: "Yes! SMMS POS is fully responsive and works on tablets, smartphones, and all modern browsers. You can manage your store from anywhere with an internet connection."
  }
]

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <button
              onClick={() => toggleFaq(index)}
              className="w-full text-left focus:outline-none"
            >
              <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
                <span>{faq.question}</span>
                {openFaq === index ? (
                  <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </h3>
            </button>
            {openFaq === index && (
              <p className="text-gray-600 transition-all duration-300">
                {faq.answer}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}