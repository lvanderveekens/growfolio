import Footer from "./footer";
import "./globals.css";
import { AppNavbar } from "./nav/app-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      {children}
      <Footer />
    </>
  );
}
