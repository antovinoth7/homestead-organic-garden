import React from 'react';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface SideMenuProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const drawerWidth = 240;

const SideMenu: React.FC<SideMenuProps> = ({
  mobileOpen,
  handleDrawerToggle,
  toggleTheme,
  isDarkMode,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const drawerContent = (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Garden Planner
      </Typography>
      <Divider />
      <List>
        <ListItemButton>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <LocalFloristIcon />
          </ListItemIcon>
          <ListItemText primary="My Crops" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <CalendarTodayIcon />
          </ListItemIcon>
          <ListItemText primary="Calendar" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
        <ListItemButton onClick={toggleTheme}>
          <ListItemIcon>{isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}</ListItemIcon>
          <ListItemText primary={isDarkMode ? 'Light Mode' : 'Dark Mode'} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ ml: 2, mt: 2, position: 'absolute' }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: isDarkMode ? '#263238' : '#e8f5e9',
            color: isDarkMode ? '#ffffff' : '#2e7d32',
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>
    </>
  );
};

export default SideMenu;
