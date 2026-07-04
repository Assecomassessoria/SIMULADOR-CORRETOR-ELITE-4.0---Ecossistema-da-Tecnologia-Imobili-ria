export interface TenantConfig {
  slug: string;
  name: string;
  logoUrl?: string;
  primaryColor: string; // e.g. "#1e3a8a"
  secondaryColor: string; // e.g. "#f59e0b"
  domain?: string;
  creci?: string;
  phone?: string;
}

// Default standard tenants for showcase and customization
export const DEFAULT_TENANTS: TenantConfig[] = [
  {
    slug: "diferencial",
    name: "Diferencial Imobiliária",
    primaryColor: "#059669", // Emerald Green
    secondaryColor: "#D97706", // Amber / Warm Gold
    creci: "CRECI 12345-J",
    phone: "(11) 99999-8888",
  },
  {
    slug: "direcional",
    name: "Direcional Engenharia",
    primaryColor: "#1E3A8A", // Royal Navy Blue
    secondaryColor: "#3B82F6", // Light Blue
    creci: "CRECI 98765-J",
    phone: "(11) 97777-6666",
  },
  {
    slug: "mrv",
    name: "MRV Engenharia",
    primaryColor: "#15803D", // MRV Green
    secondaryColor: "#EA580C", // Bright Orange
    creci: "CRECI 54321-J",
    phone: "(11) 98888-5555",
  },
  {
    slug: "lopes",
    name: "Lopes Consultoria",
    primaryColor: "#B91C1C", // Lopes Crimson Red
    secondaryColor: "#6B7280", // Slate Silver
    creci: "CRECI 24680-J",
    phone: "(11) 96666-3333",
  }
];

export function hexToHsl(hex: string): { h: number; s: number; l: number; str: string } {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    str: `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  };
}

export function getStoredTenants(): TenantConfig[] {
  try {
    const raw = localStorage.getItem("custom_tenants");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [...DEFAULT_TENANTS, ...parsed];
      }
    }
  } catch (e) {
    console.error("Error reading custom tenants", e);
  }
  return DEFAULT_TENANTS;
}

export function saveCustomTenant(tenant: TenantConfig) {
  try {
    const raw = localStorage.getItem("custom_tenants");
    let list: TenantConfig[] = [];
    if (raw) {
      list = JSON.parse(raw);
    }
    // Remove existing if any
    list = list.filter(t => t.slug !== tenant.slug);
    list.push(tenant);
    localStorage.setItem("custom_tenants", JSON.stringify(list));
  } catch (e) {
    console.error("Error saving custom tenant", e);
  }
}

export function getActiveTenant(): TenantConfig | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  
  // Subdomain detection (e.g. diferencial.simuladorcorretorelite.com.br)
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    const reserved = ["www", "simuladorcorretorelite", "ais-dev", "ais-pre", "localhost", "127"];
    if (!reserved.some(r => subdomain.includes(r))) {
      const tenants = getStoredTenants();
      const match = tenants.find(t => t.slug.toLowerCase() === subdomain);
      if (match) return match;
    }
  }

  // Fallback to preview selector for development / sandbox simulation
  const previewSlug = localStorage.getItem("tenant_preview_slug");
  if (previewSlug) {
    const tenants = getStoredTenants();
    const match = tenants.find(t => t.slug.toLowerCase() === previewSlug.toLowerCase());
    if (match) return match;
  }

  return null;
}

export function applyTenantTheme(tenant: TenantConfig | null) {
  if (typeof document === "undefined") return;

  if (!tenant) {
    // Reset to default Elite style
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-foreground");
    document.documentElement.style.removeProperty("--secondary");
    document.documentElement.style.removeProperty("--secondary-foreground");
    document.documentElement.style.removeProperty("--navy");
    document.documentElement.style.removeProperty("--gold");
    document.documentElement.style.removeProperty("--gold-bright");
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--ring");
    document.documentElement.removeAttribute("data-tenant");
    return;
  }

  // Convert custom hex colors to Tailwind HSL format
  const priHsl = hexToHsl(tenant.primaryColor);
  const secHsl = hexToHsl(tenant.secondaryColor);

  // Set the CSS variables dynamically
  document.documentElement.style.setProperty("--primary", priHsl.str);
  document.documentElement.style.setProperty("--navy", priHsl.str);
  
  // Set light text for primary if background is dark, and vice versa
  const priForeground = priHsl.l < 50 ? "0 0% 100%" : "220 70% 10%";
  document.documentElement.style.setProperty("--primary-foreground", priForeground);

  document.documentElement.style.setProperty("--secondary", secHsl.str);
  document.documentElement.style.setProperty("--gold", secHsl.str);
  document.documentElement.style.setProperty("--gold-bright", secHsl.str);
  document.documentElement.style.setProperty("--accent", secHsl.str);
  document.documentElement.style.setProperty("--ring", secHsl.str);

  const secForeground = secHsl.l < 50 ? "0 0% 100%" : "220 70% 10%";
  document.documentElement.style.setProperty("--secondary-foreground", secForeground);

  document.documentElement.setAttribute("data-tenant", tenant.slug);
}
