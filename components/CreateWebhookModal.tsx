import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WebhookSubscription, WebhookEvent, EVENT_DEFINITIONS, WebhookFilter } from '../types';
import FilterBuilder from './FilterBuilder';

interface CreateWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { url: string; events: WebhookEvent[] }) => Promise<void>;
  initialData?: WebhookSubscription | null;
}

const CreateWebhookModal: React.FC<CreateWebhookModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Event Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter Editing State
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null);
  const [filterJson, setFilterJson] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isVisualMode, setIsVisualMode] = useState(true);

  const allOptions = useMemo(() => {
    return Object.entries(EVENT_DEFINITIONS).flatMap(([obj, actions]) => 
      actions.map(act => ({
        label: `${obj} ${act}`, // For display/search
        value: `${obj}.${act}`, // Unique ID
        object_type: obj,
        action: act
      }))
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUrl(initialData.url);
        setEvents(initialData.events);
      } else {
        setUrl('');
        setEvents([]);
      }
      setSearchQuery('');
      setIsDropdownOpen(false);
      setEditingFilterIndex(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleEvent = (obj: string, act: string) => {
    const exists = events.some(e => e.object_type === obj && e.action === act);
    if (exists) {
      setEvents(events.filter(e => !(e.object_type === obj && e.action === act)));
    } else {
      setEvents([...events, { object_type: obj, action: act as any }]);
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
    if (editingFilterIndex === index) {
        setEditingFilterIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && searchQuery === '' && events.length > 0) {
      e.preventDefault();
      removeEvent(events.length - 1);
    }
  };

  const openFilterEditor = (index: number) => {
    setEditingFilterIndex(index);
    const currentFilter = events[index].extra_filter;
    
    // If no filter exists, start with a sensible default structure for the visual builder
    // This ensures if they click 'Apply' immediately, they get the empty template they see
    const startingFilter = currentFilter || { type: 'field_accessor', field: '', filter: { type: 'equals', value: '' } };
    const jsonString = JSON.stringify(startingFilter, null, 2);

    setFilterJson(jsonString);
    setFilterError(null);
    setIsVisualMode(true);
  };

  const handleVisualFilterChange = (newFilter: WebhookFilter) => {
      setFilterJson(JSON.stringify(newFilter, null, 2));
  };

  const saveFilter = () => {
    if (editingFilterIndex === null) return;

    let parsedFilter: WebhookFilter | undefined;
    if (filterJson.trim()) {
        try {
            parsedFilter = JSON.parse(filterJson);
        } catch (e) {
            setFilterError("Invalid JSON format");
            setIsVisualMode(false); 
            return;
        }
    }

    const updatedEvents = [...events];
    updatedEvents[editingFilterIndex] = {
        ...updatedEvents[editingFilterIndex],
        extra_filter: parsedFilter
    };
    setEvents(updatedEvents);
    setEditingFilterIndex(null);
  };

  const handleRemoveFilter = () => {
      if (editingFilterIndex === null) return;
      const updatedEvents = [...events];
      delete updatedEvents[editingFilterIndex].extra_filter;
      setEvents(updatedEvents);
      setEditingFilterIndex(null);
  };

  const getParsedFilterForBuilder = (): WebhookFilter => {
      try {
          if (!filterJson.trim()) {
              return { type: 'field_accessor', field: '', filter: { type: 'equals', value: '' } };
          }
          return JSON.parse(filterJson);
      } catch (e) {
          return { type: 'field_accessor', field: '', filter: { type: 'equals', value: '' } };
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ url, events });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOptions = allOptions.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in-up">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] relative animate-zoom-in origin-center">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {initialData ? 'Edit Subscription' : 'New Subscription'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Configure destination and triggers</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors hover:rotate-90 duration-200" title="Close">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar min-h-[300px] pb-64">
          
          {/* URL Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Destination URL</label>
            <input
              type="url"
              required
              placeholder="https://api.yourservice.com/webhooks"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 focus:bg-slate-800/80"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              title="The endpoint where Close will send POST requests when events occur"
            />
          </div>

          {/* Multi-select Tag Input Section */}
          <div className="space-y-3 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
              <span>Event Triggers</span>
              <span className="text-xs text-slate-500">{events.length} selected</span>
            </label>

            {/* Unified Input Container */}
            <div 
              className="min-h-[52px] w-full bg-slate-800 border border-slate-700 rounded-lg p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all cursor-text focus-within:bg-slate-800/90"
              onClick={() => inputRef.current?.focus()}
              title="Select the events that should trigger this webhook"
            >
              {events.map((event, idx) => (
                <div 
                  key={`${event.object_type}-${event.action}-${idx}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium border transition-all animate-zoom-in duration-200 ${
                    event.extra_filter 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="capitalize">{event.object_type}</span>
                  <span className="opacity-50">•</span>
                  <span className="capitalize">{event.action}</span>
                  
                  <div className="w-px h-3 bg-current opacity-20 mx-0.5" />
                  
                  <button 
                    onClick={() => openFilterEditor(idx)}
                    className={`p-0.5 rounded hover:bg-white/10 ${event.extra_filter ? 'text-emerald-400' : 'text-current opacity-50 hover:opacity-100'}`}
                    title={event.extra_filter ? "Edit existing filter" : "Add a condition filter for this event"}
                  >
                    <i className={`fa-solid fa-filter text-xs`}></i>
                  </button>

                  <button 
                    onClick={() => removeEvent(idx)}
                    className="hover:text-white transition-colors ml-0.5 hover:rotate-90 duration-200"
                    title="Remove this event"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
              ))}

              {/* Search Input */}
              <div className="flex-1 min-w-[150px] relative">
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full h-full bg-transparent border-none text-slate-200 text-sm focus:ring-0 p-1 placeholder-slate-500 focus:outline-none"
                    placeholder={events.length === 0 ? "Search events (e.g. 'lead created')..." : ""}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                  />
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-40 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar top-full left-0 animate-fade-in-up origin-top duration-200">
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No matching events found.
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredOptions.map((option) => {
                      const isSelected = events.some(
                        e => e.object_type === option.object_type && e.action === option.action
                      );
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleEvent(option.object_type, option.action)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected 
                              ? 'bg-blue-600/20 text-blue-200' 
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <i className={`fa-solid fa-tag ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}></i>
                            <span className="capitalize font-medium">{option.object_type}</span>
                            <span className="text-slate-600 text-xs">●</span>
                            <span className="capitalize text-slate-400">{option.action}</span>
                          </div>
                          {isSelected && <i className="fa-solid fa-check text-blue-400 animate-zoom-in"></i>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-xl flex justify-end gap-3 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Discard changes"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !url || events.length === 0}
            title={!url ? "Please enter a URL" : events.length === 0 ? "Please select at least one event" : "Save webhook subscription"}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isSaving ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-floppy-disk"></i>
            )}
            {initialData ? 'Save Changes' : 'Create Subscription'}
          </button>
        </div>

        {/* Filter Editor Modal (Nested) */}
        {editingFilterIndex !== null && (
            <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col rounded-xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="fa-solid fa-filter text-emerald-400"></i>
                            Edit Filter
                        </h3>
                        <p className="text-sm text-slate-400">
                            Event: <span className="text-emerald-300 font-mono">{events[editingFilterIndex].object_type}.{events[editingFilterIndex].action}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                         {/* View Toggle */}
                         <div className="bg-slate-800 p-1 rounded-lg flex text-xs font-medium">
                             <button 
                                onClick={() => setIsVisualMode(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${isVisualMode ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Build filter using visual tools"
                             >
                                <i className="fa-solid fa-table-columns"></i>
                                Visual
                             </button>
                             <button 
                                onClick={() => setIsVisualMode(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${!isVisualMode ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Edit raw JSON"
                             >
                                <i className="fa-solid fa-code"></i>
                                JSON
                             </button>
                         </div>
                         
                        <button 
                            onClick={() => setEditingFilterIndex(null)}
                            className="text-slate-400 hover:text-white transition-transform hover:rotate-90 duration-200"
                            title="Close filter editor"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                    {isVisualMode ? (
                        <div className="space-y-4 animate-fade-in-up">
                             <p className="text-sm text-slate-400">
                                Construct your filter logic below. Changes are automatically converted to valid JSON.
                             </p>
                             <FilterBuilder 
                                filter={getParsedFilterForBuilder()} 
                                onChange={handleVisualFilterChange} 
                                isRoot={true}
                             />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0 animate-fade-in-up">
                             <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700 mb-2">
                                Enter JSON filter condition (e.g. <code>{`{"type": "field_accessor", "field": "user_id", "filter": {...}}`}</code>).
                                Leave empty to remove filter.
                            </div>
                            <textarea 
                                className={`flex-1 w-full bg-slate-950 border ${filterError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-emerald-500 resize-none transition-colors`}
                                value={filterJson}
                                onChange={(e) => setFilterJson(e.target.value)}
                                placeholder='{ "type": "equals", "value": "..." }'
                                spellCheck={false}
                            />
                        </div>
                    )}
                    
                    {filterError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm px-2 mt-2 animate-bounce">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            {filterError}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button 
                        onClick={handleRemoveFilter}
                        className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded mr-auto transition-colors flex items-center gap-2"
                        title="Remove this filter completely"
                    >
                        <i className="fa-solid fa-trash-can"></i>
                        Remove Filter
                    </button>

                    <button 
                        onClick={() => setEditingFilterIndex(null)}
                        className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                        title="Discard filter changes"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveFilter}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
                        title="Apply this filter to the event"
                    >
                        <i className="fa-solid fa-check"></i>
                        Apply Filter
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CreateWebhookModal;