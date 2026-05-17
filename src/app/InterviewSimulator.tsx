// InterviewSimulator.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { Box, Button, Card, CardContent, Typography, TextField, Stack, List, ListItem, ListItemText } from '@mui/material';

type Question = { id: string; text: string; keywords: string[] };

const DEFAULT_QUESTIONS: Question[] = [
  { id: 'q1', text: 'Tell me about yourself and your recent projects.', keywords: ['React', 'Expo', 'TypeScript', 'delivery', 'Zajel'] },
  { id: 'q2', text: 'How do you handle authentication and tokens in your apps?', keywords: ['refresh', 'token', 'secure', 'storage', '.NET'] },
  { id: 'q3', text: 'Describe a difficult bug you fixed and how you solved it.', keywords: ['debug', 'logs', 'breakdown', 'steps', 'fix'] },
  { id: 'q4', text: 'How would you handle a difficult customer call in English?', keywords: ['empathy', 'listen', 'steps', 'solution', 'calm'] },
];

function normalizeText(s = '') { return s.toLowerCase().replace(/[^\w\s]/g, ''); }

function scoreAnswer(transcript: string, keywords: string[]) {
  const text = normalizeText(transcript);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const unique = new Set(words).size;

  const hits = keywords.reduce((c, k) => c + (text.includes(k.toLowerCase()) ? 1 : 0), 0);
  const fillerCount = ['um', 'uh', 'like', 'you know', 'so', 'actually'].reduce((c, f) => c + (text.includes(f) ? 1 : 0), 0);

  let score = 50;
  score += Math.min(20, (hits / Math.max(1, keywords.length)) * 20);
  score += Math.min(15, (Math.min(wordCount, 200) / 200) * 15);
  score -= Math.min(15, fillerCount * 3);
  score += Math.min(10, (unique / Math.max(1, wordCount)) * 10);

  return { score: Math.max(0, Math.min(100, Math.round(score))), wordCount, hits, fillerCount };
}

export default function InterviewSimulator({ questions = DEFAULT_QUESTIONS }: { questions?: Question[] }): React.ReactElement {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<Array<any>>([]);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const win: any = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) { recogRef.current = null; return; }
    const r = new SpeechRecognition();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    r.onresult = (ev: SpeechRecognitionEvent) => {
      let finalTrans = '';
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const res = ev.results[i];
        if (res.isFinal) finalTrans += res[0].transcript;
      }
      if (finalTrans) setTranscript((prev) => (prev ? prev + ' ' + finalTrans : finalTrans));
    };
    r.onerror = () => { setListening(false); };
    recogRef.current = r;
    return () => { try { r.onresult = null; r.onerror = null; r.stop(); } catch {} };
  }, []);

  function startListening() {
    const r = recogRef.current;
    if (!r) { alert('SpeechRecognition not supported. Please type.'); return; }
    setTranscript(''); try { r.start(); setListening(true); } catch { setListening(false); }
  }
  function stopListening() { try { recogRef.current?.stop(); } catch {} setListening(false); }

  function submitAnswer() {
    const q = questions[currentIdx];
    const s = scoreAnswer(transcript, q.keywords);
    const entry = { question: q.text, transcript, score: s.score, meta: s, date: new Date().toISOString() };
    setHistory((h) => [...h, entry]); setTranscript(''); setListening(false); setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
  }

  function downloadReport() {
    const doc = new jsPDF(); doc.setFontSize(14); doc.text('Interview Simulator Report', 14, 18); doc.setFontSize(10); doc.text(`Candidate: Mohamed`, 14, 28); doc.text(`Date: ${new Date().toLocaleString()}`, 14, 34);
    let y = 44; history.forEach((h, idx) => { doc.setFontSize(11); doc.text(`${idx+1}. Q: ${h.question}`, 14, y); y += 6; doc.setFontSize(10); const txt = doc.splitTextToSize(`A: ${h.transcript}`, 180); doc.text(txt, 14, y); y += txt.length * 6; doc.text(`Score: ${h.score}  • Words: ${h.meta.wordCount}  • Keyword hits: ${h.meta.hits}`, 14, y); y += 10; if (y > 270) { doc.addPage(); y = 20; } }); doc.save('Interview_Report_Mohamed.pdf');
  }

  const jsx: any = (
    <Card>
      <CardContent>
        <Typography variant="h6">Interactive Interview Simulator</Typography>
        <Typography variant="body2" color="text.secondary" style={{ marginTop: 8 }}>Record answers, get transcription & scoring, and download a feedback report.</Typography>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Typography><strong>Question {currentIdx + 1}/{questions.length}:</strong></Typography>
            <Typography>{questions[currentIdx].text}</Typography>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="contained" color={listening ? 'error' : 'success'} onClick={() => listening ? stopListening() : startListening()}>{listening ? 'Stop Recording' : 'Start Recording'}</Button>
              <Button variant="contained" onClick={() => { stopListening(); submitAnswer(); }}>Submit Answer</Button>
              <Button variant="outlined" onClick={() => setTranscript('')}>Clear</Button>
            </div>

            <TextField multiline rows={6} fullWidth style={{ marginTop: 12 }} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Transcript will appear here (or type your answer)" />
          </div>

          <div style={{ marginTop: 16 }}>
            <Typography variant="subtitle2">Previous Answers</Typography>
            {history.length === 0 ? <Typography color="text.secondary">No answers yet — record and submit one.</Typography> : (
              <List>
                {history.map((h, i) => {
                  const secondaryContent = (
                    <div>
                      <Typography variant="body2" color="text.secondary">{h.question}</Typography>
                      <Typography variant="body2" style={{ marginTop: 8 }}>{h.transcript}</Typography>
                      <Typography variant="caption" color="text.secondary">Words: {h.meta.wordCount} • Keyword hits: {h.meta.hits} • Fillers: {h.meta.fillerCount}</Typography>
                    </div>
                  );
                  return (
                    <ListItem key={i} style={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, marginBottom: 8 }}>
                      <ListItemText primary={`${i+1}. Score: ${h.score}/100`} secondary={secondaryContent} />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button variant="contained" color="inherit" onClick={downloadReport} disabled={history.length === 0}>Download PDF Report</Button>
            <Button variant="outlined" onClick={() => { setCurrentIdx(0); setHistory([]); setTranscript(''); }}>Reset</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return jsx as React.ReactElement;
}
