import React from 'react';
import 'tachyons';


function ImageButton(props) {
    let {icon, onClicked, width, height} = props;

    // const buttonStyle = {
    //     backgroundIma
    // }
    return (
        <button style={{
            width: width,
            height: height,
            backgroundImage: icon,
            backgroundSize: "contain"
        }} onClick={onClicked}/>
    )
}

export default ImageButton;
