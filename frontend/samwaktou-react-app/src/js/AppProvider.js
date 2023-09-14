import AppBody from './AppBody';
import AudioCreator from './AudioCreator';
import Login from './Login';
import {
    useLocation,
    useSearchParams
} from "react-router-dom";


const UserAppProvider = props => {
    let location = useLocation();
    return (
        <AppBody
            {...props}
            audioFileIdToPlay={ location?.state?.audioFileIdToPlay }
            provider = {"UserAppProvider"}
        />
    );
}

const AdminAppProvider = props => {
    let location = useLocation();
    return (
        <AppBody
            {...props}
            user={ location?.state?.user }
            provider = {"AdminAppProvider"}
        />
    );
}

const AdminLoginProvider = props => {
    return (
        <Login
            {...props}
        />
    );
}

const AudioCreatorProvider = props => {
    let location = useLocation();
    return (
        <AudioCreator
            {...props}
            audioInfos={ location?.state?.audioInfos }
            authors={ location?.state?.authors }
            themes={ location?.state?.themes }
            user={ location?.state?.user  }
        />
    );
}

const AudioLinkHandlerProvider = props => {
    const [searchParams] = useSearchParams();
    let audioFileIdToPlay = searchParams.get("id")?.trim();
    audioFileIdToPlay = audioFileIdToPlay ? audioFileIdToPlay : null;
    return (
        <AppBody
            {...props}
            audioFileIdToPlay = {audioFileIdToPlay}
            provider = {"AudioLinkHandlerProvider"}
        />
    );
}

export {UserAppProvider, AdminAppProvider, AdminLoginProvider, AudioCreatorProvider, AudioLinkHandlerProvider};