import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useThemeStore } from '../store';

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <RouterProvider router={router} />;
}
