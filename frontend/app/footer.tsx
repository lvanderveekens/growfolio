"use client";

import "chartjs-adapter-moment";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-black text-white py-4 text-center">
      © {currentYear} Growfolio
    </div>
  );
}
