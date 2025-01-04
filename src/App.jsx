import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Nav from "./Components/Nav";
import MainPage from "./Components/MainPage";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import TicketsPage from "./Components/TicketsPage";
import GroupsPage from "./Components/GroupsPage";
import QRPage from "./Components/QRPage";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffId, setStaffId] = useState(Cookies.get("staffId") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("担当者IDを入力してください");

  useEffect(() => {
    if (staffId.length === 37 && Cookies.get("staffAuthority")) {
      setIsModalOpen(false);
    } else {
      setIsModalOpen(true);
    }
  }, [staffId]);

  const handleModalSubmit = async () => {
    if (staffId.length !== 37) {
      setIsError(true);
      return;
    } else {
      if (staffId.charAt(0) !== "s") {
        setIsError(true);
        setErrorMessage("入力されたIDはスタッフのものではありません。");
        return;
      }
      setIsLoading(true);
      try {
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
          if (authority === "admin") {
            Cookies.set("staffId", staffId, { expires: 1 });
            Cookies.set("staffAuthority", authority, { expires: 1 });
            setIsModalOpen(false);
          } else if (authority === "staff") {
            var inOneMinutes = new Date(new Date().getTime() + 1 * 60 * 1000);
            Cookies.set("staffId", staffId, { expires: inOneMinutes });
            Cookies.set("staffAuthority", authority, { expires: inOneMinutes });
            setIsModalOpen(false);
          } else {
            setIsError(true);
            setErrorMessage("権限がありませんでした。");
          }
        } else {
          setIsError(true);
          setErrorMessage("ログインができませんでした。");
        }
      } catch (error) {
        setIsError(true);
        setErrorMessage("サーバーとの通信に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setStaffId(e.target.value);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Nav />
        <Routes>
          <Route
            path="/"
            element={
              Cookies.get("staffAuthority") ? (
                <MainPage />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/tickets"
            element={
              Cookies.get("staffAuthority") ? (
                <TicketsPage />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/groups"
            element={
              Cookies.get("staffAuthority") ? (
                <GroupsPage />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/qr"
            element={
              Cookies.get("staffAuthority") ? (
                <QRPage />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/auth"
            element={
              <div
                className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ${
                  isModalOpen ? "block" : "hidden"
                }`}
              >
                <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-auto">
                  <h2 className="text-xl font-bold mb-4">スタッフ認証</h2>
                  <label className="block mb-2">
                    スタッフID:
                    <input
                      type="text"
                      value={staffId}
                      onChange={handleInputChange}
                      className="border p-2 w-full"
                    />
                  </label>
                  {isError && <p className="text-red-500">{errorMessage}</p>}
                  <div className="flex justify-end">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      onClick={handleModalSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? "認証中..." : "送信"}
                    </button>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
