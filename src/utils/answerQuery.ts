

import * as use from "@tensorflow-models/universal-sentence-encoder";
import "@tensorflow/tfjs"; // required to load model

/**
 * Type of your profile object
 */
export interface ProfileType {
  summary: string;
  skills: string[];
  projects: { title: string; summary: string }[];
}

/**
 * Global model + embeddings cache (loaded once)
 */
let model: use.UniversalSentenceEncoder | null = null;
let docEmbeddings: number[][] = [];
let DOCUMENTS: { text: string; source: string }[] = [];

/**
 * Load TensorFlow model & embed portfolio on first run
 */
export async function initAIAssistant(PROFILE: ProfileType) {
  if (model) return; // already loaded

  model = await use.load();

  // Build semantic chunks from your profile
  DOCUMENTS = [
    { text: PROFILE.summary, source: "Summary" },
    ...PROFILE.skills.map((s) => ({ text: s, source: "Skills" })),
    ...PROFILE.projects.map((p) => ({
      text: p.summary,
      source: `Project • ${p.title}`,
    })),
  ];

  // Embed all portfolio chunks
  const texts = DOCUMENTS.map((d) => d.text);
  const embTensor = await model.embed(texts);
  docEmbeddings = await embTensor.array();
}

/**
 * Cosine similarity
 */
function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * MAIN FUNCTION
 */
export async function answerQuery(
  q: string,
  setAnswer: (t: string) => void,
  setSource: (t: string) => void,
  PROFILE: ProfileType
) {
  await initAIAssistant(PROFILE); // load model if needed

  const qn = q.trim().toLowerCase();
  if (!qn) {
    setAnswer("Ask me anything about my skills, experience, or projects.");
    setSource("");
    return;
  }

  /**
   * ─────────────────────────────────────────────
   *  PHASE 1 — HEURISTIC SHORTCUTS (FAST)
   * ─────────────────────────────────────────────
   */
  if (qn.includes("react") && !qn.includes("native")) {
    setAnswer(
      PROFILE.summary +
        " I work heavily with React, TypeScript, clean components, and UI architecture."
    );
    setSource("Summary • Skills");
    return;
  }

  if (
    qn.includes("react native") ||
    qn.includes("expo") ||
    qn.includes("mobile")
  ) {
    setAnswer(
      "I build advanced mobile apps with Expo + React Native, using Expo Router, secure storage for tokens, dependency injection, and smooth animations with Reanimated."
    );
    setSource("Projects • Skills");
    return;
  }

  if (qn.includes("authentication") || qn.includes("token")) {
    setAnswer(
      "I implement full authentication flows using secure refresh tokens, secure storage, .NET backend validation, and clean architecture patterns."
    );
    setSource("Experience • Projects");
    return;
  }

  if (qn.includes("nfc") || qn.includes("desfire")) {
    setAnswer(
      "I have hands-on experience building a custom NFC wallet system using MIFARE DESFire EV1, including authentication, secure keys, top-up logic, and balance checks."
    );
    setSource("Projects");
    return;
  }

  /**
   * ─────────────────────────────────────────────
   *  PHASE 2 — SEMANTIC SEARCH (TensorFlow.js)
   * ─────────────────────────────────────────────
   */
  if (!model) {
    setAnswer("AI model still loading, please try again.");
    setSource("");
    return;
  }

  // Embed the question
  const qEmbTensor = await model.embed([q]);
  const qEmb = (await qEmbTensor.array())[0];

  // Compute similarity with all profile docs
  const scores = docEmbeddings.map((emb, i) => ({
    i,
    score: cosine(qEmb, emb),
  }));

  // Sort best to worst
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const match = DOCUMENTS[best.i];

  // Threshold to avoid irrelevant answers
  if (best.score < 0.45) {
    setAnswer(
      "I couldn't find a perfect match. Try asking about my skills, mobile work, authentication, Expo, or NFC projects."
    );
    setSource("");
    return;
  }

  setAnswer(match.text);
  setSource(match.source);
}
