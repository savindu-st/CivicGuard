/**
 * CivicGuard Tactical Map Basemap Configuration
 * Provides seamless support for:
 * 1. CARTO Basemaps with API key (VITE_CARTO_API_KEY)
 * 2. Custom tile provider URL (VITE_MAP_TILE_URL)
 * 3. Mapbox Dark v11 (VITE_MAPBOX_TOKEN)
 * 4. Stadia Maps Alidade Smooth Dark (VITE_STADIA_API_KEY)
 * 5. Free Esri Dark Gray Canvas (Default: no key required, zero watermark)
 */

export interface MapTileConfig {
  url: string;
  attribution: string;
  maxZoom?: number;
}

export const getMapTileConfig = (): MapTileConfig => {
  const customTileUrl = import.meta.env.VITE_MAP_TILE_URL;
  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
  const stadiaApiKey = import.meta.env.VITE_STADIA_API_KEY;
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // 1. Custom URL override
  if (customTileUrl) {
    return {
      url: customTileUrl,
      attribution: import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; Map Providers',
      maxZoom: 19,
    };
  }

  // 2. Mapbox Dark
  if (mapboxToken) {
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
      attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    };
  }

  // 3. Stadia Maps Dark
  if (stadiaApiKey) {
    return {
      url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaApiKey}`,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>',
      maxZoom: 20,
    };
  }

  // 4. CARTO with registered API key (Light Positron)
  if (cartoApiKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${cartoApiKey}`,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    };
  }

  // 5. Default Fallback: Esri World Light Gray Canvas
  // Clean, high-clarity light aesthetic, zero watermark, completely free with no API key required
  return {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  };
};
