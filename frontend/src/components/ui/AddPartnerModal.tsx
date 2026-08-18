import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Check } from 'lucide-react';
import { createPartner } from '../../api/client';

const TIERS = ['premium', 'standard', 'basic'];

const REGIONS = [
  'North America', 'Latin America', 'EMEA', 'Nordics',
  'APAC', 'India', 'Japan', 'Australia & NZ', 'Global',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddPartnerModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    tier: 'standard',
    region: 'North America',
    contact_name: '',
    contact_email: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createPartner(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setForm({ name: '', tier: 'standard', region: 'North America',
                  contact_name: '', contact_email: '', notes: '' });
        onClose();
      }, 1100);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Failed to create partner');
    },
  });

  if (!open) return null;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    setError('');
    if (!form.name.trim()) { setError('Partner name is required'); return; }
    if (!form.region.trim()) { setError('Region is required'); return; }
    if (form.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contact_email)) {
      setError('Contact email is not valid'); return;
    }
    mutation.mutate({
      name: form.name.trim(),
      tier: form.tier,
      region: form.region.trim(),
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(14,18,36,0.9)',
    border: '1px solid rgba(30,37,72,0.9)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    color: '#E6E9F5',
    outline: 'none',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#4A5580',
    marginBottom: 5,
    display: 'block',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(5,7,18,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'linear-gradient(160deg, #10142B 0%, #0B0E1F 100%)',
          border: '1px solid rgba(60,70,120,0.6)',
          borderRadius: 16,
          boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(30,37,72,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E6E9F5' }}>
              Onboard a new partner
            </div>
            <div style={{ fontSize: 12, color: '#4A5580', marginTop: 2 }}>
              Creates the partner record and opens their onboarding workflow
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#4A5580', padding: 4, display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
                  background: 'rgba(34,197,94,0.14)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check size={24} color="#4ADE80" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#E6E9F5' }}>
                {form.name} added
              </div>
              <div style={{ fontSize: 12, color: '#4A5580', marginTop: 4 }}>
                Onboarding status set to <strong style={{ color: '#93A1D4' }}>pending</strong>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Partner name *</label>
                  <input
                    style={inputStyle}
                    value={form.name}
                    autoFocus
                    placeholder="Nordic Vision Media"
                    onChange={e => set('name', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tier</label>
                  <select
                    style={inputStyle}
                    value={form.tier}
                    onChange={e => set('tier', e.target.value)}
                  >
                    {TIERS.map(t => (
                      <option key={t} value={t} style={{ background: '#0E1224' }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Region *</label>
                  <select
                    style={inputStyle}
                    value={form.region}
                    onChange={e => set('region', e.target.value)}
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r} style={{ background: '#0E1224' }}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Contact name</label>
                  <input
                    style={inputStyle}
                    value={form.contact_name}
                    placeholder="Ingrid Halvorsen"
                    onChange={e => set('contact_name', e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact email</label>
                  <input
                    style={inputStyle}
                    value={form.contact_email}
                    placeholder="ops@nordicvision.se"
                    onChange={e => set('contact_email', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 68, resize: 'vertical', fontFamily: 'inherit' }}
                    value={form.notes}
                    placeholder="Delivery cadence, contract terms, escalation contacts…"
                    onChange={e => set('notes', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 14, padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontSize: 12, color: '#FCA5A5',
                  }}
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid rgba(30,37,72,0.8)',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'transparent', color: '#93A1D4',
                border: '1px solid rgba(30,37,72,0.9)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={mutation.isPending}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                opacity: mutation.isPending ? 0.6 : 1,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {mutation.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : 'Create Partner'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}