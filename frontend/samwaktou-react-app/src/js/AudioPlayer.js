import ReactPlayer from 'react-player/lazy'

function PlayAudio(uri){
    return <ReactPlayer url='http://localhost:8080/audios/file/5f91d5c1545fd5148c8652a1.mp3' playing={true} />
    console.log(uri);
}

export default PlayAudio;