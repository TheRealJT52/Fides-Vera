import { SourceReference } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BookText, ChevronDown, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SourcePanelProps {
  sources?: SourceReference[];
  isVisible: boolean;
  className?: string;
}

export default function SourcePanel({ 
  sources = [], 
  isVisible, 
  className 
}: SourcePanelProps) {
  if (!isVisible) return null;
  
  return (
    <aside 
      className={cn(
        "w-80 hidden xl:block bg-white shadow-md overflow-y-auto border-l border-gray-200",
        className
      )}
    >
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="font-['Cinzel'] text-[#4A2C82] text-lg font-semibold mb-4">Related Sources</h2>
          
          {sources.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No sources available for this conversation yet.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((source, index) => (
                <SourceCard key={index} source={source} />
              ))}
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-medium text-sm mb-2 text-gray-700">Additional Resources</h3>
            <div className="space-y-2">
              <a href="https://www.vatican.va/archive/ENG0015/_INDEX.HTM" target="_blank" rel="noopener noreferrer" className="block text-sm text-[#4A2C82] hover:underline flex items-center">
                <LinkIcon className="h-3 w-3 mr-1" />
                Catechism of the Catholic Church
              </a>
              <a href="https://www.usccb.org/" target="_blank" rel="noopener noreferrer" className="block text-sm text-[#4A2C82] hover:underline flex items-center">
                <LinkIcon className="h-3 w-3 mr-1" />
                USCCB: United States Conference of Catholic Bishops
              </a>
              <a href="https://www.vatican.va/content/vatican/en.html" target="_blank" rel="noopener noreferrer" className="block text-sm text-[#4A2C82] hover:underline flex items-center">
                <LinkIcon className="h-3 w-3 mr-1" />
                Vatican Official Website
              </a>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

function SourceCard({ source }: { source: SourceReference }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 bg-[#4A2C82] bg-opacity-10 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-sm text-[#4A2C82]">{source.title}</h3>
        <ChevronDown className="text-gray-500 h-4 w-4" />
      </div>
      <div className="p-3">
        {source.content && (
          <p className="text-sm text-gray-800 mb-2">
            {source.content.length > 150 
              ? `${source.content.substring(0, 150)}...` 
              : source.content}
          </p>
        )}
        <div className="mt-2 text-right">
          <Button variant="link" className="text-[#4A2C82] text-xs hover:underline">
            View full section
          </Button>
        </div>
      </div>
    </div>
  );
}
