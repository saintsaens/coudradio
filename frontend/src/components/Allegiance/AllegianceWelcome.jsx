import React from 'react';
import Butler from "./Butler";
import { Link } from "react-router-dom";
import Escape from "../Stats/Escape";
import "../../styles/allegiance.css";

const AllegianceWelcome = () => {
    return (
        <>
            <Escape />
            <div className="butler-container">
                <Butler />
                <div className="butler-text">
                    <p>This path leads to stats.</p>
                    <p>They will be granted by your liege, in exchange for a tribute.</p>
                    <p>5€/month.</p>
                </div>
                <div className="butler-buttons">
                    <Link to="/">
                        <button className="butler-button">
                            <p className="butler-button-text">Leave</p>
                        </button>
                    </Link>
                    <Link to="/remember">
                        <button className="butler-button">
                            <p className="butler-button-text">Continue</p>
                        </button>
                    </Link>

                </div>
            </div>
        </>
    );
};

export default AllegianceWelcome;
