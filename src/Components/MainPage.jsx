import { useEffect, useState } from "react";
import UserInfo from "./UserInfo";

const MainPage = () => {
  const [usedGroups, setUsedGroups] = useState(0);
  const [unusedGroups, setUnusedGroups] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [membersByDate, setMembersByDate] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

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
        const totalMembersCount = data.reduce(
          (sum, group) => sum + parseInt(group.MemberCount),
          0
        );
        setTotalMembers(totalMembersCount);
        const unUsedCount = data
          .filter((group) => group.EntranceTime === "")
          .reduce((sum, group) => sum + Number(group.MemberCount || 0), 0);
        setUnusedGroups(unUsedCount);
        setUsedGroups(totalMembersCount - unUsedCount);

        const membersByDate = data.reduce((acc, group) => {
          const date = group.EntranceTime.split("T")[0];
          if(group.EntranceTime === "") {
            date = "未入場";
          }
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date] += parseInt(group.MemberCount);
          return acc;
        }, {});
        setMembersByDate(membersByDate);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setIsError(true);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchGroups(), fetchGroups()]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

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
    return <div>Error loading data.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            蒼翔祭ダッシュボード
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 bg-white">
              <div className="p-4 bg-yellow-100 rounded-lg text-center mb-8">
                <h2 className="text-2xl font-bold">入場者総計</h2>
                <p className="text-4xl">{totalMembers}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-100 rounded-lg text-center">
                  <h2 className="text-2xl font-bold">入場済み入場者数</h2>
                  <p className="text-4xl">{usedGroups}</p>
                </div>
                <div className="p-4 bg-red-100 rounded-lg text-center">
                  <h2 className="text-2xl font-bold">未入場入場者数</h2>
                  <p className="text-4xl">{unusedGroups}</p>
                </div>
              </div>
            </div>
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 bg-white mt-8">
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">日付ごとの入場者数</h2>
                <table className="min-w-full bg-white border-collapse border border-gray-200">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-gray-200 text-center">
                        日付
                      </th>
                      <th className="py-2 px-4 border border-gray-200 text-center">
                        入場者数
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(membersByDate).map(([date, count]) => (
                      <tr key={date}>
                        <td className="py-2 px-4 border border-gray-200 text-center">
                          {date}
                        </td>
                        <td className="py-2 px-4 border border-gray-200 text-center">
                          {count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <UserInfo />
      </main>
    </div>
  );
};

export default MainPage;
