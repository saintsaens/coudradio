import React from 'react';
import Link from '@mui/joy/Link';
import Box from "@mui/joy/Box";

const About = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 10,
        right: 10,
      }}
    >
      <Link
        href="https://flavienrobert.notion.site/About-Coudradio-18086814da2780f8aa1bd29d6f9ac6b2"
        color="neutral"
        target="_blank"
        rel="noopener noreferrer"
      >
        About →
      </Link>
    </Box>
  );
};

export default About;
