import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Future logic: clear auth token, etc.
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Organic Gardening Planner
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/calendar">
            Calendar
          </Button>
          <Button color="inherit" component={Link} to="/crop-planner">
            Crop Planner
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
