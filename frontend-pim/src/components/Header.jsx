import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-brand-lighter px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-xl font-semibold text-brand">Gestió de productes</h1>
      <Link to="/login" className="bg-accent hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium">
        Tancar sessió
      </Link>
    </header>
  );
}
