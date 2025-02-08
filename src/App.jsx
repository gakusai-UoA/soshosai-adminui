import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Nav from "./Components/Nav";
import MainPage from "./Components/MainPage";
import GroupsPage from "./Components/GroupsPage";
import QRPage from "./Components/QRPage";
import TicketsPage from "./Components/TicketsPage";

import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { jwtVerify, createRemoteJWKSet } from "jose";

const TEAM_DOMAIN = process.env.REACT_APP_TEAM_DOMAIN || args.context.cloudflare.env.REACT_APP_TEAM_DOMAIN;
const AUD = process.env.REACT_APP_POLICY_AUD || args.context.cloudflare.env.REACT_APP_POLICY_AUD;
console.log(AUD)

function App() {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const fetchCookieToken = async () => {
      try {
        const token = Cookies.get("CF_Authorization");
        console.log("Token from cookie:", token);
        let cfEmail = null;
        if (token) {
          const JWKS = createRemoteJWKSet(new URL(`https://soshosai.cloudflareaccess.com/cdn-cgi/access/certs`));
          const result = await jwtVerify(token, JWKS, {
            issuer: TEAM_DOMAIN,
            audience: AUD,
          });
          cfEmail = result.payload.email;
        }
        if (cfEmail && cfEmail.includes("soshosai.com")) {
          const staffId = cfEmail.split("@")[0];
          Cookies.set("staffId", staffId, { expires: 0.1 });
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Error verifying JWT:", error);
        setIsAuthorized(false);
      }
    };
    fetchCookieToken();
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
