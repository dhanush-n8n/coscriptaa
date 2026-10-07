import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Register } from "./pages/Register"
import ProtectedRouter from "./middleware/ProtectedRouter";
import { CodeEditor } from "./pages/CodeEditor";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { ConflictDashboard } from "./pages/ConflictDashboard";

const App = ()=>{
 
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/conflict-dashboard" element={<ConflictDashboard />} />
        <Route path="/:roomId" element={<Register />} />
        <Route path="/" element = {<Home/>}/>
        <Route path="/start" element={<Register />} />
        <Route path="/code/:roomId" element = {<ProtectedRouter><CodeEditor/></ProtectedRouter>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
