import { useState, useEffect } from 'react';

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  data: GeolocationPosition | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    data: null,
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setState(prevState => ({ ...prevState, error: { message: "Geolocation is not supported by your browser." } as GeolocationPositionError }));
      return;
    }

    setState({ loading: true, error: null, data: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ loading: false, error: null, data: position });
      },
      (error) => {
        setState({ loading: false, error, data: null });
      },
      { enableHighAccuracy: true } // Request higher accuracy from the device
    );
  };

  // Note: We don't fetch on mount automatically to give user control.
  // The component using this hook should call `getLocation`.
  
  return { ...state, getLocation };
};