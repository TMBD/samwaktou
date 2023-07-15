import AppBody from './AppBody';
import AudioCreator from './AudioCreator';
import {
    useLocation
  } from "react-router-dom";
  
  const AdminAppProvider = props => {
    let location = useLocation();
    return (
        <AppBody
            {...props}
            user={ location?.state?.user }
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

export {AdminAppProvider, AudioCreatorProvider};