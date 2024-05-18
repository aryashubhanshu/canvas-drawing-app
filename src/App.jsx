import { useLayoutEffect } from "react";

const App = () => {
  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
  }, []);

  return (
    <canvas
      id="canvas"
      width={window.innerWidth}
      height={window.innerHeight}
    ></canvas>
  );
};

export default App;
