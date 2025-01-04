import { BrowserRouter, Route, Routes } from "react-router-dom";
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
    if (staffId.length == 37) {
      setIsModalOpen(false);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  const handleModalSubmit = async () => {
    if (staffId.length != 37) {
      setIsError(true);
      return;
    } else {
      if (staffId.charAt(0) != "s") {
        setIsError(true);
        setErrorMessage("入力されたIDはスタッフのものではありません。");
        return;
      }
      setIsLoading(true);
      const response = await fetch(
        "https://100-ticket-server.a-gakusai.workers.dev/staffs/staffLogin",
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
        var inOneMinutes = new Date(new Date().getTime() + 1 * 60 * 1000);
        const data = await response.json();
        let authority = data.Authority;
        if (authority == "admin") {
          Cookies.set("staffId", staffId, { expires: 1 });
          Cookies.set("staffAuthority", authority, { expires: 1 });
          setIsModalOpen(false);
          setIsLoading(false);
        } else if (authority == "staff") {
          Cookies.set("staffId", staffId, { expires: inOneMinutes });
          Cookies.set("staffAuthority", authority, { expires: inOneMinutes });
          setIsModalOpen(false);
          setIsLoading(false);
        } else {
          setIsError(true);
          setErrorMessage("権限がありませんでした。");
          setIsLoading(false);
        }
      } else {
        setIsError(true);
        setErrorMessage("ログインができませんでした。");
        setIsLoading(false);
      }
    }
  };

  return (
    <BrowserRouter>
      <div className="w-full">
        <Nav className="w-full fixed top-0 left-0 bg-gray-800 text-white p-4" />
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            {isLoading ? (
              <div
                className="flex justify-center items-center p-5"
                aria-label="読み込み中"
              >
                <div className="flex flex-col justify-center items-center">
                  <div className="animate-ping h-10 w-10 bg-gray-800 rounded-full m-5"></div>
                  <a className="text-3xl m-5">ログインしています...</a>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-4">ログイン</h2>
                <label className="block mb-4">
                  担当者ID:
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="border p-2 w-full mt-1 rounded"
                  />
                </label>
                {isError && (
                  <label className="block mb-4 text-red-500">
                    {errorMessage}
                  </label>
                )}
                <button
                  onClick={handleModalSubmit}
                  className="mt-4 p-2 bg-blue-500 text-white rounded w-full"
                >
                  確認
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/qr" element={<QRPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
