import './style.css';
import './root-app-layout.css'; // Import the new layout styles
import Header from './components/Header';
import MainContent from './components/MainContent'; // Import the MainContent component

function App() {
  return (
    <div className="App">
      <Header />
      <MainContent />
    </div>
  );
}

export default App;
