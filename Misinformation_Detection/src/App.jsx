import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import { Pie, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement
);

const testCases = [
  {
    text: "New study published in Nature shows regular exercise benefits cardiovascular health.",
    url: "https://nature.com/articles/s12345"
  },
  {
    text: "SHOCKING TRUTH: Doctors HATE this miracle cure! The government doesn't want you to know about this ancient remedy!!!",
    url: "https://suspicious-health-news.com/miracle-cure"
  },
  {
    text: "Research suggests moderate coffee consumption may have health benefits, according to recent studies.",
    url: "https://sciencedirect.com/article789"
  }
];

function App() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "analysisResults") {
          setResults(message.results);
          setLoading(false);
        } else if (message.action === "analysisError") {
          setError(message.error);
          setLoading(false);
        }
      });
    }
  }, []);

  const analyzeContent = async () => {
    if (!text) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        action: "analyzeContent",
        text,
        url
      });
    } else {
      // Fallback for development environment
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const analysisResults = {
          risk_level: text.includes('SHOCKING') ? 'high' : 'low',
          credibility_metrics: {
            credibility_score: text.includes('SHOCKING') ? 45 : 85,
            deductions: text.includes('SHOCKING') 
              ? ['Clickbait detected', 'Excessive capitalization']
              : [],
          },
          text_patterns: {
            suspicious_patterns: text.includes('SHOCKING')
              ? ['Clickbait phrase detected', 'Suspicious language patterns']
              : [],
          },
          sentiment_analysis: {
            pos: 0.3,
            neg: 0.2,
            emotional_extremity: 0.5,
          },
          source_credibility: {
            score: url ? (url.includes('nature.com') ? 95 : 70) : 50,
            reasons: url 
              ? [url.includes('nature.com') ? 'Trusted domain' : 'Unverified domain']
              : ['No source URL provided'],
          },
          complexity_analysis: {
            avg_sentence_length: 15.5,
            lexical_diversity: 0.75,
            unique_words: 45,
          },
        };
        setResults(analysisResults);
      } catch (err) {
        setError('An error occurred during analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadTestCase = (testCase) => {
    setText(testCase.text);
    setUrl(testCase.url);
  };

  const getCredibilityChartData = () => ({
    labels: ['Credible', 'Non-credible'],
    datasets: [{
      data: [
        results.credibility_metrics.credibility_score,
        100 - results.credibility_metrics.credibility_score
      ],
      backgroundColor: ['#4caf50', '#f44336'],
    }]
  });

  const getSentimentChartData = () => ({
    labels: ['Positive', 'Negative', 'Emotional Extremity'],
    datasets: [{
      label: 'Sentiment Analysis',
      data: [
        results.sentiment_analysis.pos * 100,
        results.sentiment_analysis.neg * 100,
        results.sentiment_analysis.emotional_extremity * 100
      ],
      backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
    }]
  });

  const getComplexityChartData = () => ({
    labels: ['Sentence Length', 'Lexical Diversity', 'Vocabulary'],
    datasets: [{
      label: 'Text Complexity',
      data: [
        results.complexity_analysis.avg_sentence_length,
        results.complexity_analysis.lexical_diversity * 100,
        (results.complexity_analysis.unique_words / 100) * 100,
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  });

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#2196f3';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Card sx={{ mb: 3, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: 'white' }}>
            Misinformation Detector
          </Typography>
          <Typography variant="body1" align="center" sx={{ color: 'white' }}>
            Analyze text for potential misinformation and credibility
          </Typography>
        </CardContent>
      </Card>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Test Cases
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {testCases.map((testCase, index) => (
            <Grid item key={index}>
              <Button
                variant="outlined"
                onClick={() => loadTestCase(testCase)}
                sx={{ textTransform: 'none' }}
              >
                Test Case {index + 1}
              </Button>
            </Grid>
          ))}
        </Grid>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Text Content"
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          variant="outlined"
          label="Source URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={analyzeContent}
          disabled={loading}
          fullWidth
          size="large"
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            py: 1.5
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Content'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {results && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              borderLeft: `6px solid ${getRiskLevelColor(results.risk_level)}`,
              background: `linear-gradient(to right, ${getRiskLevelColor(results.risk_level)}11 0%, #ffffff 100%)`
            }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Risk Level: {results.risk_level.toUpperCase()}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={100 - results.credibility_metrics.credibility_score}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getRiskLevelColor(results.risk_level),
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Credibility Score
                </Typography>
                <Box sx={{ height: 250 }}>
                  <Pie data={getCredibilityChartData()} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sentiment Analysis
                </Typography>
                <Box sx={{ height: 250 }}>
                  <Bar 
                    data={getSentimentChartData()}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Text Complexity
                </Typography>
                <Box sx={{ height: 250 }}>
                  <Radar 
                    data={getComplexityChartData()}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Analysis
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Source Credibility"
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            Score: {results.source_credibility.score}/100
                          </Typography>
                          <Box>
                            {results.source_credibility.reasons.map((reason, index) => (
                              <Chip
                                key={index}
                                label={reason}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                                color={reason.includes('Trusted') ? 'success' : 'default'}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />

                  {results.text_patterns.suspicious_patterns.length > 0 && (
                    <>
                      <ListItem>
                        <ListItemText
                          primary="Suspicious Patterns"
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {results.text_patterns.suspicious_patterns.map((pattern, index) => (
                                <Chip
                                  key={index}
                                  label={pattern}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                  color="warning"
                                />
                              ))}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </>
                  )}

                  {results.credibility_metrics.deductions.length > 0 && (
                    <ListItem>
                      <ListItemText
                        primary="Credibility Deductions"
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {results.credibility_metrics.deductions.map((deduction, index) => (
                              <Chip
                                key={index}
                                label={deduction}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                                color="error"
                              />
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default App;