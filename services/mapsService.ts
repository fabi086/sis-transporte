export const mapsService = {
  /**
   * Simulates calculating the distance between two points.
   * Returns a random distance for demonstration purposes.
   * @param origin The starting address.
   * @param destination The destination address.
   * @returns A promise that resolves to the distance in kilometers.
   */
  getDistance: async (origin: string, destination: string): Promise<number> => {
    console.log(`Simulating distance calculation from ${origin} to ${destination}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return a random distance between 10 and 100 km for a single leg
    const distance = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    return distance;
  },

  /**
   * Simulates calculating the total distance for a multi-leg tow truck route.
   * In a real app, this would use the Google Maps API with waypoints.
   * @returns A promise that resolves to the total distance in kilometers.
   */
  calculateTotalRouteDistance: async (points: { from: string, to: string }[]): Promise<number> => {
    console.log(`Simulating multi-leg distance calculation for ${points.length} legs.`);
    let totalDistance = 0;
    for (const leg of points) {
        if (leg.from && leg.to) {
            totalDistance += await mapsService.getDistance(leg.from, leg.to);
        }
    }
    return totalDistance;
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
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9', // Prioritize Brazilian Portuguese
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      } else if (data && data.error) {
        throw new Error(`Nominatim API error: ${data.error}`);
      }
      else {
        throw new Error('Invalid or empty address data from Nominatim API');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates if the API call fails
      return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    }
  },
};
