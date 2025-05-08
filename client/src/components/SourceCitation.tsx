import { SourceReference } from "@/lib/types";
import { BookText } from "lucide-react";

interface SourceCitationProps {
  source: SourceReference;
}

export default function SourceCitation({ source }: SourceCitationProps) {
  return (
    <div className="citation bg-gray-50 rounded p-2 my-2 text-sm border-l-2 border-[#4A2C82]">
      <p className="font-medium text-[#4A2C82] text-xs">From {source.title}:</p>
      
      {source.content && (
        <p className="italic my-1 text-xs">{source.content}</p>
      )}
      
      <div className="text-xs text-gray-600 flex items-center mt-1">
        <BookText className="text-[#C41E3A] mr-1" size={12} />
        {source.source}{source.section ? `, ${source.section}` : ''}
      </div>
    </div>
  );
}

export function SourcesSection({ sources }: { sources: SourceReference[] }) {
  if (!sources || sources.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg px-5 py-4 shadow border-l-4 border-[#4A2C82]">
      <h3 className="font-['Cinzel'] text-[#4A2C82] font-semibold mb-3">Sources Used</h3>
      
      <div className="space-y-3">
        {sources.map((source, index) => (
          <div key={index} className="source-preview flex bg-[#F8F5E6] bg-opacity-70 rounded p-3 cursor-pointer hover:transform hover:translate-y-[-2px] transition-all duration-200 hover:shadow-md">
            <div className="mr-3 flex-shrink-0">
              <BookText className="text-[#4A2C82]" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">{source.title}</h4>
              <p className="text-xs text-gray-600">{source.source}</p>
              {source.section && (
                <p className="text-xs text-gray-500 mt-1">{source.section}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
