import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Nav from "./Components/Nav";
import MainPage from "./Components/MainPage";
import { useEffect, useState } from "react";
import TicketsPage from "./Components/TicketsPage";
import GroupsPage from "./Components/GroupsPage";
import QRPage from "./Components/QRPage";
import Cookies from "js-cookie";

function App() {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const fetchHeader = async () => {
      try {
        const response = await fetch(window.location.href, { method: "HEAD" });
        const jwt = response.headers.get("cf-access-jwt-assertion");
        console.log(jwt, response.headers);
        let cfEmail = null;
        if (jwt) {
          const parts = jwt.split(".");
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1]));
            cfEmail = payload.email;
          }
        }
        if (cfEmail && cfEmail.includes("soshosai.com")) {
          const staffId = cfEmail.split("@")[0];
          Cookies.set("staffId", staffId, { expires: 0.1 });
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Error fetching or decoding JWT:", error);
        setIsAuthorized(false);
      }
    };
    fetchHeader();
  }, []);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="unauthorized">
        <h1>アクセス権限がありません。</h1>
        <p>soshosai.com のメールアドレスでログインしてください。</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Nav />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
