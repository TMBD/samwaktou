export default function AudioKeywords(props){
    return  <div className="popupAudioKeywords">
                <u>Mots clés</u> : <i>{props.keywords.split(" ").map(word => "#"+word).join(" ")}</i>
            </div>
}