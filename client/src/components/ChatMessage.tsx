import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GalleryVerticalEnd } from "lucide-react";
import SourceCitation from "./SourceCitation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: Message;
  className?: string;
}

export default function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  if (isUser) {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="bg-[#FFC107] bg-opacity-20 rounded-lg px-4 py-3 shadow max-w-[80%]">
          <p className="text-gray-800">{message.content}</p>
        </div>
      </div>
    );
  }
  
  // Format content with citations
  // This is a simple approach; for more complex formatting, consider using a markdown parser
  const formattedContent = message.content.split('\n').map((line, i) => (
    <p key={i} className={cn("text-gray-800", i !== 0 && "mt-2")}>{line}</p>
  ));
  
  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <Avatar className="bg-[#4A2C82] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
        <AvatarFallback>
          <GalleryVerticalEnd className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-white rounded-lg px-4 py-3 shadow max-w-[80%]">
        {formattedContent}
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4">
            {message.sources.map((source, index) => (
              <SourceCitation key={index} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading indicator for when the assistant is "thinking"
export function LoadingMessage({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <Avatar className="bg-[#4A2C82] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
        <AvatarFallback>
          <GalleryVerticalEnd className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-white rounded-lg px-4 py-3 shadow">
        <div className="flex space-x-2 items-center">
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></div>
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
}
