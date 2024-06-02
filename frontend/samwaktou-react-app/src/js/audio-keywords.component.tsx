import React from "react";

type AudioKeywordsProps = {
    keywords: string;
}

export const AudioKeywords: React.FC<AudioKeywordsProps> = (props: AudioKeywordsProps) => {
    return  <div className="popupAudioKeywords">
                <u>Mots clés</u> : <i>{props.keywords.split(" ").map(word => "#"+word).join(" ")}</i>
            </div>
}