import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import gardenBg from '../../assets/garden-bg.png';
import { useNavigate } from 'react-router';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Future logic: clear auth token, etc.
    navigate('/home');
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${gardenBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        px: 8,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Paper
          elevation={5}
          sx={{
            p: 4,
            borderRadius: 4,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Typography variant="h5" gutterBottom align="center" sx={{ color: '#2e7d32' }}>
            Login to Your Garden
          </Typography>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              variant="outlined"
              type="email"
              sx={{ backgroundColor: '#f0fff4', borderRadius: 1 }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              variant="outlined"
              type="password"
              sx={{ backgroundColor: '#f0fff4', borderRadius: 1 }}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#388e3c',
                },
              }}
              onClick={handleLogin}
            >
              Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
