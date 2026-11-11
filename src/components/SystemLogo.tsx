import React, { useState } from "react";

export const OFFICIAL_LOGO_LOCAL = "/logo-elite.jpg";
export const OFFICIAL_LOGO_URL = "https://pub-a3cfd193eb6748ec96b423de3caf804f.r2.dev/logo-elite.jpg";
export const OFFICIAL_LOGO_PWA = "/pwa-icon-192.png";

interface SystemLogoProps {
  className?: string;
  alt?: string;
  onClick?: () => void;
  title?: string;
}

export const SystemLogo: React.FC<SystemLogoProps> = ({
  className = "w-11 h-11 object-cover rounded-lg flex-shrink-0 border border-gold/40 shadow-md shadow-gold/10",
  alt = "Logo Oficial Simulador Corretor de Elite 4.0",
  onClick,
  title,
}) => {
  const [src, setSrc] = useState<string>(OFFICIAL_LOGO_LOCAL);

  const handleError = () => {
    if (src === OFFICIAL_LOGO_LOCAL) {
      setSrc(OFFICIAL_LOGO_URL);
    } else if (src === OFFICIAL_LOGO_URL) {
      setSrc(OFFICIAL_LOGO_PWA);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      onClick={onClick}
      onError={handleError}
      draggable={false}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};

export default SystemLogo;
