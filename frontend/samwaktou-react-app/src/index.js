import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {UserAppProvider, AdminAppProvider, AdminLoginProvider, AudioCreatorProvider, AudioLinkHandlerProvider} from './js/AppProvider';
import reportWebVitals from './reportWebVitals';
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
    path: process.env.REACT_APP_ADMIN_PATH,
    element: <AdminAppProvider />,
  },
  {
    path: process.env.REACT_APP_LOGIN_PATH,
    element: <AdminLoginProvider />,
  },
  {
    path: process.env.REACT_APP_CREATE_AUDIO_PATH,
    element: <AudioCreatorProvider />,
  },
  {
    path: process.env.REACT_APP_AUDIO_LINK_PATH,
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


  

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
