
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleHelp,
  Mail,
  ShieldCheck,
  Ticket,
} from "lucide-react";

export const metadata = {
  title: "Help & About | EventGo",
  description:
    "Learn about EventGo, find answers to common questions, and get support.",
};

const faqs = [
  {
    question: "What is EventGo?",
    answer:
      "EventGo is an event discovery and ticketing platform that helps you explore events, find experiences, and manage your tickets in one place.",
  },
  {
    question: "How can I book an event?",
    answer:
      "Explore available events, select an event and ticket type, add your ticket to the cart, and complete the checkout process.",
  },
  {
    question: "Where can I find my tickets?",
    answer:
      "After completing a booking, visit My Events to view your tickets and their QR codes.",
  },
  {
    question: "Do I need an account?",
    answer:
      "You can explore events without an account. You need to sign in when booking tickets.",
  },
  {
    question: "Are all listed events real?",
    answer:
      "No. Some events are fictional demo events used for development and testing. Demo events are clearly labelled.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#FCFAF7] text-[#08111D]">
      {/* Hero */}
      <section className="bg-[#08111D] px-5 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-[#FF6B53]/30 bg-[#FF6B53]/10 px-4 py-2 text-sm font-medium text-[#FF6B53]">
            <CircleHelp size={16} />
            EventGo Support
          </div>

          <h1 className="mt-6 max-w-[800px] text-4xl font-extrabold tracking-tight sm:text-6xl">
            We're here to help you
            <span className="text-[#FF6B53]"> explore more.</span>
          </h1>

          <p className="mt-6 max-w-[650px] text-lg leading-8 text-slate-300">
            Everything you need to know about EventGo,
            discovering events, booking tickets, and managing
            your experiences.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-[1100px] px-5 py-20">
        <div className="max-w-[750px]">
          <span className="text-sm font-bold uppercase tracking-widest text-[#FF6B53]">
            About EventGo
          </span>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Discover. Experience. Remember.
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600">
            EventGo makes discovering events simple.
            Explore concerts, festivals, sports, technology
            meetups, and other experiences based on your
            interests and location.
          </p>

          <p className="mt-4 text-base leading-8 text-slate-600">
            Our goal is to bring event discovery,
            ticket booking, and ticket management together
            in one modern and easy-to-use platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Discover Events",
              description:
                "Find events by city, category, and interests.",
            },
            {
              icon: Ticket,
              title: "Manage Tickets",
              description:
                "Keep your bookings and QR tickets in one place.",
            },
            {
              icon: ShieldCheck,
              title: "Secure Access",
              description:
                "Access your account and tickets through authentication.",
            },
          ].map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B53]/10 text-[#FF6B53]">
                  <Icon size={24} />
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-[900px]">
          <span className="text-sm font-bold uppercase tracking-widest text-[#FF6B53]">
            Help Center
          </span>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Frequently Asked Questions
          </h2>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-200 bg-[#FCFAF7] p-6"
              >
                <summary className="cursor-pointer list-none text-base font-bold">
                  <span>{faq.question}</span>
                </summary>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-[1100px] px-5 py-20">
        <div className="rounded-[32px] bg-[#08111D] p-8 text-white sm:p-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B53]/15 text-[#FF6B53]">
            <Mail size={28} />
          </div>

          <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl">
            Contact & Support
          </h2>

          <p className="mt-5 max-w-[650px] text-base leading-8 text-slate-300">
            Have a question, found an issue, or want to share
            feedback? We're happy to hear from you.
          </p>

          <p className="mt-5 text-sm leading-7 text-slate-400">
            Contact details will be available here once
            the support channel is configured.
          </p>

          <Link
            href="/explore"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF6B53] px-7 text-sm font-bold text-white transition hover:bg-[#F05B44]"
          >
            Explore Events
          </Link>
        </div>
      </section>
    </main>
  );
}
