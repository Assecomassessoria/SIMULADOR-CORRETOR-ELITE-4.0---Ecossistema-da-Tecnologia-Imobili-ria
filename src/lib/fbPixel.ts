// Facebook Pixel event tracking helper
// Pixel base instalado no index.html (ID: 1442133797399012)

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type FbStandardEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Purchase'
  | 'InitiateCheckout'
  | 'Search'
  | 'ViewContent'
  | 'Contact';

const safeFbq = (
  type: 'track' | 'trackCustom',
  event: string,
  params?: Record<string, unknown>
) => {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    if (params) window.fbq(type, event, params);
    else window.fbq(type, event);
  } catch (e) {
    console.warn('[fbPixel] tracking failed', e);
  }
};

export const trackEvent = (event: FbStandardEvent, params?: Record<string, unknown>) =>
  safeFbq('track', event, params);

export const trackCustom = (event: string, params?: Record<string, unknown>) =>
  safeFbq('trackCustom', event, params);

// Eventos específicos do app
export const trackLogin = (method: string = 'standard') =>
  safeFbq('trackCustom', 'EliteLogin', { method });

export const trackSimulacao = (params?: {
  valorImovel?: number;
  modalidade?: string;
  tipo?: string;
}) => safeFbq('trackCustom', 'EliteSimulacao', params || {});

export const trackVendaCriada = (params?: {
  valorVenda?: number;
  valorNormal?: number;
  desconto?: number;
  modalidade?: string;
}) => {
  // Standard "Lead" + custom "EliteVenda" para máxima cobertura no Ads Manager
  safeFbq('track', 'Lead', {
    value: params?.valorVenda,
    currency: 'BRL',
    content_category: 'Venda',
  });
  safeFbq('trackCustom', 'EliteVenda', params || {});
};
