import { Box } from '@mui/material';
import Navbar from './Navbar';
import formBg from '../assets/Form-bg.png';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(${formBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </>
  );
};

export default AppLayout;
