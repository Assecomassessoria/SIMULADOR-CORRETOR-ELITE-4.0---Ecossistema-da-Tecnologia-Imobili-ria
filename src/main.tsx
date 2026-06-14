import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Limpar caches antigos do service worker (remover resquícios do Elfsight)
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      if (name.includes('elfsight') || name.includes('workbox')) {
        caches.delete(name);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
