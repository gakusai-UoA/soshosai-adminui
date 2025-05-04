import { useState, useEffect } from "react";
import Cookies from "js-cookie";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    projectName: "",
    destinationUrl: "",
    adminUser: Cookies.get("staffId"),
  });
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
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
      const response = await fetch(
        "https://fwd.soshosai.com/projects"
      );
      if (response.ok) {
        const data = await response.json();
        // フィルタリング：アクセス権のあるプロジェクトのみを表示
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
      const response = await fetch(
        "https://fwd.soshosai.com/projects/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectName: newProject.projectName,
            destinationUrl: newProject.destinationUrl,
            adminUser: newProject.adminUser,
          }),
        }
      );
      if (response.ok) {
        setNewProject({ projectName: "", destinationUrl: "" });
        fetchProjects();
      } else {
        setError("プロジェクトの作成に失敗しました");
      }
    } catch (error) {
      setError("サーバーとの通信に失敗しました");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("このプロジェクトを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(
        `https://fwd.soshosai.com/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        fetchProjects();
      } else {
        setError("プロジェクトの削除に失敗しました");
      }
    } catch (error) {
      setError("サーバーとの通信に失敗しました");
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const response = await fetch(
        `https://fwd.soshosai.com/projects/${editingProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectName: editingProject.name,
            destinationUrl: editingProject.destination_url,
          }),
        }
      );
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
                <tr key={project.id} className="border-b">
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
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setEditingProject(project)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      削除
                    </button>
                    <a
                      href={`/analytics/${project.id}`}
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
