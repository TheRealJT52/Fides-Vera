import { Chat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { documentCategories } from "@/data/catholicTexts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, BookText } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  chats?: Chat[];
  currentChatId?: number;
  onSelectChat: (id: number) => void;
  className?: string;
}

export default function Sidebar({
  isOpen,
  chats = [],
  currentChatId,
  onSelectChat,
  className,
}: SidebarProps) {
  return (
    <aside 
      className={cn(
        "w-64 bg-white shadow-md transition-all duration-300 ease-in-out",
        !isOpen && "hidden md:block",
        className
      )}
    >
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="font-['Cinzel'] text-[#4A2C82] text-lg font-semibold mb-4">Saved Chats</h2>
          
          {chats.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No saved chats yet</p>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div 
                  key={chat.id}
                  className={cn(
                    "mb-2 p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center",
                    chat.id === currentChatId && "bg-gray-100"
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare className="text-gray-500 mr-2 h-4 w-4" />
                  <span className="text-sm truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          )}
          
          <Separator className="my-4 border-gray-200" />
          
          <h2 className="font-['Cinzel'] text-[#4A2C82] text-lg font-semibold mb-4">Knowledge Base</h2>
          <div className="space-y-2">
            {documentCategories.map((category) => (
              <div 
                key={category.id}
                className="p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center"
              >
                <BookText className="text-gray-500 mr-2 h-4 w-4" />
                <span className="text-sm">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
