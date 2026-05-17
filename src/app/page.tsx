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

import React, { Suspense, useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Container, Avatar, Typography, Button, Grid, Card, CardContent, Chip, Stack, IconButton, Link as MuiLink } from "@mui/material";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import InterviewSimulator from "./InterviewSimulator"; // component in same folder
import DocsAdmin from "../components/DocsAdmin";
import { FileText, Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { answerQuery, initAIAssistant, addCustomDoc } from "../utils/answerQuery";
import { PROFILE } from "../data/PROFILE";

// PROFILE is imported from src/data/PROFILE and acts as the single source of truth


const Hero3D = dynamic(() => import("../components/Hero3D"), { ssr: false, loading: () => <div style={{ height: 240 }} /> });

// ---------- Lightweight retrieval-based "AI" assistant ----------
// This assistant searches the PROFILE object and returns short answers with highlights.
function AIAssistant() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [improveText, setImproveText] = useState("");

  useEffect(() => {
    let mounted = true;
    setModelLoading(true);
    initAIAssistant(PROFILE as any)
      .catch(() => {})
      .finally(() => {
        if (mounted) setModelLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/6">
      <h3 className="text-lg font-semibold">AI Assistant</h3>
      <p className="text-sm text-slate-300 mt-1">Ask about my experience, projects, or skills.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something like: Tell me about your React experience"
          className="flex-1 p-2 rounded-md bg-white/6"
        />
        <button
          onClick={() => answerQuery(query, setAnswer, setSource, PROFILE as any)}
          className="px-4 py-2 hover:cursor-pointer rounded-md bg-indigo-600"
          disabled={!query.trim()}
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
        <div className="mt-3 text-xs text-slate-400">{modelLoading ? 'Advanced assistant loading…' : 'Advanced assistant ready'}</div>

        <div className="mt-3">
          <textarea
            placeholder="Improve or add a knowledge snippet (optional)..."
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
            className="w-full p-2 mt-2 rounded-md bg-white/6 text-sm"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                if (!improveText.trim()) return;
                await addCustomDoc({ text: improveText.trim(), source: 'User' });
                setAnswer('Thanks — I added that to my knowledge base and will use it in future answers.');
                setSource('User-added');
                setImproveText('');
              }}
              className="px-3 py-1 rounded-md bg-green-600 text-sm"
            >
              Add to knowledge
            </button>
            <button
              onClick={() => answerQuery(query, setAnswer, setSource, PROFILE as any)}
              className="px-3 py-1 rounded-md bg-sky-600 text-sm"
            >
              Refine answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- 3D Hero ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// (Hero3D loaded dynamically above to keep heavy three.js code out of the main bundle)

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
            src="/profile.jpg"
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

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              {PROFILE.contacts?.cvUrl ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileText size={16} />}
                  component="a"
                  href={PROFILE.contacts.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download resume
                </Button>
              ) : (
                <Button variant="contained" color="primary" startIcon={<FileText size={16} />} onClick={() => exportResumePDF()}>
                  Download resume
                </Button>
              )}
              <Button variant="outlined" color="inherit" startIcon={<Mail size={16} />} href={`mailto:${PROFILE.contacts.email}?subject=Job%20Opportunity`}>
                Contact
              </Button>
            </Stack>
          </div>
        </header>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl p-6 bg-white/5 border border-white/6">
              <div className="flex md:grid-cols-2 gap-6 items-center">
                <div>
                  <h2 className="text-2xl font-semibold">About</h2>
                  <p className="text-slate-300 mt-2">{PROFILE.summary}</p>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                    {skills.slice(0, 12).map((s) => (
                      <Chip key={s} label={s} variant="outlined" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Stack>
                </div>
         
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-white/5 border border-white/6">
              <h3 className="text-xl font-semibold">Featured Projects</h3>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {projects.map((p) => (
                  <Grid item xs={12} md={6} key={p.title}>
                    <Card variant="outlined" sx={{ bgcolor: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600}>{p.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{p.summary}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
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

            <aside className="rounded-2xl  flex flex-col p-6 gap-5 bg-white/5 border border-white/6">
                 <div>
                  <h3 className="mb-2 text-lg font-semibold">ZOOM ME AND ROTAUT</h3>
              <Hero3D />
                </div>
            
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
              
              <div className="mt-6">
                <h4 className="font-medium">Knowledge Admin</h4>
                <DocsAdmin />
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
