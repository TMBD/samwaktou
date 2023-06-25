import './App.css';
import AppBody from './js/AppBody';
import Login from './js/Login';

function UserApp() {
    return (
        <div className="App">
            <AppBody/>
        </div>
    );
}

function AdminApp() {
    return (
        <div className="App">
            <Login/>
        </div>
    );
}

//Netlify pour hebergement
export {
    UserApp,
    AdminApp
};
