import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {UserApp, AdminApp} from './App';
import {AdminAppProvider, AudioCreatorProvider} from './js/AppProvider';
import reportWebVitals from './reportWebVitals';
import "./style/audioCards.css";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <UserApp />,
  },
  {
    path: process.env.REACT_APP_ADMIN_PATH,
    element: <AdminAppProvider />,
  },
  {
    path: process.env.REACT_APP_LOGIN_PATH,
    element: <AdminApp />,
  },
  {
    path: process.env.REACT_APP_CREATE_AUDIO_PATH,
    element: <AudioCreatorProvider />,
  },
  {
    path: "*",
    element: <UserApp />,
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
