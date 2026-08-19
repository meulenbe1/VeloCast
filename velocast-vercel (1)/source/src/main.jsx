import React from "react";
import { createRoot } from "react-dom/client";
import VeloCast from "./VeloCast.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VeloCast />
  </React.StrictMode>
);
