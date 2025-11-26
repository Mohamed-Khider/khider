"use client";

/**
 * Mohamed — AI Portfolio (Single-file React app)
 * Drop into a Vite/Next.js (client) project as src/App.tsx or in a Next.js app route page.
 *
 * Features included in this single-file demo:
 * - Reactive 3D hero using @react-three/fiber + @react-three/drei
 * - Lightweight on-device AI assistant (retrieval-based, uses local profile data)
 * - Interview Simulator (record/transcribe/score) included
 * - Polished layout with Tailwind + Framer Motion
 * - Exportable PDF report for interview answers
 *
 * Dependencies:
 *  npm install react react-dom three @react-three/fiber @react-three/drei framer-motion jspdf lucide-react
 *  For Next.js add: next, react, react-dom (and mark the page as a Client Component)
 *
 * Notes:
 * - This is a single-file example to show how the system fits together. For production, split components into files.
 * - The AI assistant here is offline and deterministic: it searches the profile text for relevant answers and returns highlighted snippets. You can later connect it to an LLM or vector DB for richer answers.
 */

import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Float, Html, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import InterviewSimulator from "./InterviewSimulator"; // assume you placed earlier component in same folder
import { FileText, Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import profile from "../../public/profile.jpg"; // assume you have a profile picture in assets folder
import { answerQuery } from "../utils/answerQuery";
import  profilejson  from "../data/profile.json";

// ---------- Profile data (single source of truth) ----------
export const PROFILE = {
  name: "Mohamed Khider",
  title: "Frontend Developer",
  location: "Dubai, UAE",

  summary:
    "Frontend Developer with 3+ years of hands-on experience building modern, scalable, and high-performing web and mobile applications. Highly skilled in React.js, Next.js, React Native (Expo), and Angular, with a strong focus on clean architecture, elegant UI/UX, and responsive design. Experienced in integrating complex APIs using Node.js and .NET Core, optimizing performance, and delivering pixel-perfect interfaces. Proven track record improving application speed, stability, and user engagement across multiple production projects. Currently seeking a front-end role where I can contribute to modern product teams, elevate user experiences, and deliver fast, maintainable, and impactful digital solutions.",

  skills: [
    "React.js",
    "Next.js",
    "React Native (Expo)",
    "Angular",
    "TypeScript",
    "JavaScript (ES6+)",
    "Tailwind CSS",
    "Chakra UI",
    "Redux Toolkit",
    "React Query",
    "Node.js",
    ".NET Core APIs",
    "REST API Integration",
    "Responsive Design",
    "Clean Architecture",
    "UI/UX Best Practices",
    "Performance Optimization",
    "Docker",
    "CI/CD",
    "Git & GitHub"
  ],

  projects: [
    {
      title: "Zajel – Full E-Commerce Platform",
      summary:
        "A complete multi-platform system (React web + Flutter mobile + .NET backend). Led the frontend architecture, documentation, and UI/UX flow for store, delivery, and admin panels."
    },
    {
      title: "Delivery App (Expo React Native)",
      summary:
        "Production-ready app with secure authentication, real-time map tracking, custom components, and smooth UX. Includes backend integration with .NET and optimized mobile performance."
    },
    {
      title: "Estasher Dashboard (Next.js)",
      summary:
        "Built and deployed a fully responsive dashboard integrated with .NET APIs, using SSR/ISR for performance and pixel-perfect UI based on Figma designs."
    },
    {
      title: "Patrol – Cross-Platform App (Expo)",
      summary:
        "Developed iOS/Android/Web app using Expo, integrating .NET APIs and implementing animations, gestures, and modular component architecture."
    }
  ],

  contacts: {
    email: "M38.hassan@gmail.com",
    phone: "+971-50-129-0135",
    github: "https://github.com/mohamed-khider",
    linkedin: "https://www.linkedin.com/in/mohamed-hassan-214a87333",
    portfolio: "https://mohamed-khider.github.io"
  }
};


// ---------- Lightweight retrieval-based "AI" assistant ----------
// This assistant searches the PROFILE object and returns short answers with highlights.
function AIAssistant() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState("");

  return (
    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/6">
      <h3 className="text-lg font-semibold">AI Assistant</h3>
      <p className="text-sm text-slate-300 mt-1">
        Ask about my experience, projects, or skills. (Offline demo assistant)
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something like Tell me about your React experience\"
          className="flex-1 p-2 rounded-md bg-white/6"
        />
        <button
          onClick={() => answerQuery(query, setAnswer, setSource, profilejson)}
          className="px-4 py-2 hover:cursor-pointer rounded-md bg-indigo-600"
        >
          Ask
        </button>
      </div>
      <div className="mt-3 p-3 rounded-md bg-white/6 text-sm">
        <div className="font-medium">Answer</div>
        <div className="mt-1 text-slate-300">{answer}</div>
        {source && (
          <div className="mt-2 text-xs text-slate-400">Source: {source}</div>
        )}
      </div>
    </div>
  );
}

// ---------- 3D Hero ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FloatingCard({ children }: any) {
  return (
    <Float floatIntensity={1} rotationIntensity={0.4}>
      <mesh>
        <Html center>{children}</Html>
      </mesh>
    </Float>
  );
}

function AnimatedSphere() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <meshStandardMaterial
        metalness={0.8}
        roughness={0.2}
        color={`#60a5fa`}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function Hero3D() {
  return (
    <div className="w-full h-96 rounded-2xl overflow-visible bg-gradient-to-br from-slate-900 to-slate-800">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <AnimatedSphere />
          <Float rotationIntensity={0.6} speed={2} floatIntensity={1}>
            <mesh position={[2, 0.6, 0]} scale={[0.8, 0.8, 0.8]}>
              <boxGeometry args={[1.4, 0.9, 0.2]} />
              <meshStandardMaterial
                color={`#34d399`}
                metalness={0.4}
                roughness={0.3}
                opacity={0.3}
              />
            </mesh>
          </Float>
        </Suspense>
        <OrbitControls autoRotate autoRotateSpeed={0.3} enableZoom={false} />
      </Canvas>
    </div>
  );
}

// ---------- Utility: PDF export for resume snapshot ----------
function exportResumePDF() {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(PROFILE.name + " — Portfolio Snapshot", 14, 20);
  doc.setFontSize(11);
  doc.text(PROFILE.title, 14, 30);
  doc.text("Location: " + PROFILE.location, 14, 36);
  doc.setFontSize(12);
  doc.text("Summary:", 14, 46);
  const lines = doc.splitTextToSize(PROFILE.summary, 180);
  doc.text(lines, 14, 52);
  doc.save("Portfolio_Snapshot_Mohamed.pdf");
}

// ---------- Main App ----------
export default function App() {
  const skills = PROFILE.skills;
  const projects = PROFILE.projects;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <img
            src={profile.src}
            alt="avatar"
            className="w-32 h-32 rounded-2xl object-cover border-2 border-white/10 shadow-lg"
          />
          <div className="flex-1">
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45 }}
              className="text-3xl md:text-4xl font-semibold"
            >
              {PROFILE.name}
            </motion.h1>
            <p className="mt-1 text-lg text-slate-300">{PROFILE.title}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{PROFILE.location}</span>
              </div>
              <a
                href={`mailto:${PROFILE.contacts.email}`}
                className="flex items-center gap-2 hover:underline"
              >
                <Mail size={16} />
                <span>{PROFILE.contacts.email}</span>
              </a>
              <a
                href={PROFILE.contacts.github}
                className="flex items-center gap-2 hover:underline"
              >
                <Github size={16} />
                <span>GitHub</span>
              </a>
              <a
                href={PROFILE.contacts.linkedin}
                className="flex items-center gap-2 hover:underline"
              >
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </a>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => exportResumePDF()}
                className="px-4 py-2 rounded-md bg-indigo-600"
              >
                Download resume
              </button>

              <a
                href={`mailto:${PROFILE.contacts.email}?subject=Job%20Opportunity`}
                className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 rounded-lg"
              >
                <Mail size={16} />
                <span>Contact</span>
              </a>
            </div>
          </div>
        </header>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl p-6 bg-white/5 border border-white/6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h2 className="text-2xl font-semibold">About</h2>
                  <p className="text-slate-300 mt-2">{PROFILE.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {skills.slice(0, 6).map((s) => (
                      <div
                        key={s}
                        className="text-sm p-2 rounded-md bg-white/6"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Hero3D />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-white/5 border border-white/6">
              <h3 className="text-xl font-semibold">Featured Projects</h3>
              <div className="mt-4 space-y-4">
                {projects.map((p) => (
                  <div key={p.title} className="p-4 rounded-md bg-white/6">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-slate-300 text-sm mt-1">
                      {p.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-white/5 border border-white/6">
              <AIAssistant />
            </div>

            <div className="rounded-2xl p-6 bg-white/5 border border-white/6">
              <h3 className="text-lg font-semibold">Interview Practice</h3>
              <div className="mt-3">
                <InterviewSimulator />
              </div>
            </div>
          </section>

          <aside className="rounded-2xl p-6 bg-white/5 border border-white/6">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="mt-3 text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={14} /> {PROFILE.contacts.phone}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Mail size={14} />{" "}
                <a
                  href={`mailto:${PROFILE.contacts.email}`}
                  className="underline"
                >
                  {PROFILE.contacts.email}
                </a>
              </div>
              <div className="mt-4">
                <h4 className="font-medium">Languages</h4>
                <div className="text-slate-300 text-sm mt-1">
                  Arabic (Native) • English (Intermediate — improving to B2/C1)
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium">Availability</h4>
                <div className="text-slate-300 text-sm">
                  Full-time in Dubai — Ready to join immediately. Transferable
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 text-center text-slate-400 text-sm">
          © {new Date().getFullYear()} {PROFILE.name} — Frontend & Mobile
          Developer
        </footer>
      </div>
    </div>
  );
}
