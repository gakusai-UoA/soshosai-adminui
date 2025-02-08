import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Nav from "./Components/Nav";
import MainPage from "./Components/MainPage";
import GroupsPage from "./Components/GroupsPage";
import QRPage from "./Components/QRPage";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { jwtVerify, createRemoteJWKSet } from "jose";
import AboutYou from "./Components/AboutYou";

const TEAM_DOMAIN = process.env.REACT_APP_TEAM_DOMAIN;
const AUD = process.env.REACT_APP_POLICY_AUD;

function App() {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const fetchCookieToken = async () => {
      try {
        const token = Cookies.get("CF_Authorization");
        let cfEmail = null;
        if (token) {
          const JWKS = createRemoteJWKSet(
            new URL(
              `https://soshosai.cloudflareaccess.com/cdn-cgi/access/certs`
            )
          );
          const result = await jwtVerify(token, JWKS, {
            issuer: TEAM_DOMAIN,
            audience: AUD,
          });
          cfEmail = result.payload.email;
        }
        if (cfEmail && cfEmail.includes("soshosai.com")) {
          const staffId = cfEmail.split("@")[0];
          const response = await fetch(
            "https://api.100ticket.soshosai.com/staffs/staffLogin",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                staffId: staffId,
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            let authority = data.Authority;
            // 共通のCookie設定用の有効期限
            let expiresOption;
            if (authority === "admin") {
              expiresOption = { expires: 0.1 };
            } else if (authority === "staff") {
              const inOneMinutes = new Date(
                new Date().getTime() + 1 * 60 * 1000
              );
              expiresOption = { expires: inOneMinutes };
            }
            // 必要な情報をCookieにセット
            Cookies.set("staffId", staffId, expiresOption);
            Cookies.set("staffAuthority", authority, expiresOption);
            Cookies.set("staffName", data.StaffName, expiresOption);
            Cookies.set("staffDepartment", data.StaffDepartment, expiresOption);
            Cookies.set("cfEmail", cfEmail, expiresOption);
          } else {
            // エラー処理（必要に応じて実装）
            setIsError(true);
            setErrorMessage("ログインができませんでした。");
          }
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
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        aria-label="読み込み中"
      >
        <div className="flex flex-col justify-center items-center">
          <div className="animate-ping h-10 w-10 bg-gray-800 rounded-full m-5"></div>
          <a className="text-3xl m-5">読み込み中...</a>
        </div>
      </div>
    );
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
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/aboutyou" element={<AboutYou />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
