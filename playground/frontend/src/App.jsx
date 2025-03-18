import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { 
  AppBar, Toolbar, Typography, Container, Box, Drawer, 
  List, ListItem, ListItemIcon, ListItemText, CssBaseline,
  IconButton, useMediaQuery, Divider
} from '@mui/material'
import { 
  Menu as MenuIcon,
  Home as HomeIcon,
  Memory as MemoryIcon,
  Functions as FunctionsIcon,
  Translate as TranslateIcon,
  WbSunny as WeatherIcon,
  Summarize as SummarizeIcon,
  Shield as ShieldIcon,
  SmartToy as AgentIcon
} from '@mui/icons-material'

// Import pages
import Home from './pages/Home'
import MemoryDemo from './pages/MemoryDemo'
import FunctionsDemo from './pages/FunctionsDemo'
import TranslateDemo from './pages/TranslateDemo'
import WeatherDemo from './pages/WeatherDemo'
import SummarizeDemo from './pages/SummarizeDemo'
import FiltersDemo from './pages/FiltersDemo'
import AgentDemo from './pages/AgentDemo'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0070F3',
      light: '#3291FF',
      dark: '#0050AF',
    },
    secondary: {
      main: '#4E4B66',
      light: '#78758F',
      dark: '#333154',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
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
          border: '1px solid #E5E7EB',
          borderRadius: 10,
        },
      },
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const drawerWidth = 260;
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavClick = (path) => {
    setCurrentPath(path);
    if (!isDesktop) {
      toggleDrawer();
    }
  };

  const menuGroups = [
    {
      title: 'Main Features',
      items: [
        { text: 'Home', icon: <HomeIcon />, path: '/' },
        { text: 'Semantic Memory', icon: <MemoryIcon />, path: '/memory' },
        { text: 'Functions & Plugins', icon: <FunctionsIcon />, path: '/functions' },
        { text: 'Agent Demo', icon: <AgentIcon />, path: '/agent' },
        { text: 'Filters & Security', icon: <ShieldIcon />, path: '/filters' },
      ]
    },
    {
      title: 'AI Capabilities',
      items: [
        { text: 'Translation', icon: <TranslateIcon />, path: '/translate' },
        { text: 'Weather', icon: <WeatherIcon />, path: '/weather' },
        { text: 'Summarization', icon: <SummarizeIcon />, path: '/summarize' },
      ]
    }
  ];

  const drawer = (
    <Box sx={{ py: 2 }}>
      <Toolbar />
      <Box sx={{ mb: 2, px: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3 
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              borderRadius: 1.5,
              color: 'white',
              mr: 1.5,
            }}
          >
            <FunctionsIcon fontSize="small" />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main'
            }}
          >
            SK Playground
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />

      {menuGroups.map((group) => (
        <Box key={group.title} sx={{ mb: 3 }}>
          <Typography 
            variant="overline" 
            color="text.secondary"
            sx={{ 
              display: 'block', 
              px: 3, 
              mb: 1,
              fontWeight: 600,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
            }}
          >
            {group.title}
          </Typography>
          <List dense>
            {group.items.map((item) => (
              <ListItem 
                key={item.text}
                disablePadding
              >
                <ListItem
                  button
                  component={Link}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 1.5,
                    pl: 2,
                    bgcolor: currentPath === item.path ? 'rgba(0, 112, 243, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: currentPath === item.path ? 'rgba(0, 112, 243, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    },
                    position: 'relative',
                    '&::before': currentPath === item.path ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      bgcolor: 'primary.main',
                      borderRadius: '0 2px 2px 0',
                    } : {}
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 36,
                    color: currentPath === item.path ? 'primary.main' : 'text.secondary',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: currentPath === item.path ? 600 : 400,
                      color: currentPath === item.path ? 'primary.main' : 'text.primary'
                    }}
                  />
                </ListItem>
              </ListItem>
            ))}
          </List>
        </Box>
      ))}

      <Box sx={{ mx: 3, mt: 2, p: 2, bgcolor: 'rgba(0, 112, 243, 0.05)', borderRadius: 2, border: '1px solid rgba(0, 112, 243, 0.1)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
          Semantic Kernel Workshop
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
          Explore AI integration patterns with Microsoft's Semantic Kernel
        </Typography>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AppBar
            position="fixed"
            sx={{
              width: { xs: 'calc(100% - 24px)', md: `calc(100% - ${drawerWidth}px - 24px)` },
              ml: { xs: 12, md: `calc(${drawerWidth}px + 12px)` },
              zIndex: (theme) => theme.zIndex.drawer + 1,
              color: 'text.primary',
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
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Semantic Kernel Playground
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 112, 243, 0.08)',
                  color: 'primary.main',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  '& span': {
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    mr: 1
                  }
                }}
              >
                <span></span> Backend Connected
              </Box>
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
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerWidth,
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
                ModalProps={{
                  keepMounted: true, // Better open performance on mobile
                }}
                sx={{
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerWidth,
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
              width: { md: `calc(100% - ${drawerWidth}px - 48px)` },
              backgroundColor: '#F8FAFC',
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
                <Route path="/agent" element={<AgentDemo />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;