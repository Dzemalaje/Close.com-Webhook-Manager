import React, { useState, useEffect } from 'react';
import { WebhookFilter, FilterType } from '../types';

interface FilterBuilderProps {
  filter: WebhookFilter;
  onChange: (filter: WebhookFilter) => void;
  onDelete?: () => void;
  depth?: number;
  isRoot?: boolean;
}

// Move helper outside to prevent recreation on render
const getDefaultChildForType = (type: FilterType): WebhookFilter => {
  if (type === 'field_accessor') return { type: 'equals', value: '' };
  if (type === 'not' || type === 'any_array_value') return { type: 'field_accessor', field: '', filter: { type: 'equals', value: '' } };
  return { type: 'equals', value: '' };
};

const FilterBuilder: React.FC<FilterBuilderProps> = React.memo(({ filter, onChange, onDelete, depth = 0, isRoot = false }) => {
  const [valType, setValType] = useState<'string' | 'number' | 'boolean'>('string');

  // Initialize valType based on incoming value type
  useEffect(() => {
    const t = typeof filter.value;
    if (t === 'number') setValType('number');
    else if (t === 'boolean') setValType('boolean');
    else setValType('string');
  }, [filter.value]);

  const handleTypeChange = (newType: FilterType) => {
    const newFilter: WebhookFilter = { ...filter, type: newType };
    
    // Prune invalid props for new type
    if (!['equals', 'not_equals', 'contains'].includes(newType)) delete newFilter.value;
    if (newType !== 'field_accessor') delete newFilter.field;
    if (!['and', 'or'].includes(newType)) delete newFilter.filters;
    if (!['not', 'field_accessor', 'any_array_value'].includes(newType)) delete newFilter.filter;

    // Initialize props for new type
    if (['and', 'or'].includes(newType) && !newFilter.filters) {
      newFilter.filters = [getDefaultChildForType(newType)];
    }
    if (['not', 'field_accessor', 'any_array_value'].includes(newType) && !newFilter.filter) {
      newFilter.filter = getDefaultChildForType(newType);
    }
    
    // Reset value if switching to comparison
    if (['equals', 'not_equals', 'contains'].includes(newType) && newFilter.value === undefined) {
        newFilter.value = '';
    }

    onChange(newFilter);
  };

  const handleChange = (key: keyof WebhookFilter, value: any) => {
    onChange({ ...filter, [key]: value });
  };

  const handleValueTypeChange = (type: 'string' | 'number' | 'boolean') => {
    setValType(type);
    // Reset value to safe default when switching type
    if (type === 'number') handleChange('value', 0);
    else if (type === 'boolean') handleChange('value', true);
    else handleChange('value', '');
  };

  const isGroup = ['and', 'or'].includes(filter.type);
  const isWrapper = ['not', 'field_accessor', 'any_array_value'].includes(filter.type);
  
  const getBorderColor = () => {
    if (isGroup) return 'border-indigo-500/30';
    if (isWrapper) return 'border-blue-500/30';
    return 'border-emerald-500/30'; // Comparison
  };

  const getBgColor = () => {
    if (isGroup) return 'bg-indigo-500/5';
    if (isWrapper) return 'bg-blue-500/5';
    return 'bg-slate-800';
  };

  return (
    <div className={`relative flex flex-col gap-2 p-3 rounded-lg border ${getBorderColor()} ${getBgColor()} transition-all`}>
      
      {/* Control Row */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {/* Node Type Selector */}
        <div className="relative" title="Select the type of logic or condition">
            <select
                value={filter.type}
                onChange={(e) => handleTypeChange(e.target.value as FilterType)}
                className={`appearance-none bg-slate-900 border ${getBorderColor()} rounded-md px-3 py-1.5 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium min-w-[140px]`}
            >
                <optgroup label="Logic">
                    <option value="and">AND (All)</option>
                    <option value="or">OR (Any)</option>
                    <option value="not">NOT</option>
                </optgroup>
                <optgroup label="Structure">
                    <option value="field_accessor">Field...</option>
                    <option value="any_array_value">In Array...</option>
                </optgroup>
                <optgroup label="Comparison">
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="is_null">Is Null</option>
                    <option value="non_null">Not Null</option>
                </optgroup>
            </select>
            <i className="fa-solid fa-chevron-down text-xs text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        {/* Field Input (for field_accessor) */}
        {filter.type === 'field_accessor' && (
            <div className="flex items-center gap-2 flex-1 min-w-[180px]" title="Enter the field name to check (e.g. status_label, custom.my_field)">
                <div className="bg-blue-500/20 p-1 rounded">
                  <i className="fa-solid fa-cube text-blue-400 text-xs"></i>
                </div>
                <input 
                    type="text" 
                    placeholder="field_name (e.g. custom.cf_xxxx)"
                    value={filter.field || ''}
                    onChange={(e) => handleChange('field', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
            </div>
        )}

        {/* Value Input (for comparisons) */}
        {['equals', 'not_equals', 'contains'].includes(filter.type) && (
            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-md p-0.5">
                {/* Type Toggles */}
                <div className="flex rounded bg-slate-800">
                    <button 
                        onClick={() => handleValueTypeChange('string')}
                        className={`p-1.5 rounded ${valType === 'string' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Treat value as text (String)"
                    >
                        <i className="fa-solid fa-font text-xs"></i>
                    </button>
                    <button 
                        onClick={() => handleValueTypeChange('number')}
                        className={`p-1.5 rounded ${valType === 'number' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Treat value as a number"
                    >
                        <i className="fa-solid fa-hashtag text-xs"></i>
                    </button>
                    <button 
                        onClick={() => handleValueTypeChange('boolean')}
                        className={`p-1.5 rounded ${valType === 'boolean' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Treat value as true/false (Boolean)"
                    >
                        <i className="fa-solid fa-toggle-on text-xs"></i>
                    </button>
                </div>

                {/* Input Area */}
                <div className="flex-1 px-1" title="Enter the value to match against">
                    {valType === 'boolean' ? (
                        <select
                            value={String(filter.value)}
                            onChange={(e) => handleChange('value', e.target.value === 'true')}
                            className="w-full bg-transparent text-sm text-white focus:outline-none py-1 cursor-pointer"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    ) : (
                        <input 
                            type={valType === 'number' ? 'number' : 'text'}
                            placeholder="Value..."
                            value={filter.value === undefined ? '' : String(filter.value)}
                            onChange={(e) => handleChange('value', valType === 'number' ? Number(e.target.value) : e.target.value)}
                            className="w-full bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none py-1"
                        />
                    )}
                </div>
            </div>
        )}

        {/* Delete (Root usually doesn't delete itself from within, but parent handles it) */}
        {!isRoot && onDelete && (
            <button 
                onClick={onDelete}
                className="ml-auto p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                title="Delete this rule"
            >
                <i className="fa-solid fa-trash-can"></i>
            </button>
        )}
      </div>

      {/* Recursive Children */}
      {(isGroup || isWrapper) && (
          <div className="relative pl-4 sm:pl-6 flex flex-col gap-2 mt-1">
              {/* Tree Line */}
              <div className="absolute left-2.5 top-0 bottom-4 w-px bg-slate-700/50" />

              {/* Single Child Wrapper */}
              {isWrapper && (
                   <div className="relative">
                      <div className="absolute -left-3.5 top-4 w-3 h-px bg-slate-700/50" />
                      {filter.filter ? (
                          <FilterBuilder 
                              filter={filter.filter} 
                              onChange={(newChild) => onChange({ ...filter, filter: newChild })}
                              depth={depth + 1}
                          />
                      ) : (
                          <div className="text-xs text-amber-400 bg-amber-900/20 p-2 rounded border border-amber-500/20 flex items-center gap-2">
                              <i className="fa-solid fa-circle-exclamation"></i> Incomplete condition
                              <button 
                                onClick={() => onChange({ ...filter, filter: { type: 'equals', value: '' } })}
                                className="underline hover:text-amber-300"
                                title="Add a condition to check"
                              >
                                Fix
                              </button>
                          </div>
                      )}
                   </div>
              )}

              {/* List Children */}
              {isGroup && filter.filters && (
                  <>
                    {filter.filters.map((child, idx) => (
                        <div key={idx} className="relative">
                            <div className="absolute -left-3.5 top-5 w-3.5 h-px bg-slate-700/50" />
                            <FilterBuilder 
                                filter={child}
                                onChange={(newChild) => {
                                    const newFilters = [...(filter.filters || [])];
                                    newFilters[idx] = newChild;
                                    onChange({ ...filter, filters: newFilters });
                                }}
                                onDelete={() => {
                                    const newFilters = filter.filters?.filter((_, i) => i !== idx);
                                    onChange({ ...filter, filters: newFilters });
                                }}
                                depth={depth + 1}
                            />
                        </div>
                    ))}
                    
                    {/* Add Button */}
                    <div className="relative pt-1">
                         <div className="absolute -left-3.5 top-4 w-3.5 h-px bg-slate-700/50" />
                         <button 
                            onClick={() => onChange({ ...filter, filters: [...(filter.filters || []), { type: 'field_accessor', field: '', filter: { type: 'equals', value: '' } }] })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                            title="Add another rule to this group"
                        >
                            <i className="fa-solid fa-plus"></i>
                            Add Rule
                        </button>
                    </div>
                  </>
              )}
          </div>
      )}
    </div>
  );
});

export default FilterBuilder;