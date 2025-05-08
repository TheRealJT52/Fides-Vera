import { GalleryVerticalEnd } from "lucide-react";

interface HeaderProps {
  onNewChat: () => void;
  toggleSidebar: () => void;
}

export default function Header({ onNewChat, toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-[#4A2C82] text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <GalleryVerticalEnd className="text-[#FFC107]" size={24} />
          <h1 className="font-['Cinzel'] text-2xl font-bold">Fides</h1>
          <span className="text-sm ml-2 text-gray-200">Catholic Teaching Assistant</span>
        </div>
      </div>
    </header>
  );
}
