import React from 'react';
import { Box, Typography } from '@mui/material';
import Mortagne from "../../styles/allegiances/mortagne-300.png";
import Aurimont from "../../styles/allegiances/aurimont-300.png";
import Koroso from "../../styles/allegiances/koroso-300.png";
import Escape from "../Stats/Escape";
import Grid from '@mui/material/Grid2';

const Allegiance = () => {
    return (
        <>
            <Escape />
            <Grid container spacing={10}
                sx={{
                    height: "100%",
                    padding: "10% 10% 20% 10%",
                }}>
                <Grid size={12}
                    sx={{
                        justifyItems: "center",
                        alignContent: "center",
                    }}>
                    <Typography variant="h3">
                        Choose a theme
                    </Typography>
                </Grid>
                {[
                    { img: Mortagne, name: "Mortagne", title: "the Scholar" },
                    { img: Aurimont, name: "Aurimont", title: "the Eloquent" },
                    { img: Koroso, name: "Koroso", title: "the Wise" },
                ].map(({ img, name, title }) => (
                    <Grid size={4} key={name}
                        sx={{
                            border: "1px solid white",
                            borderRadius: 2,
                            padding: 2,
                            justifyItems: "center",
                            alignContent: "center"
                        }}>
                        <Box
                            component="img"
                            src={img}
                            alt={name}
                            sx={{
                                height: "177px",
                            }}
                        />
                        <Typography variant="h5" sx={{ textAlign: "center" }}>
                            {name}, <br /> {title}
                        </Typography>
                    </Grid>
                ))}
            </Grid >
        </>
    );
};

export default Allegiance;
