import { useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const createElement = (id, x1, y1, x2, y2, type) => {
  const roughElement =
    type === "rectangle"
      ? generator.rectangle(x1, y1, x2 - x1, y2 - y1)
      : generator.line(x1, y1, x2, y2);
  return { id, x1, y1, x2, y2, type, roughElement };
};

const distance = (a, b) =>
  Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

const isWithinElements = (x, y, element) => {
  const { type, x1, y1, x2, y2 } = element;

  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < 1;
  }
};

const getElementAtPosition = (x, y, elements) => {
  return elements.find((element) => isWithinElements(x, y, element));
};

const App = () => {
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("selection");
  const [selectedElement, setSelectedElement] = useState(null);

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offsetX, offsetY });
        setAction("moving");
      }
    } else {
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY);
      setElements((prevState) => [...prevState, element]);

      setAction("drawing");
    }
  };
  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      event.target.style.cursor = getElementAtPosition(
        clientX,
        clientY,
        elements
      )
        ? "move"
        : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];

      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, x2, y1, y2, offsetX, offsetY, type } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
    }
  };
  const handleMouseUp = () => {
    setAction("none");
    setSelectedElement(null);
  };

  const updateElement = (id, x1, y1, x2, y2, type) => {
    const updatedElement = createElement(id, x1, y1, x2, y2, type);

    const elementsCopy = [...elements];
    elementsCopy[id] = updatedElement;
    setElements(elementsCopy);
  };

  return (
    <div>
      <div className="radio-toolbar fixed top-2 border px-2 py-2 left-1/2 -translate-x-1/2 border-gray-300 rounded-xl flex items-center gap-4 justify-center shadow-md">
        <div className="flex gap-1">
          <input
            type="radio"
            id="selection"
            checked={tool === "selection"}
            onChange={() => setTool("selection")}
          />
          <label htmlFor="selection" className="text-sm">
            Selection
          </label>
        </div>

        <div className="flex gap-1">
          <input
            type="radio"
            id="line"
            checked={tool === "line"}
            onChange={() => setTool("line")}
          />
          <label htmlFor="line" className="text-sm">
            Line
          </label>
        </div>

        <div className="flex gap-1">
          <input
            type="radio"
            id="rectangle"
            checked={tool === "rectangle"}
            onChange={() => setTool("rectangle")}
          />
          <label htmlFor="rectangle" className="text-sm">
            Rectangle
          </label>
        </div>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
    </div>
  );
};

export default App;
