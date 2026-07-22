import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = App.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/' || !canGoBack) {
        App.minimizeApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, [navigate, location]);
}
