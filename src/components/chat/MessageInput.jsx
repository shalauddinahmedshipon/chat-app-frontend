import { useState } from "react";
import useChatStore from "../../store/chatStore";

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null); // selected file
  const [preview, setPreview] = useState(null); // preview URL

  const sendMessage = useChatStore((state) => state.sendMessage);

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);

    // preview if image
    if (selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return; // require either

    // Directly send to real conversation
    await sendMessage(conversationId, text, file);

    // Clear inputs
    setText("");
    setFile(null);
    setPreview(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <form onSubmit={handleSend} className="flex flex-col gap-2">
      {/* File preview */}
      {preview && (
        <div className="relative">
          <img src={preview} alt="preview" className="max-h-32 rounded" />
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input + file picker */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded cursor-pointer">
          📎
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </form>
  );
}
