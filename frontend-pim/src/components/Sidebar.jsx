// 📁 src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { to: "/variants", label: "Variants" },
    { to: "/products", label: "Productes" },
    { to: "/categories", label: "Categories" },
    { to: "/logs", label: "Historial" },
  ];

  return (
    <aside className="w-64 bg-brand text-white flex flex-col h-screen shadow-md">
      <div className="text-xl font-bold px-6 py-5 border-b border-brand-lighter">
        Marc's PIM
      </div>
      <nav className="flex flex-col gap-1 px-3 py-6">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-brand-lighter hover:bg-brand-light hover:text-white"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
