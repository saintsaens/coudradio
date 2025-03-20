import React from 'react';
import Butler from "./Butler";
import { Link } from "react-router-dom";
import Escape from "../Stats/Escape";

const AllegianceRemember = () => {
    return (
        <>
            <Escape />
            <div className="butler-container">
                <Butler />
                <div className="butler-text">
                    <p>Remember.</p>
                    <p>All they’re offering is stats.</p>
                    <p>Nothing more.</p>
                </div>
                <div className="butler-buttons">
                    <Link to="/">
                        <button className="butler-button">
                            <p className="butler-button-text">Leave</p>
                        </button>
                    </Link>
                    <Link to="/allegiance">
                        <button className="butler-button">
                            <p className="butler-button-text">Pay tribute →</p>
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default AllegianceRemember;