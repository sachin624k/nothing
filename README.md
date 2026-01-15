```css
┌──────────────┐
│ Video Upload │
└──────┬───────┘
       ↓
┌──────────────────────┐
│ Whisper STT Engine   │
│ (Hindi / Eng / Hing) │
└──────┬────────────────┘
       ↓
┌──────────────────────┐
│  Claim Extraction    │
│  (LLM Filtering)     │
└──────┬────────────────┘
       ↓
┌─────────────────────────────┐
│ Verification + LLM Reasoning│
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│ Fake / Doubt / Real Verdict │
│ + Confidence Score (%)      │
└─────────────────────────────┘
```