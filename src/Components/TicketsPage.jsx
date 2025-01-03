import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(
          "https://api.100ticket.soshosai.com/tickets/getTickets"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setTickets(data);
        setFilteredTickets(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      setGroupSearchTerm(id);
      const filtered = tickets.filter((ticket) =>
        ticket.OwnerId.toLowerCase().includes(id.toLowerCase())
      );
      setFilteredTickets(filtered);
    }
  }, [location.search, tickets]);

  const handleEditClick = (ticket) => {
    setCurrentTicket(ticket);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentTicket(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTicket({ ...currentTicket, [name]: value });
  };

  const handleSave = () => {
    // 保存処理をここに追加
    setIsModalOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterTickets(e.target.value, groupSearchTerm);
  };

  const handleGroupSearchChange = (e) => {
    setGroupSearchTerm(e.target.value);
    filterTickets(searchTerm, e.target.value);
  };

  const filterTickets = (ticketId, groupId) => {
    const filtered = tickets.filter((ticket) =>
      ticket.TicketId.toLowerCase().includes(ticketId.toLowerCase()) &&
      ticket.OwnerId.toLowerCase().includes(groupId.toLowerCase())
    );
    setFilteredTickets(filtered);
  };

  const handleOwnerIdClick = (ownerId) => {
    navigate(`/groups?id=${ownerId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" aria-label="読み込み中">
        <div className="flex flex-col justify-center items-center">
          <div className="animate-ping h-10 w-10 bg-gray-800 rounded-full m-5"></div>
          <a className="text-3xl m-5">読み込み中...</a>
        </div>
      </div>
    );
  }

  if (isError) {
    return <div>Error loading tickets.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Tickets</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="チケットIDで検索"
          value={searchTerm}
          onChange={handleSearchChange}
          className="border p-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="所有者IDで検索"
          value={groupSearchTerm}
          onChange={handleGroupSearchChange}
          className="border p-2 w-full"
        />
      </div>
      <table className="min-w-full bg-white border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border border-gray-200 text-center">チケットID</th>
            <th className="py-2 px-4 border border-gray-200 text-center">所有者ID</th>
            <th className="py-2 px-4 border border-gray-200 text-center">発行者</th>
            <th className="py-2 px-4 border border-gray-200 text-center">発行場所</th>
            <th className="py-2 px-4 border border-gray-200 text-center">発行時刻</th>
            <th className="py-2 px-4 border border-gray-200 text-center">使用済み</th>
            <th className="py-2 px-4 border border-gray-200 text-center">チケットタイプ</th>
            <th className="py-2 px-4 border border-gray-200 text-center">編集</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.map((ticket) => (
            <tr key={ticket.TicketId}>
              <td className="py-2 px-4 border border-gray-200 text-center">{ticket.TicketId}</td>
              <td className="py-2 px-4 border border-gray-200 text-center">
                <button
                  className="text-blue-500 underline"
                  onClick={() => handleOwnerIdClick(ticket.OwnerId)}
                >
                  {ticket.OwnerId}
                </button>
              </td>
              <td className="py-2 px-4 border border-gray-200 text-center">{ticket.Issuer}</td>
              <td className="py-2 px-4 border border-gray-200 text-center">{ticket.IssuedPlace}</td>
              <td className="py-2 px-4 border border-gray-200 text-center">{ticket.IssuedTime}</td>
              <td className="py-2 px-4 border border-gray-200 text-center">{ticket.IsUsed ? "はい" : "いいえ"}</td>
              <td className="py-2 px-4 border border-gray-200 text-center">{ticket.TicketType}</td>
              <td className="py-2 px-4 border border-gray-200 text-center">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => handleEditClick(ticket)}
                >
                  編集
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">チケット編集</h2>
            <label className="block mb-2">
              所有者ID:
              <input
                type="text"
                name="OwnerId"
                value={currentTicket.OwnerId}
                onChange={handleInputChange}
                className="border p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              発行者:
              <input
                type="text"
                name="Issuer"
                value={currentTicket.Issuer}
                onChange={handleInputChange}
                className="border p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              発行場所:
              <input
                type="text"
                name="IssuedPlace"
                value={currentTicket.IssuedPlace}
                onChange={handleInputChange}
                className="border p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              発行時刻:
              <input
                type="text"
                name="IssuedTime"
                value={currentTicket.IssuedTime}
                onChange={handleInputChange}
                className="border p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              使用済み:
              <input
                type="checkbox"
                name="IsUsed"
                checked={currentTicket.IsUsed}
                onChange={(e) => handleInputChange({ target: { name: "IsUsed", value: e.target.checked } })}
                className="border p-2"
              />
            </label>
            <label className="block mb-2">
              チケットタイプ:
              <input
                type="text"
                name="TicketType"
                value={currentTicket.TicketType}
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

export default TicketsPage;
