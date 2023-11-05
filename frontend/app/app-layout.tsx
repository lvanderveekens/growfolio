import Footer from "./footer";
import "./globals.css";
import { AppNavbar } from "./nav/app-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
  );
}
