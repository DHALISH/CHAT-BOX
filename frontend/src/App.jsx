import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./Signin.jsx";
import Signup from "./Signup.jsx";
import Index from "./start.jsx";
import Home from "./home.jsx";
import SearchPage from "./searchPage.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
