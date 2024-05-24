import getStroke from "perfect-freehand";
import { useEffect, useLayoutEffect, useState } from "react";
import { AiOutlineLine } from "react-icons/ai";
import { BiSolidPencil } from "react-icons/bi";
import { FaRedo, FaSquareFull, FaUndo } from "react-icons/fa";
import { RiCursorFill } from "react-icons/ri";

import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const createElement = (id, x1, y1, x2, y2, type) => {
  switch (type) {
    case "line": {
      const roughElement = generator.line(x1, y1, x2, y2);
      return { id, x1, y1, x2, y2, type, roughElement };
    }
    case "rectangle": {
      const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
      return { id, x1, y1, x2, y2, type, roughElement };
    }
    case "pencil":
      return { id, type, points: [{ x: x1, y: y1 }] };
    default:
      throw new Error("Invalid type");
  }
};

const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

const drawElement = (roughCanvas, context, element) => {
  switch (element.type) {
    case "line":
    case "rectangle":
      roughCanvas.draw(element.roughElement);
      break;
    case "pencil": {
      const stroke = getSvgPathFromStroke(
        getStroke(element.points, { size: 5, smoothing: 1 })
      );
      context.fill(new Path2D(stroke));
      break;
    }
    default:
      throw new Error("Invalid type");
  }
};

const distance = (a, b) =>
  Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

const nearPoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const onLine = (x1, y1, x2, y2, x, y, maxOffset = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxOffset ? "inside" : null;
};

const positionWithinElements = (x, y, element) => {
  const { type, x1, y1, x2, y2 } = element;

  switch (type) {
    case "line": {
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      const on = onLine(x1, y1, x2, y2, x, y);
      return start || end || on;
    }
    case "rectangle": {
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    }
    case "pencil": {
      const betweenAnyPoint = element.points.some((point, ind) => {
        const nextPoint = element.points[ind + 1];
        if (!nextPoint) return false;
        return (
          onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null
        );
      });
      return betweenAnyPoint ? "inside" : null;
    }
    default:
      throw new Error("Invalid type");
  }
};

const getElementAtPosition = (x, y, elements) => {
  return elements
    .map((element) => ({
      ...element,
      position: positionWithinElements(x, y, element),
    }))
    .find((element) => element.position !== null);
};

const adjustmentRequired = (type) => ["rectangle", "line"].includes(type);

const adjustElementCoordinates = (element) => {
  const { x1, y1, x2, y2, type } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 };
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
  }
};

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null;
  }
};

const cursorForPosition = (position) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const useHistory = (initalState) => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initalState]);

  const setState = (action, overwrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex((prevIndex) => prevIndex + 1);
    }
  };

  const undo = () => {
    index > 0 && setIndex((prevIndex) => prevIndex - 1);
  };

  const redo = () => {
    index < history.length - 1 && setIndex((prevIndex) => prevIndex + 1);
  };

  return [history[index], setState, undo, redo];
};

const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("pencil");
  const [selectedElement, setSelectedElement] = useState(null);

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => drawElement(roughCanvas, context, element));
  }, [elements]);

  useEffect(() => {
    const undoRedoFunction = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener("keydown", undoRedoFunction);

    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        if (element.type === "pencil") {
          const xOffsets = element.points.map((point) => clientX - point.x);
          const yOffsets = element.points.map((point) => clientY - point.y);
          setSelectedElement({ ...element, xOffsets, yOffsets });
        } else {
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
          setElements((prevState) => prevState);
        }

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resize");
        }
      }
    } else {
      const id = elements.length;
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setElements((prevState) => [...prevState, element]);

      setSelectedElement(element);
      setAction("drawing");
    }
  };
  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element
        ? cursorForPosition(element.position)
        : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];

      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      if (selectedElement.type === "pencil") {
        const { id } = selectedElement;
        const newPoints = selectedElement.points.map((_, ind) => {
          return {
            x: clientX - selectedElement.xOffsets[ind],
            y: clientY - selectedElement.yOffsets[ind],
          };
        });

        const elementsCopy = [...elements];
        elementsCopy[id] = {
          ...elementsCopy[id],
          points: newPoints,
        };
        setElements(elementsCopy, true);
      } else {
        const { id, x1, x2, y1, y2, offsetX, offsetY, type } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - offsetX;
        const newY1 = clientY - offsetY;
        updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
      }
    } else if (action === "resize") {
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position,
        coordinates
      );
      updateElement(id, x1, y1, x2, y2, type);
    }
  };
  const handleMouseUp = () => {
    if (selectedElement) {
      const index = selectedElement.id;
      const { id, type } = elements[index];

      if (
        (action === "drawing" || action === "resize") &&
        adjustmentRequired(type)
      ) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
        updateElement(id, x1, y1, x2, y2, type);
      }
    }

    setAction("none");
    setSelectedElement(null);
  };

  const updateElement = (id, x1, y1, x2, y2, type) => {
    const elementsCopy = [...elements];

    switch (type) {
      case "line":
      case "rectangle":
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
        break;
      case "pencil":
        elementsCopy[id].points = [
          ...elementsCopy[id].points,
          { x: x2, y: y2 },
        ];
        break;
      default:
        throw new Error("Invalid type");
    }

    setElements(elementsCopy, true);
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
          <label
            htmlFor="selection"
            className="w-8 h-8 flex items-center justify-center"
          >
            <RiCursorFill className="w-3.5 h-5" />
          </label>
        </div>

        <div className="flex gap-1">
          <input
            type="radio"
            id="pencil"
            checked={tool === "pencil"}
            onChange={() => setTool("pencil")}
          />
          <label
            htmlFor="pencil"
            className="w-8 h-8 flex items-center justify-center"
          >
            <BiSolidPencil className="h-5 w-3.5" />
          </label>
        </div>

        <div className="flex gap-1">
          <input
            type="radio"
            id="line"
            checked={tool === "line"}
            onChange={() => setTool("line")}
          />
          <label
            htmlFor="line"
            className="w-8 h-8 flex items-center justify-center"
          >
            <AiOutlineLine className="h-5 w-3.5 -rotate-45" />
          </label>
        </div>

        <div className="flex gap-1">
          <input
            type="radio"
            id="rectangle"
            checked={tool === "rectangle"}
            onChange={() => setTool("rectangle")}
          />
          <label
            htmlFor="rectangle"
            className="w-8 h-8 flex items-center justify-center"
          >
            <FaSquareFull className="w-3 h-5" />
          </label>
        </div>
      </div>
      <div className="fixed bottom-2 px-2 py-2 flex items-center justify-center gap-4 left-1/2 -translate-x-1/2 border-gray-300 rounded-xl shadow-md">
        <button onClick={undo}>
          <FaUndo />
        </button>
        <button onClick={redo}>
          <FaRedo />
        </button>
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
