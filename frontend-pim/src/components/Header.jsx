import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="w-full bg-white border-b border-brand-lighter px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-xl font-semibold text-brand">Gestió de productes</h1>
      <button
        onClick={handleLogout}
        className="bg-accent hover:bg-brand text-white px-4 py-2 rounded-md font-medium"
      >
        Tancar sessió
      </button>
    </header>
  );
}
