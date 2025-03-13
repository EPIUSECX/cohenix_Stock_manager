import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchItems } from '../services/api';

interface ItemSearchProps {
  onItemSelect: (itemCode: string) => void;
  placeholder?: string;
}

export default function ItemSearch({ onItemSelect, placeholder = "Search for items..." }: ItemSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchItemsDebounced = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchItems(searchTerm);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Error searching items:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchItemsDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelect = (itemCode: string) => {
    onItemSelect(itemCode);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {searchResults.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => handleSelect(item.name)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            >
              <div className="font-medium">{item.item_name}</div>
              <div className="text-sm text-gray-500">
                <span>Code: {item.name}</span>
                {item.barcode && (
                  <span className="ml-2">Barcode: {item.barcode}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}