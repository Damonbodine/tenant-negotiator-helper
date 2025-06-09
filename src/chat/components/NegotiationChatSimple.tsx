import { useState } from "react";

const NegotiationChatSimple = () => {
  console.log("🔍 SIMPLE NegotiationChat component is mounting...");
  
  const [message, setMessage] = useState("");

  const handleClick = () => {
    console.log("🎯 Button clicked successfully!");
    alert("Button works!");
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Negotiation Chat (Simple Test)</h1>
      
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Click
      </button>
      
      <div className="mt-4">
        <input 
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type something..."
          className="border p-2 mr-2"
        />
        <button 
          onClick={() => console.log("Input value:", message)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Log Input
        </button>
      </div>
    </div>
  );
};

export default NegotiationChatSimple;