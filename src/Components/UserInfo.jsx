import Cookies from "js-cookie";

const UserInfo = () => {
  const email = Cookies.get("cfEmail");
  const staffName = Cookies.get("staffName");
  const authority = Cookies.get("staffAuthority");
  const staffDepartment = Cookies.get("staffDepartment");

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg p-6 rounded mt-6">
      <h2 className="text-2xl font-bold mb-4">ユーザー情報</h2>
      <div className="space-y-3">
        <div className="flex">
          <span className="w-32 font-semibold">メールアドレス:</span>
          <span>{email}</span>
        </div>
        <div className="flex">
          <span className="w-32 font-semibold">氏名:</span>
          <span>{staffName}</span>
        </div>
        <div className="flex">
          <span className="w-32 font-semibold">権限:</span>
          <span>{authority}</span>
        </div>
        <div className="flex">
          <span className="w-32 font-semibold">部署:</span>
          <span>{staffDepartment}</span>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;