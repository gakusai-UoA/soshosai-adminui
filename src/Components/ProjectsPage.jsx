import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";

const API_BASE_URL = "https://fwd.soshosai.com";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    projectName: "",
    destinationUrl: "",
    adminUser: Cookies.get("staffId"),
  });
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState("");
  const [ipAddress, setIpAddress] = useState(Cookies.get("ipAddress") || "192.168.100.30");
  const [printerPort, setPrinterPort] = useState(Cookies.get("printerPort") || "8008");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const ePosDevice = useRef();
  const printer = useRef();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!window.epson || !window.epson.ePOSDevice) {
      setError("ePOSプリンターSDKの読み込みに失敗しました");
    }
  }, []);

  const userHasAccess = (project) => {
    const currentUserId = Cookies.get("staffId");
    return (
      project.adminUserId === null ||
      project.adminUserId === "all" ||
      project.adminUserId.includes(currentUserId)
    );
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched projects:', data);
        const accessibleProjects = data.filter(userHasAccess);
        setProjects(accessibleProjects);
      } else {
        setError("プロジェクトの取得に失敗しました");
      }
    } catch (error) {
      setError("サーバーとの通信に失敗しました");
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: newProject.projectName,
          destinationUrl: newProject.destinationUrl,
          adminUser: newProject.adminUser,
        }),
      });
      if (response.ok) {
        setNewProject({ 
          projectName: "", 
          destinationUrl: "",
          adminUser: Cookies.get("staffId")
        });
        fetchProjects();
      } else {
        setError("プロジェクトの作成に失敗しました");
      }
    } catch (error) {
      setError("サーバーとの通信に失敗しました");
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${editingProject.projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: editingProject.name,
          destinationUrl: editingProject.destination_url,
        }),
      });
      if (response.ok) {
        setEditingProject(null);
        fetchProjects();
      } else {
        setError("プロジェクトの更新に失敗しました");
      }
    } catch (error) {
      setError("サーバーとの通信に失敗しました");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("このプロジェクトを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchProjects();
      } else {
        setError("プロジェクトの削除に失敗しました");
      }
    } catch (error) {
      setError("サーバーとの通信に失敗しました");
    }
  };

  const connect = async () => {
    if (!window.epson || !window.epson.ePOSDevice) {
      setError("ePOSプリンターSDKが見つかりません");
      return;
    }
    if (!ipAddress || !printerPort) {
      setError("IPアドレスとポート番号を入力してください");
      return;
    }

    let ePosDev = new window.epson.ePOSDevice();
    ePosDevice.current = ePosDev;
    ePosDev.connect(ipAddress, printerPort, (data) => {
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
              printer.current.onreceive = function (res) {
                if (!res.success) {
                  setError("印刷に失敗しました: " + res.code);
                }
              };
              printer.current.onerror = function (err) {
                setError("プリンターエラー: " + err);
              };
            } else {
              setError("プリンターデバイスの作成に失敗しました: " + retcode);
            }
          }
        );
      } else {
        setError("プリンターへの接続に失敗しました: " + data);
      }
    });
  };

  const handleConnect = async () => {
    Cookies.set("ipAddress", ipAddress);
    Cookies.set("printerPort", printerPort);
    setIsConnecting(true);
    try {
      await connect();
    } catch (e) {
      console.error("接続エラー:", e);
      setError("プリンターへの接続に失敗しました");
    } finally {
      setIsConnecting(false);
    }
  };

  const print = async (qrUrl, projectId, qrId) => {
    let prn = printer.current;
    if (!prn) {
      await connect();
      prn = printer.current;
      if (!prn) {
        setError("プリンターに接続できませんでした");
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

      // Add QR code
      prn.addSymbol(qrUrl, prn.SYMBOL_QRCODE_MODEL_2, prn.LEVEL_L, 9, 0, 0);
      prn.addFeedLine(2);
      prn.addCut(prn.CUT_FEED);

      prn.addTextSize(1, 1);
      prn.addText(`Project: ${selectedProject.name}\n`);
      prn.addText(`QR ID: ${qrId}\n`);
      prn.addText(`URL: ${qrUrl}\n`);
      prn.addText(`Generated: ${new Date().toLocaleString("ja-JP")}\n`);

      prn.addFeedLine(2);
      prn.addCut(prn.CUT_FEED);

      prn.send();
    } catch (error) {
      console.error("印刷エラー:", error);
      setError("印刷処理中にエラーが発生しました");
    }
  };

  const handleGenerateQRs = async () => {
    try {
      setIsPrinting(true);
      const qrCodes = [];
      
      for (let i = 0; i < quantity; i++) {
        const response = await fetch(`${API_BASE_URL}/projects/createQRCode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId: selectedProject.projectId }),
        });

        if (!response.ok) {
          throw new Error("QRコードの生成に失敗しました");
        }

        const data = await response.json();
        qrCodes.push({
          qrId: data.qrId,
          url: `https://fwd.soshosai.com?id=${data.qrId}`,
        });
      }

      setGeneratedQRs(qrCodes);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintQRs = async () => {
    if (!isConnected) {
      setError("プリンターに接続してください");
      return;
    }

    try {
      setIsPrinting(true);
      for (const qr of generatedQRs) {
        await print(qr.url, selectedProject.projectId, qr.qrId);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenPrintModal = (project) => {
    setSelectedProject(project);
    setIsPrintModalOpen(true);
    setGeneratedQRs([]);
    setQuantity(1);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
    setSelectedProject(null);
    setGeneratedQRs([]);
    setQuantity(1);
    setIsConnected(false);
    setIsConnecting(false);
    setIsPrinting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プロジェクト管理</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">新規プロジェクト作成</h2>
        <form onSubmit={handleCreateProject}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              プロジェクト名
            </label>
            <input
              type="text"
              value={newProject.projectName}
              onChange={(e) =>
                setNewProject({ ...newProject, projectName: e.target.value })
              }
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              リダイレクト先URL
            </label>
            <input
              type="url"
              value={newProject.destinationUrl}
              onChange={(e) =>
                setNewProject({ ...newProject, destinationUrl: e.target.value })
              }
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            作成
          </button>
        </form>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">プロジェクト一覧</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">プロジェクト名</th>
                <th className="px-4 py-2">リダイレクト先URL</th>
                <th className="px-4 py-2">作成日時</th>
                <th className="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.filter(userHasAccess).map((project) => (
                <tr key={project.project_id} className="border-b">
                  <td className="px-4 py-2">{project.name}</td>
                  <td className="px-4 py-2">
                    <a
                      href={project.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {project.destination_url}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(project.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => setEditingProject(project)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleOpenPrintModal(project)}
                      className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded"
                    >
                      QR生成/印刷
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.projectId)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      削除
                    </button>
                    <a
                      href={`/analytics/${project.projectId}`}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded inline-block"
                    >
                      分析
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">QR生成・印刷</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{selectedProject.name}</p>
                <p className="text-gray-600 text-sm">{selectedProject.destination_url}</p>
              </div>

              {!isConnected ? (
                <div className="space-y-2">
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
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {isConnecting ? "接続中..." : "プリンターに接続"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      生成する枚数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {generatedQRs.length === 0 ? (
                    <button
                      onClick={handleGenerateQRs}
                      disabled={isPrinting}
                      className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    >
                      {isPrinting ? "生成中..." : "QRコードを生成"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <p className="text-sm font-medium mb-2">生成されたQRコード: {generatedQRs.length}枚</p>
                        <div className="max-h-48 overflow-y-auto">
                          <ul className="space-y-2">
                            {generatedQRs.map((qr) => (
                              <li key={qr.qrId} className="flex items-center justify-between text-sm border-b pb-2">
                                <div>
                                  <div>ID: {qr.qrId}</div>
                                  <div className="text-gray-600 text-xs">
                                    {qr.url}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(qr.url);
                                    setError("URLをコピーしました");
                                    setTimeout(() => setError(""), 2000);
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  URLをコピー
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {isConnected ? (
                        <button
                          onClick={handlePrintQRs}
                          disabled={isPrinting}
                          className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                          {isPrinting ? "印刷中..." : "QRコードを印刷"}
                        </button>
                      ) : (
                        <div className="text-center text-sm text-gray-600">
                          QRコードを印刷するにはプリンターを接続してください
                        </div>
                      )}
                      <button
                        onClick={handleGenerateQRs}
                        disabled={isPrinting}
                        className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                      >
                        {isPrinting ? "生成中..." : "追加で生成"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleClosePrintModal}
                className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">プロジェクトの編集</h2>
            <form onSubmit={handleUpdateProject}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  プロジェクト名
                </label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      name: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  リダイレクト先URL
                </label>
                <input
                  type="url"
                  value={editingProject.destination_url}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      destination_url: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
