import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {UserAppProvider, AdminAppProvider, AdminLoginProvider, AudioCreatorProvider, AudioLinkHandlerProvider} from './js/app-provider.component';
import "./style/audioCards.css";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <UserAppProvider />,
  },
  {
    path: import.meta.env.VITE_ADMIN_PATH,
    element: <AdminAppProvider />,
  },
  {
    path: import.meta.env.VITE_LOGIN_PATH,
    element: <AdminLoginProvider />,
  },
  {
    path: import.meta.env.VITE_CREATE_AUDIO_PATH,
    element: <AudioCreatorProvider />,
  },
  {
    path: import.meta.env.VITE_AUDIO_LINK_PATH,
    element: <AudioLinkHandlerProvider />,
  },
  {
    path: "*",
    element: <UserAppProvider />,
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);