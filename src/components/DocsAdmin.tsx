"use client";

import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

export default function DocsAdmin() {
  const [docs, setDocs] = useState<any[]>([]);
  const [adminToken, setAdminToken] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [text, setText] = useState('');
  const [source, setSource] = useState('');

  async function load() {
    const token = adminToken || (typeof window !== 'undefined' ? window.localStorage.getItem('ADMIN_TOKEN') || '' : '');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/docs', { headers });
    if (res.status === 401) {
      setDocs([]);
      return;
    }
    const data = await res.json();
    setDocs(data || []);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('ADMIN_TOKEN') : '';
    if (token) setAdminToken(token as string);
  }, []);

  function handleAdd() {
    setEditing(null); setText(''); setSource(''); setOpen(true);
  }

  async function handleSave() {
    const token = adminToken || (typeof window !== 'undefined' ? window.localStorage.getItem('ADMIN_TOKEN') || '' : '');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (editing) {
      await fetch('/api/docs', { method: 'PUT', headers, body: JSON.stringify({ id: editing.id, text, source }) });
    } else {
      await fetch('/api/docs', { method: 'POST', headers, body: JSON.stringify({ text, source }) });
    }
    setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    const token = adminToken || (typeof window !== 'undefined' ? window.localStorage.getItem('ADMIN_TOKEN') || '' : '');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`/api/docs?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers });
    load();
  }

  function startEdit(d: any) { setEditing(d); setText(d.text); setSource(d.source || 'Custom'); setOpen(true); }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Knowledge Admin</Typography>
      <Typography variant="caption" color="text.secondary">Admin token is required to persist snippets to the server. Enter it once and click Save Token.</Typography>
      <TextField label="Admin token" fullWidth value={adminToken} onChange={(e) => setAdminToken(e.target.value)} sx={{ mt: 1 }} size="small" />
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button size="small" onClick={() => { if (typeof window !== 'undefined') window.localStorage.setItem('ADMIN_TOKEN', adminToken); load(); }}>Save Token</Button>
        <Button size="small" onClick={() => { if (typeof window !== 'undefined') { window.localStorage.removeItem('ADMIN_TOKEN'); setAdminToken(''); } load(); }}>Clear Token</Button>
      </Box>
      <Button variant="outlined" size="small" sx={{ mt: 1, mb: 1 }} onClick={handleAdd}>Add snippet</Button>
      <List>
        {docs.map(d => (
          <ListItem key={d.id} secondaryAction={<>
            <IconButton edge="end" onClick={() => startEdit(d)}><EditIcon /></IconButton>
            <IconButton edge="end" onClick={() => handleDelete(d.id)}><DeleteIcon /></IconButton>
          </>}>
            <ListItemText primary={d.source || 'User'} secondary={d.text} />
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{editing ? 'Edit snippet' : 'Add snippet'}</DialogTitle>
        <DialogContent>
          <TextField label="Source" fullWidth value={source} onChange={(e) => setSource(e.target.value)} sx={{ mt: 1 }} />
          <TextField label="Text" fullWidth multiline rows={4} value={text} onChange={(e) => setText(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
