import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home/Home';
// import CropPlanner from './pages/CropPlanner';
// import Calendar from './pages/Calendar';
import Login from './pages/Login/Login';
import AppLayout from './components/AppLayout';

const App = () => {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<Home />} />
                {/* <Route path="/crop-planner" element={<CropPlanner />} /> */}
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
