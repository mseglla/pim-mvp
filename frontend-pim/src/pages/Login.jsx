export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-semibold mb-4">Inicia sessió</h2>
        <input type="email" placeholder="Email" className="w-full mb-3 p-2 border rounded" />
        <input type="password" placeholder="Contrasenya" className="w-full mb-4 p-2 border rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
}
