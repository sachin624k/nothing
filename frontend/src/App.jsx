import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Paper,
  IconButton,
  GlobalStyles // Added to fix the background color issue
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from "axios";
import { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyVideo = async () => {
    if (!file) return alert("Select a video first");
    const fd = new FormData();
    fd.append("video", file);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5001/video/verify", fd);
      setResult(res.data);
    } catch (e) {
      console.error(e);
      alert("Server Error");
    }
    setLoading(false);
  };

  const badge = (score) => {
    if (score >= 0.8) return { label: "FAKE", bg: "#d32f2f", text: "#fff" };
    if (score >= 0.5) return { label: "DOUBT", bg: "#ed6c02", text: "#fff" };
    return { label: "REAL", bg: "#2e7d32", text: "#fff" };
  };

  const verdict = () => {
    if (!result?.results?.length) return { text: "No claims detected", color: "#666" };
    const avg = result.results.reduce((a, c) => a + c.fake_score, 0) / result.results.length;
    if (avg >= 0.8) return { text: "🚨 High Risk — Likely Fake", color: "#d32f2f" };
    if (avg >= 0.5) return { text: "⚠️ Medium Risk — Suspicious", color: "#ed6c02" };
    return { text: "✅ Low Risk — Likely Real", color: "#2e7d32" };
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <>
      {/* This ensures the entire browser window (including the right side) is the same color */}
      <GlobalStyles styles={{ 
        body: { backgroundColor: "#f4f7f9", margin: 0, padding: 0 },
        html: { backgroundColor: "#f4f7f9" } 
      }} />
      
      <Box sx={{ 
        py: { xs: 2, md: 4 }, 
        bgcolor: "#f4f7f9", 
        minHeight: "100vh", 
        width: "100%", // Ensures it spans full width
        color: "#1a1a1a",
        fontFamily: "'Inter', sans-serif" 
      }}>
        <Container maxWidth="xl">
          
          {/* Header Section */}
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 4, 
            border: "1px solid #e0e0e0", 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: "#ffffff"
          }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a1a" }}>
              🎭 Fake Video <span style={{ color: "#1976d2" }}>Fact-Checker</span>
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              {result && (
                <IconButton onClick={reset} sx={{ color: "#666" }}>
                  <RefreshIcon />
                </IconButton>
              )}
              <Button
                variant="outlined"
                component="label"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {file ? "Change Video" : "Select Video"}
                <input hidden type="file" accept="video/*" onChange={(e) => {
                  if (e.target.files[0]) {
                    setFile(e.target.files[0]);
                    setPreview(URL.createObjectURL(e.target.files[0]));
                    setResult(null);
                  }
                }} />
              </Button>
              
              <Button
                variant="contained"
                onClick={verifyVideo}
                disabled={loading || !file}
                sx={{ borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 700, bgcolor: "#1976d2" }}
              >
                {loading ? "Analyzing..." : "Verify Video"}
              </Button>
            </Stack>
          </Paper>

          {/* Main Display Logic */}
          {!result ? (
            /* Upload State */
            <Box sx={{ 
              mt: 10, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center'
            }}>
              {!preview ? (
                <Paper variant="outlined" sx={{ 
                  p: 8, 
                  textAlign: 'center', 
                  borderRadius: 8, 
                  bgcolor: '#ffffff', 
                  maxWidth: 600, 
                  width: '100%',
                  border: '2px dashed #d1d9e0'
                }}>
                  <CloudUploadIcon sx={{ fontSize: 80, color: '#1976d2', mb: 2, opacity: 0.8 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Ready to Verify?</Typography>
                  <Typography variant="body1" color="textSecondary">
                    Upload a video file to begin deepfake detection and fact-checking.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
                  <video src={preview} style={{ width: "100%", borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '8px solid white' }} controls />
                  <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>{file?.name}</Typography>
                  <Typography variant="body2" color="textSecondary">Click "Verify Video" in the top right to start analysis.</Typography>
                </Box>
              )}
            </Box>
          ) : (
            /* Results State */
            <>
              <Paper elevation={0} sx={{ 
                mb: 4, 
                p: 2, 
                borderRadius: 3, 
                bgcolor: `${verdict().color}08`, 
                border: `1px solid ${verdict().color}40`,
                textAlign: 'center'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: verdict().color }}>
                  {verdict().text}
                </Typography>
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: { lg: "1fr 1fr 1.3fr", md: "1fr" }, gap: 3 }}>
                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e0e0e0" }}>
                  <CardContent>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: "#999" }}>Video Preview</Typography>
                    <video src={preview} controls style={{ width: "100%", borderRadius: 12, marginTop: '12px' }} />
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e0e0e0" }}>
                  <CardContent>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: "#999" }}>Detected Transcript</Typography>
                    <Box sx={{ mt: 2, p: 2, bgcolor: "#f9f9f9", borderRadius: 2, border: "1px solid #eee", minHeight: 250 }}>
                      <Typography sx={{ lineHeight: 1.8, color: "#444" }}>{result.text || "No speech found."}</Typography>
                    </Box>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e0e0e0" }}>
                  <CardContent>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: "#999" }}>Claim Verification</Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {result.results?.map((c, i) => {
                        const b = badge(c.fake_score);
                        return (
                          <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 3, border: "1px solid #eee" }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip label={b.label} size="small" sx={{ bgcolor: b.bg, color: b.text, fontWeight: 800 }} />
                              <Typography variant="caption" sx={{ alignSelf: 'center', color: '#888' }}>{c.category}</Typography>
                            </Stack>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>"{c.claim}"</Typography>
                            <LinearProgress variant="determinate" value={c.fake_score * 100} sx={{ height: 6, borderRadius: 3, mb: 1.5, bgcolor: "#eee", "& .MuiLinearProgress-bar": { bgcolor: b.bg } }} />
                            <Typography variant="body2" sx={{ color: "#666" }}>{c.reasoning}</Typography>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}