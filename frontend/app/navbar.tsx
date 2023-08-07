import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="mb-8 py-4 b-4 text-white bg-black">
      <div className="container mx-auto text-xl flex justify-between align-center">
        <div className="text-4xl font-bold self-center">
          <Link href="/">growfolio</Link>
        </div>
      </div>
    </nav>
  );
}