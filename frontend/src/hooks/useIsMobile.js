import { useState } from "react";

const useIsMobile = () => {
  const [isMobile] = useState(
    () => /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  return isMobile;
};

export default useIsMobile;
