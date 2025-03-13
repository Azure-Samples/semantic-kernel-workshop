import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { 
  AppBar, Toolbar, Typography, Container, Box, Drawer, 
  List, ListItem, ListItemIcon, ListItemText, CssBaseline,
  IconButton, useMediaQuery, alpha
} from '@mui/material'
import { 
  Menu as MenuIcon,
  Home as HomeIcon,
  Memory as MemoryIcon,
  Functions as FunctionsIcon,
  Translate as TranslateIcon,
  WbSunny as WeatherIcon,
  Summarize as SummarizeIcon,
  Shield as ShieldIcon
} from '@mui/icons-material'

// Import pages
import Home from './pages/Home'
import MemoryDemo from './pages/MemoryDemo'
import FunctionsDemo from './pages/FunctionsDemo'
import TranslateDemo from './pages/TranslateDemo'
import WeatherDemo from './pages/WeatherDemo'
import SummarizeDemo from './pages/SummarizeDemo'
import FiltersDemo from './pages/FiltersDemo'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0078d4',
      light: '#3395dd',
      dark: '#005499',
    },
    secondary: {
      main: '#2b2b2b',
      light: '#525252',
      dark: '#1e1e1e',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #eaeaea',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #eaeaea',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #eaeaea',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: '#0078d4',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #eaeaea',
        },
      },
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const drawerWidth = 240;

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Memory', icon: <MemoryIcon />, path: '/memory' },
    { text: 'Functions', icon: <FunctionsIcon />, path: '/functions' },
    { text: 'Translation', icon: <TranslateIcon />, path: '/translate' },
    { text: 'Weather', icon: <WeatherIcon />, path: '/weather' },
    { text: 'Summarization', icon: <SummarizeIcon />, path: '/summarize' },
    { text: 'Filters', icon: <ShieldIcon />, path: '/filters' },
  ];

  const drawer = (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              component={Link} 
              to={item.path}
              onClick={() => !isDesktop && toggleDrawer()}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AppBar 
            position="fixed" 
            sx={{ 
              zIndex: (theme) => theme.zIndex.drawer + 1,
              color: 'secondary.main',
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer}
                sx={{ 
                  mr: 2,
                  display: { md: 'none' },
                }}
              >
                <MenuIcon />
              </IconButton>
              <Typography 
                variant="h6" 
                noWrap 
                component="div"
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #0078d4 30%, #00a1f1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Semantic Kernel Playground
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Box
            component="nav"
            sx={{
              width: { md: drawerWidth },
              flexShrink: { md: 0 }
            }}
          >
            {isDesktop ? (
              <Drawer
                variant="permanent"
                sx={{
                  width: drawerWidth,
                  '& .MuiDrawer-paper': { 
                    width: drawerWidth,
                    boxSizing: 'border-box',
                  },
                }}
                open
              >
                {drawer}
              </Drawer>
            ) : (
              <Drawer
                variant="temporary"
                open={drawerOpen}
                onClose={toggleDrawer}
                sx={{
                  '& .MuiDrawer-paper': { 
                    width: drawerWidth,
                    boxSizing: 'border-box',
                  },
                }}
              >
                {drawer}
              </Drawer>
            )}
          </Box>
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { md: `calc(100% - ${drawerWidth}px)` },
              backgroundColor: '#fafafa',
              minHeight: '100vh',
            }}
          >
            <Toolbar />
            <Container 
              maxWidth="lg"
              sx={{
                py: 4,
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/memory" element={<MemoryDemo />} />
                <Route path="/functions" element={<FunctionsDemo />} />
                <Route path="/translate" element={<TranslateDemo />} />
                <Route path="/weather" element={<WeatherDemo />} />
                <Route path="/summarize" element={<SummarizeDemo />} />
                <Route path="/filters" element={<FiltersDemo />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App
