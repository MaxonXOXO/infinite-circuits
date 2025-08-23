import React from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import Footer from "./components/Footer";
import "./styles.css";

export default function App() {
  return (
    <div className="layout">
      <Header />
      <Sidebar />
      <main className="main">
        <Canvas />
      </main>
      <Footer />
    </div>
  );
}