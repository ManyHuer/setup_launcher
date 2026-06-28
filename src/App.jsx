import { Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import ProfileForm from './screens/ProfileForm';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/profile/new" element={<ProfileForm />} />
        <Route path="/profile/:id/edit" element={<ProfileForm />} />
      </Routes>
    </div>
  );
}

export default App;
