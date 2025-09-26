import { useEffect, useRef } from "react";
import useChatStore from "../../store/chatStore";
import useUserStore from "../../store/userStore";
import MessageInput from "./MessageInput";

export default function ChatBox({ conversation }) {
  const { messages, fetchMessages } = useChatStore();
  const user = useUserStore((s) => s.user);

  const messagesEndRef = useRef(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation?.id) fetchMessages(conversation.id);
  }, [conversation, fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a conversation to start chatting
      </div>
    );
  }

  // Determine receiver name
  const receiver =
    conversation?.userId === user?.id
      ? conversation?.provider?.providerProfile?.bussinessName || "Chat"
      : conversation?.user?.name || "Chat";

  return (
    <div className="flex flex-col h-full">
      {/* Top Navbar */}
      <div className="sticky flex justify-between top-0 z-10 p-4 border-b bg-gray-100 font-semibold text-lg shadow-sm">
        <h1>{receiver}</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center">No messages yet</p>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id;
          const isImage =
            msg.fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileUrl);

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-xs shadow ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-black rounded-bl-none"
                }`}
              >
                {msg.content && <p>{msg.content}</p>}

                {msg.fileUrl && (
                  <div className="mt-2">
                    {msg.fileUrl.startsWith("data:") || isImage ? (
                      <img
                        src={msg.fileUrl}
                        alt="attachment"
                        className="max-w-full rounded"
                      />
                    ) : (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline"
                      >
                        📎 Download file
                      </a>
                    )}
                  </div>
                )}

                <div
                  className={`text-xs mt-1 ${isMine ? "text-gray-200" : "text-gray-500"}`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <MessageInput conversationId={conversation.id} />
      </div>
    </div>
  );
}
