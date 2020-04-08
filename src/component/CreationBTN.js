import React from "react";
import loading from "../assets/ajax-loader.gif";

const CreationBTN = props => {
    if (props.state === "done") {
        return <div className="done">Done !</div>
    } else if (props.state === "loading") {
        return <div className="loading"><img src={loading} style={{margin: "0 auto",display:"block"}} alt="loading"/></div>
    } else {
        return (
            <button type="button" onClick={props.click} style={{width: "100%"}} className="btn btn-primary">{props.text}</button>)
    }
};

export default CreationBTN;