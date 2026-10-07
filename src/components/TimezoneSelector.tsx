import React, { useMemo, useState } from 'react';

interface TimezoneSelectorProps {
  enabled: boolean;
  timezone: string;
  onEnabledChange: (enabled: boolean) => void;
  onTimezoneChange: (timezone: string) => void;
  timezones: string[];
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  enabled,
  timezone,
  onEnabledChange,
  onTimezoneChange,
  timezones,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const filteredTimezones = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search
      ? timezones.filter((value) => value.toLocaleLowerCase().includes(search))
      : timezones;
  }, [query, timezones]);

  const selectTimezone = (value: string) => {
    onTimezoneChange(value);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredTimezones.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && isOpen && filteredTimezones[activeIndex]) {
      event.preventDefault();
      selectTimezone(filteredTimezones[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="setting-field timezone-setting" data-testid="timezone-setting">
      <label className="timezone-toggle">
        <input
          type="checkbox"
          checked={enabled}
          aria-label="Enable timezone"
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        <span>Timezone</span>
      </label>
      <div className="timezone-picker">
        <input
          type="text"
          role="combobox"
          aria-label="Timezone"
          aria-autocomplete="list"
          aria-expanded={enabled && isOpen}
          aria-controls="timezone-options"
          aria-activedescendant={isOpen && filteredTimezones[activeIndex] ? `timezone-option-${activeIndex}` : undefined}
          placeholder="Search timezones"
          value={isOpen ? query : timezone}
          disabled={!enabled}
          autoComplete="off"
          onFocus={() => {
            setQuery('');
            setActiveIndex(Math.max(0, timezones.indexOf(timezone)));
            setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false);
            setQuery('');
          }}
        />
        {enabled && isOpen && (
          <div className="timezone-options" id="timezone-options" role="listbox" aria-label="Timezones">
            {filteredTimezones.length > 0 ? filteredTimezones.map((value, index) => (
              <div
                key={value}
                id={`timezone-option-${index}`}
                className={index === activeIndex ? 'timezone-option active' : 'timezone-option'}
                role="option"
                aria-selected={value === timezone}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectTimezone(value)}
              >
                {value}
              </div>
            )) : <div className="timezone-empty" role="status">No matching timezones.</div>}
          </div>
        )}
      </div>
      {!enabled && <small>UTC is used by default.</small>}
    </div>
  );
};

export default TimezoneSelector;
