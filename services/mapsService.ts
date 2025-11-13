export const mapsService = {
  /**
   * Geocodes an address string to latitude and longitude using Nominatim.
   * @param address The address to geocode.
   * @returns A promise that resolves to coordinates or null.
   */
  geocode: async (address: string): Promise<{ lat: string; lon: string } | null> => {
    if (!address?.trim()) return null;
    console.log(`Geocoding address: ${address}`);
    try {
      // Prioritize results in Brazil
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`;
      const response = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!response.ok) throw new Error(`Nominatim geocoding failed: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  },

  /**
   * Calculates the driving distance between two addresses using real-world routing data.
   * It first geocodes the addresses and then uses OSRM for routing.
   * @param origin The starting address.
   * @param destination The destination address.
   * @returns A promise that resolves to the distance in kilometers.
   */
  getDistance: async (origin: string, destination: string): Promise<number> => {
    console.log(`Calculating real distance from ${origin} to ${destination}`);
    const [originCoords, destCoords] = await Promise.all([
      mapsService.geocode(origin),
      mapsService.geocode(destination),
    ]);

    if (!originCoords || !destCoords) {
      const missingAddress = !originCoords ? `"${origin}"` : `"${destination}"`;
      throw new Error(`Não foi possível encontrar as coordenadas para o endereço: ${missingAddress}. Por favor, verifique se está correto.`);
    }

    try {
      // Using the public OSRM API for routing with a secure connection
      const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM API request failed: ${response.status}`);
      
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const distanceInMeters = data.routes[0].distance;
        const distanceInKm = distanceInMeters / 1000;
        return parseFloat(distanceInKm.toFixed(1));
      } else {
        throw new Error('Nenhuma rota encontrada entre os pontos. Verifique os endereços.');
      }
    } catch (error) {
      console.error('OSRM route calculation failed:', error);
      throw error;
    }
  },

  /**
   * Calculates the total distance for a multi-leg tow truck route using real routing.
   * @returns A promise that resolves to the total distance in kilometers.
   */
  calculateTotalRouteDistance: async (points: { from: string, to: string }[]): Promise<number> => {
    console.log(`Calculating real multi-leg distance for ${points.length} legs.`);
    let totalDistance = 0;
    // We run sequentially to avoid overwhelming public APIs with simultaneous requests.
    for (const leg of points) {
      if (leg.from && leg.to) {
        totalDistance += await mapsService.getDistance(leg.from, leg.to);
      }
    }
    return parseFloat(totalDistance.toFixed(1));
  },

  /**
   * Performs reverse geocoding using the OpenStreetMap Nominatim API to get a real address.
   * @param lat The latitude.
   * @param lon The longitude.
   * @returns A promise that resolves to a formatted address string.
   */
  reverseGeocode: async (lat: number, lon: number): Promise<string> => {
    console.log(`Performing reverse geocoding for Lat: ${lat}, Lon: ${lon}`);
    try {
      // Request addressdetails for structured data and zoom for precision
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        // Construct a cleaner, more conventional address string.
        const road = addr.road || '';
        const houseNumber = addr.house_number || '';
        const suburb = addr.suburb || '';
        const city = addr.city || addr.town || addr.village || '';
        const state = addr.state || '';

        const line1 = [road, houseNumber].filter(Boolean).join(', ');
        const line2 = [suburb, city, state].filter(Boolean).join(', ');

        if (line1 && line2) {
            return `${line1} - ${line2}`;
        }
        
        // Fallback to the full display name if our custom format fails
        return data.display_name || `Endereço não encontrado`;
      } else if (data && data.error) {
        throw new Error(`Nominatim API error: ${data.error}`);
      } else {
        return data.display_name || 'Endereço não encontrado.';
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)} (Erro de conexão)`;
    }
  },
};