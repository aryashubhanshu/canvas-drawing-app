import { IoIosClose } from "react-icons/io";

const Help = ({ setShowModal }) => {
  return (
    <div className="absolute top-0 left-0 z-30 w-full h-screen bg-opacity-50 flex items-center justify-center flex-col bg-gray-300">
      <div className="overflow-hidden overflow-y-auto  flex flex-col w-1/2 h-3/4 max-md:w-2/3 max-sm:w-full max-sm:h-screen bg-white shadow-md rounded-xl px-10 py-6">
        <div className="flex items-center justify-between w-full border-b py-4">
          <div className="text-2xl font-bold">Help</div>
          <button onClick={() => setShowModal(false)}>
            <IoIosClose size={32} />
          </button>
        </div>
        <div className="font-bold py-4 text-lg">Keyboard Shortcuts</div>
        <div className="font-bold text-md">Tools</div>
        <div className="rounded-md flex flex-col gap-2 border border-gray-300 p-2 my-2">
          <div className="flex items-center justify-between text-sm">
            <div>Panning</div>
            <div className="flex gap-1 items-center">
              <div className="shortcut">Space</div>
              <div className="shortcut">Drag</div>
              or
              <div className="shortcut">Wheel</div>
              <div className="shortcut">Drag</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Zoom</div>
            <div className="flex gap-1 items-center">
              <div className="shortcut">Cmd</div>
              <div className="shortcut">Wheel</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Selection</div>
            <div className="flex gap-1">
              <div className="shortcut">1</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Pencil</div>
            <div className="flex gap-1">
              <div className="shortcut">2</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Line</div>
            <div className="flex gap-1">
              <div className="shortcut">3</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Rectangle</div>
            <div className="flex gap-1">
              <div className="shortcut">4</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Text</div>
            <div className="flex gap-1">
              <div className="shortcut">5</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Undo</div>
            <div className="flex gap-1">
              <div className="shortcut">Cmd</div>
              <div className="shortcut">Z</div>
            </div>
          </div>
          <hr className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <div>Redo</div>
            <div className="flex gap-1">
              <div className="shortcut">Cmd</div>
              <div className="shortcut">Shift</div>
              <div className="shortcut">Z</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
