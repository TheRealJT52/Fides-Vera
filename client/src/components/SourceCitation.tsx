import { SourceReference } from "@/lib/types";
import { BookText } from "lucide-react";

interface SourceCitationProps {
  source: SourceReference;
}

export default function SourceCitation({ source }: SourceCitationProps) {
  // Function to format source citation based on category
  const getFormattedCitation = () => {
    if (!source.category) {
      return source.source;
    }
    
    switch (source.category.toLowerCase()) {
      case 'catechism':
        return `${source.source}, ${source.title.includes('Part') ? source.title.split(' - ')[1] : ''} ${source.section || ''}`;
      
      case 'council documents':
        return `${source.title.split(':')[1]?.trim() || source.title}, ${source.source}`;
      
      case 'encyclicals':
        return source.title;
      
      case 'saints':
        return `${source.title}, ${source.source}`;
      
      case 'scripture':
        return `${source.title}, ${source.source}`;
      
      default:
        return `${source.source}${source.section ? `, ${source.section}` : ''}`;
    }
  };
  
  return (
    <div className="citation bg-gray-50 rounded p-2 my-2 text-sm border-l-2 border-[#4A2C82]">
      <p className="font-medium text-[#4A2C82] text-xs">From {source.title}:</p>
      
      {source.content && (
        <p className="italic my-1 text-xs">{source.content}</p>
      )}
      
      <div className="text-xs text-gray-600 flex items-center mt-1">
        <BookText className="text-[#C41E3A] mr-1" size={12} />
        {getFormattedCitation()}
      </div>
    </div>
  );
}

export function SourcesSection({ sources }: { sources: SourceReference[] }) {
  if (!sources || sources.length === 0) return null;
  
  // Function to get an appropriate icon for each category
  const getSourceIcon = (category?: string) => {
    // Default to BookText
    return <BookText className="text-[#4A2C82]" size={20} />;
  };
  
  // Function to generate appropriate metadata display for each source type
  const getSourceMetadata = (source: SourceReference) => {
    if (!source.category) {
      return source.section ? <p className="text-xs text-gray-500 mt-1">{source.section}</p> : null;
    }
    
    switch (source.category.toLowerCase()) {
      case 'catechism':
        return (
          <div className="text-xs text-gray-500 mt-1">
            <p>{source.section || ''}</p>
            {source.section && <p className="mt-0.5">Paragraphs: {source.section.replace('Part ', '').replace(/\([^)]*\)/g, '')}</p>}
          </div>
        );
      
      case 'council documents':
        return (
          <div className="text-xs text-gray-500 mt-1">
            <p>{source.source}, {source.title.split(':')[1]?.trim()}</p>
          </div>
        );
      
      case 'encyclicals':
        return (
          <div className="text-xs text-gray-500 mt-1">
            <p>{source.source}</p>
          </div>
        );
      
      case 'saints':
      case 'scripture':
        return (
          <div className="text-xs text-gray-500 mt-1">
            <p>{source.source}</p>
            {source.section && <p className="mt-0.5">{source.section}</p>}
          </div>
        );
      
      default:
        return source.section ? <p className="text-xs text-gray-500 mt-1">{source.section}</p> : null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg px-5 py-4 shadow border-l-4 border-[#4A2C82]">
      <h3 className="font-['Cinzel'] text-[#4A2C82] font-semibold mb-3">Sources Used</h3>
      
      <div className="space-y-3">
        {sources.map((source, index) => (
          <div key={index} className="source-preview flex bg-[#F8F5E6] bg-opacity-70 rounded p-3 cursor-pointer hover:transform hover:translate-y-[-2px] transition-all duration-200 hover:shadow-md">
            <div className="mr-3 flex-shrink-0">
              {getSourceIcon(source.category)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">{source.title}</h4>
              <p className="text-xs text-gray-600">
                {source.category || 'Reference'} 
                {source.relevanceScore !== undefined && ` · Relevance: ${Math.round(source.relevanceScore * 100)}%`}
              </p>
              {getSourceMetadata(source)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
