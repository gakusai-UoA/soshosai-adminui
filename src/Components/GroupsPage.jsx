import { useEffect, useState } from "react";
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
  const [staffAuthority, setStaffAuthority] = useState(
    Cookies.get("staffAuthority")
  );
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      setSearchTerm(id);
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
  };

  const handleGrepByEnteredClick = () => {
    const filtered = groups.filter((group) => group.EntranceTime !== "");
    setFilteredGroups(filtered);
  };

  const handleGrepByNotEnteredClick = () => {
    const filtered = groups.filter((group) => group.EntranceTime === "");
    setFilteredGroups(filtered);
  };

  const handleGrepCancelClick = () => {
    setFilteredGroups(groups);
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
                <th className="py-2 px-4 border border-gray-200 text-center">
                  編集
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <tr key={group.GroupId}>
                <td
                  className="py-2 px-4 border border-gray-200 text-center cursor-pointer text-blue-500 underline"
                  onClick={() => handleGroupIdClick(group.GroupId)}
                >
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
                  <td className="py-2 px-4 border border-gray-200 text-center">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      onClick={() => handleEditClick(group)}
                    >
                      編集
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
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
      )}
    </div>
  );
};

export default GroupsPage;
