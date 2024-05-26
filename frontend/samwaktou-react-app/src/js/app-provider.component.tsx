import AppBody from './app-body.component';
import AudioCreator from './audio-creator.component';
import Login from './login.component';
import {
    useLocation,
    useSearchParams
} from "react-router-dom";


const UserAppProvider = () => {
    let location = useLocation();
    return (
        <AppBody
            audioFileIdToPlay = { location?.state?.audioFileIdToPlay }
            provider = 'UserAppProvider'
        />
    );
}

const AdminAppProvider = () => {
    let location = useLocation();
    return (
        <AppBody
            user = { location?.state?.user }
            provider = 'AdminAppProvider'
        />
    );
}

const AdminLoginProvider = () => {
    return (
        <Login/>
    );
}

const AudioCreatorProvider = () => {
    let location = useLocation();
    return (
        <AudioCreator
            audioInfos = { location?.state?.audioInfos }
            authors = { location?.state?.authors }
            themes = { location?.state?.themes }
            user = { location?.state?.user  }
        />
    );
}

const AudioLinkHandlerProvider = () => {
    const [searchParams] = useSearchParams();
    let audioFileIdToPlay = searchParams.get("id")?.trim();
    audioFileIdToPlay = audioFileIdToPlay ? audioFileIdToPlay : null;
    return (
        <AppBody
            audioFileIdToPlay = {audioFileIdToPlay}
            provider = 'AudioLinkHandlerProvider'
        />
    );
}

export { UserAppProvider, AdminAppProvider, AdminLoginProvider, AudioCreatorProvider, AudioLinkHandlerProvider };