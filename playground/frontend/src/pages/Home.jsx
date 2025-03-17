import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { 
  Memory as MemoryIcon,
  Functions as FunctionsIcon,
  Translate as TranslateIcon,
  WbSunny as WeatherIcon,
  Summarize as SummarizeIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Semantic Memory',
      description: 'Experience AI-powered memory management with semantic search capabilities.',
      icon: <MemoryIcon sx={{ fontSize: 40 }} />,
      path: '/memory',
      color: '#2563eb'
    },
    {
      title: 'Semantic Functions',
      description: 'Create and use AI functions with natural language prompts.',
      icon: <FunctionsIcon sx={{ fontSize: 40 }} />,
      path: '/functions',
      color: '#16a34a'
    },
    {
      title: 'Translation',
      description: 'Translate text between multiple languages using AI.',
      icon: <TranslateIcon sx={{ fontSize: 40 }} />,
      path: '/translate',
      color: '#9333ea'
    },
    {
      title: 'Weather Plugin',
      description: 'Get weather information using a custom Semantic Kernel plugin.',
      icon: <WeatherIcon sx={{ fontSize: 40 }} />,
      path: '/weather',
      color: '#ea580c'
    },
    {
      title: 'Text Summarization',
      description: 'Generate concise summaries of longer texts using AI.',
      icon: <SummarizeIcon sx={{ fontSize: 40 }} />,
      path: '/summarize',
      color: '#0891b2'
    },
    {
      title: 'SK Filters',
      description: 'Explore pre and post-processing filters for enhanced security and control.',
      icon: <ShieldIcon sx={{ fontSize: 40 }} />,
      path: '/filters',
      color: '#64748b'
    }
  ];

  return (
    <Box>
      <Box 
        sx={{ 
          textAlign: 'center',
          mb: 8,
          mt: 4
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #0078d4 30%, #00a1f1 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Welcome to Semantic Kernel
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ 
            maxWidth: '800px',
            mx: 'auto',
            mb: 4,
            lineHeight: 1.6
          }}
        >
          Explore the power of AI integration with this interactive demo showcasing
          Semantic Kernel's capabilities in memory management, natural language processing,
          and plugin architecture.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} md={6} lg={4} key={feature.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: feature.color,
                  boxShadow: `0 4px 20px ${feature.color}15`
                }
              }}
            >
              <CardContent sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 4
              }}>
                <Box 
                  sx={{ 
                    mb: 3,
                    color: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: `${feature.color}10`,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 3, flexGrow: 1 }}
                >
                  {feature.description}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate(feature.path)}
                  sx={{
                    borderColor: feature.color,
                    color: feature.color,
                    '&:hover': {
                      borderColor: feature.color,
                      backgroundColor: `${feature.color}10`,
                    }
                  }}
                >
                  Try Demo
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Home;
