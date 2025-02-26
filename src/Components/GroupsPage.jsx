import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffAuthority] = useState(Cookies.get("staffAuthority"));
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const ePosDevice = useRef();
  const printer = useRef();
  const [modalMode, setModalMode] = useState("edit");
  const [ipAddress, setIpAddress] = useState(
    Cookies.get("ipAddress") || "192.168.100.30"
  );
  const [printerPort, setPrinterPort] = useState(
    Cookies.get("printerPort") || "8008"
  );
  const [isConnecting, setisConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      setSearchTerm(id);
      const filtered = groups.filter((group) =>
        group.GroupId.toLowerCase().includes(id.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [location.search, groups]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(
          "https://api.100ticket.soshosai.com/groups/getGroups"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setGroups(data);
        setFilteredGroups(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleEditClick = (group) => {
    setCurrentGroup(group);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleRePrintClick = (group) => {
    setCurrentGroup(group);
    setModalMode("reprint");
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentGroup(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentGroup({ ...currentGroup, [name]: value });
  };

  const handleSave = () => {
    // 保存処理をここに追加
    setIsModalOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    const filtered = groups.filter((group) =>
      group.GroupId.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredGroups(filtered);
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    const sortedGroups = [...filteredGroups].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "ascending" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    setFilteredGroups(sortedGroups);
  };

  const handleGroupIdClick = (groupId) => {
    //navigate(`/tickets?id=${groupId}`);
    const filtered = groups.filter((group) => group.EntranceTime !== "");
    setFilteredGroups(filtered);
  };

  const handleGrepByNotEnteredClick = () => {
    const filtered = groups.filter((group) => group.EntranceTime === "");
    setFilteredGroups(filtered);
  };

  const handleGrepCancelClick = () => {
    setFilteredGroups(groups);
    setSearchTerm("");
    navigate(`/groups`);
  };

  const handleGrepByEnteredClick = () => {
    const filtered = groups.filter((group) => group.EntranceTime !== "");
    setFilteredGroups(filtered);
  };

  const handleConnect = async () => {
    Cookies.set("ipAddress", ipAddress);
    Cookies.set("printerPort", printerPort);
    if (!ipAddress || !printerPort) {
      alert("IPアドレスとポート番号を入力してください。");
      return;
    }
    setisConnecting(true);

    try {
      connect();
    } catch (e) {
      console.error("Error printing:", e);
      alert("接続に失敗しました。");
    }
  };

  const handleRePrint = async () => {
    try {
      try {
        await print();
      } catch (e) {
        console.error("Error printing:", e);
        alert("印刷に失敗しました。");
      } finally {
        setIsPrinting(false);
        handleModalClose();
      }
    } catch (error) {
      console.error("Error printing:", error);
      alert("印刷中にエラーが発生しました");
    } finally {
      setisConnecting(false);
    }
  };

  const connect = async () => {
    if (!window.epson || !window.epson.ePOSDevice) {
      return;
    }
    if (!ipAddress || !printerPort) {
      return;
    }
    let ePosDev = new window.epson.ePOSDevice();
    ePosDevice.current = ePosDev;
    ePosDev.connect(ipAddress, printerPort, (data) => {
      // ネットワーク通信完了時に、成功・失敗に関わらず接続済みフラグをオンにする
      setIsConnected(true);
      if (data === "OK") {
        ePosDev.createDevice(
          "local_printer",
          ePosDev.DEVICE_TYPE_PRINTER,
          { crypto: true, buffer: false },
          (devobj, retcode) => {
            if (retcode === "OK") {
              printer.current = devobj;
              printer.current.timeout = 60000;
              printer.current.onreceive = async function (res) {
                if (res.success) {
                  console.log("Print success");
                  // ※既に setIsConnected(true) しているため追加不要
                } else {
                  console.error("Print failure", res);
                }
              };
              printer.current.onerror = function (err) {
                console.error("Printer error", err);
              };
            } else {
              console.error("createDeviceの返答:", retcode);
            }
          }
        );
      } else {
        console.error("接続応答:", data);
      }
    });
  };

  const print = async () => {
    let prn = printer.current;
    if (!prn) {
      await connect();
      prn = printer.current;
      if (!prn) {
        alert("プリンターに接続できませんでした");
        return;
      }
    }
    try {
      prn.addTextAlign(prn.ALIGN_CENTER);
      prn.addTextFont(prn.FONT_C);
      prn.addTextLang("ja");
      prn.brightness = 1.0;
      prn.halftone = prn.HALFTONE_ERROR_DIFFUSION;
      prn.addTextSmooth(true);
      prn.addFeedLine(1);
      prn.addTextSize(3, 3);
      prn.addTextStyle(false, false, false, prn.COLOR_1);
      prn.addText("【再発行】\n");
      prn.addFeedLine(2);
      prn.addTextSize(4, 4);
      prn.addText("蒼翔祭\n");
      prn.addTextSmooth(false);
      prn.addFeedLine(1);
      prn.addTextSize(2, 2);
      prn.addText("入場チケット\n");
      prn.addTextSize(1, 1);
      prn.addFeedLine(1);
      prn.addText("以下のQRコードは、\n入場時・再入場時・大抽選会\nの");
      prn.addTextStyle(false, true, true, prn.COLOR_1);
      prn.addText("全てにおいて必要となります。\n");
      prn.addTextStyle(false, false, false, prn.COLOR_1);
      prn.addText("管理には十分ご注意ください。\n");
      prn.addFeedLine(4);
      prn.addSymbol(
        currentGroup.GroupId,
        prn.SYMBOL_QRCODE_MODEL_2,
        prn.LEVEL_DEFAULT,
        10,
        0,
        0
      );
      prn.addFeedLine(4);
      prn.addTextAlign(prn.ALIGN_LEFT);
      prn.addText(`グループID:${currentGroup.GroupId}\n`);
      prn.addFeedLine(2);
      prn.addText(`発行場所:${currentGroup.Entrance}\n`);
      prn.addFeedLine(2);
      prn.addText(`発行時刻:${currentGroup.EntranceTime}\n`);
      prn.addFeedLine(2);
      prn.addText(
        `年齢: ${currentGroup.AgeRange}, 性別: ${currentGroup.Gender}, 人数: ${currentGroup.MemberCount}\n`
      );
      prn.addTextAlign(prn.ALIGN_CENTER);
      prn.addFeedLine(1);
      prn.addTextSize(2, 2);
      prn.addText("【再発行】\n");
      prn.addFeedLine(1);
      prn.addTextSize(1, 1);
      prn.addText("このチケットは運営管理者による\n");
      prn.addText("再発行チケットです。\n");
      prn.addFeedLine(2);
      prn.addCut(prn.CUT_FEED);
      prn.send();
    } catch (error) {
      console.error("Error during printing:", error);
      alert("印刷処理中にエラーが発生しました");
    }
  };

  if (isLoading) {
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

  if (isError) {
    return <div>Error loading groups.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Groups</h1>
      <div className="mb-4 flex flex-row">
        <input
          type="text"
          placeholder="グループIDで検索"
          value={searchTerm}
          onChange={handleSearchChange}
          className="border p-2 w-full"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-36 ml-5"
          onClick={() => handleGrepByEnteredClick()}
        >
          入場済みで
          <br />
          絞り込み
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded w-36 ml-5"
          onClick={() => handleGrepByNotEnteredClick()}
        >
          未入場で
          <br />
          絞り込み
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded w-36 ml-5"
          onClick={() => handleGrepCancelClick()}
        >
          絞り込みを解除
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-collapse border border-gray-200">
          <thead>
            <tr>
              <th
                className="py-2 px-4 border border-gray-200 text-center cursor-pointer"
                onClick={() => handleSort("GroupId")}
              >
                グループID
              </th>
              <th
                className="py-2 px-4 border border-gray-200 text-center cursor-pointer"
                onClick={() => handleSort("AgeRange")}
              >
                年齢帯
              </th>
              <th
                className="py-2 px-4 border border-gray-200 text-center cursor-pointer"
                onClick={() => handleSort("Gender")}
              >
                代表者性別
              </th>
              <th
                className="py-2 px-4 border border-gray-200 text-center cursor-pointer"
                onClick={() => handleSort("MemberCount")}
              >
                人数
              </th>
              <th
                className="py-2 px-4 border border-gray-200 text-center cursor-pointer"
                onClick={() => handleSort("Entrance")}
              >
                受付場所
              </th>
              <th
                className="py-2 px-4 border border-gray-200 text-center cursor-pointer"
                onClick={() => handleSort("EntranceTime")}
              >
                受付時刻
              </th>
              {staffAuthority === "admin" && (
                <>
                  <th className="py-2 px-4 border border-gray-200 text-center">
                    編集
                  </th>
                  <th className="py-2 px-4 border border-gray-200 text-center">
                    再印刷
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <tr key={group.GroupId}>
                <td className="py-2 px-4 border border-gray-200 text-center">
                  {group.GroupId}
                </td>
                <td className="py-2 px-4 border border-gray-200 text-center">
                  {group.AgeRange}
                </td>
                <td className="py-2 px-4 border border-gray-200 text-center">
                  {group.Gender}
                </td>
                <td className="py-2 px-4 border border-gray-200 text-center">
                  {group.MemberCount}
                </td>
                <td className="py-2 px-4 border border-gray-200 text-center">
                  {group.Entrance}
                </td>
                <td className="py-2 px-4 border border-gray-200 text-center">
                  {group.EntranceTime}
                </td>
                {staffAuthority === "admin" && (
                  <>
                    <td className="py-2 px-4 border border-gray-200 text-center">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => handleEditClick(group)}
                      >
                        編集
                      </button>
                    </td>
                    <td className="py-2 px-4 border border-gray-200 text-center">
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={() => handleRePrintClick(group)}
                      >
                        再印刷
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen &&
        (modalMode === "edit" ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">グループ編集</h2>
              <label className="block mb-2">
                グループID:
                <input
                  type="text"
                  name="GroupId"
                  value={currentGroup.GroupId}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                  disabled
                />
              </label>
              <label className="block mb-2">
                年齢帯:
                <input
                  type="text"
                  name="AgeRange"
                  value={currentGroup.AgeRange}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                代表者性別:
                <input
                  type="text"
                  name="Gender"
                  value={currentGroup.Gender}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                人数:
                <input
                  type="text"
                  name="MemberCount"
                  value={currentGroup.MemberCount}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                受付場所:
                <input
                  type="text"
                  name="Entrance"
                  value={currentGroup.Entrance}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                受付時刻:
                <input
                  type="text"
                  name="EntranceTime"
                  value={currentGroup.EntranceTime}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                />
              </label>
              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={handleModalClose}
                >
                  キャンセル
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleSave}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          modalMode === "reprint" && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-4">再印刷</h2>
                <p>入場チケットを再印刷します。</p>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="IPアドレス"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="ポート番号"
                    value={printerPort}
                    onChange={(e) => setPrinterPort(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                {!isConnected && (
                  <button
                    className={`px-4 py-2 rounded-md text-white ${
                      isConnected
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : isConnecting
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting
                      ? isConnected
                        ? "接続しました。"
                        : "接続しています..."
                      : "接続"}
                  </button>
                )}
                {isConnected && (
                  <button
                    className={`px-4 py-2 rounded-md text-white ${
                      isPrinting
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={handleRePrint}
                    disabled={isPrinting}
                  >
                    {isPrinting ? "印刷中..." : "印刷"}
                  </button>
                )}
              </div>
            </div>
          )
        ))}
    </div>
  );
};

export default GroupsPage;
