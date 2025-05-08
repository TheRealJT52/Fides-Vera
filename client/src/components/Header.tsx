import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd, Menu } from "lucide-react";

interface HeaderProps {
  onNewChat: () => void;
  toggleSidebar: () => void;
}

export default function Header({ onNewChat, toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-[#4A2C82] text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <GalleryVerticalEnd className="text-[#FFC107]" size={24} />
          <h1 className="font-['Cinzel'] text-2xl font-bold">Fides</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="text-sm px-3 py-1 rounded bg-[#FFC107] text-[#4A2C82] hover:bg-yellow-400 transition duration-200 font-medium"
            onClick={onNewChat}
          >
            New Chat
          </Button>
          <Button 
            variant="ghost" 
            className="p-1 rounded-full hover:bg-purple-700 transition duration-200"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
