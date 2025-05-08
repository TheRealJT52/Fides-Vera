import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  isDisabled = false, 
  className
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isDisabled) return;
    
    onSendMessage(message);
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("border-t border-gray-200 bg-white px-4 py-3", className)}>
      <div className="max-w-4xl mx-auto">
        <form className="flex items-end gap-2" onSubmit={handleSubmit}>
          <div className="flex-1 bg-gray-100 rounded-lg">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Catholic teachings..."
              className="w-full bg-transparent p-3 resize-none focus:outline-none text-gray-800 min-h-[52px]"
              rows={1}
              disabled={isDisabled}
            />
          </div>
          <Button 
            type="submit" 
            disabled={!message.trim() || isDisabled}
            className="bg-[#4A2C82] text-white p-3 rounded-lg hover:bg-purple-800 transition duration-200 flex-shrink-0 h-[52px] w-[52px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <div className="text-xs text-gray-500 mt-1 px-2">
          Hi! I'm Fide, a Retrieval-Augmented Generation (RAG) Large Language Model (LLM). I can generate responses based on the information I have been trained on. I cannot browse the internet or access real-time information. My answers are not meant to be authoritative; please consult a priest or other qualified Catholic authority to verify answers.
        </div>
      </div>
    </div>
  );
}
