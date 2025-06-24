"use client";

import translations from "@/lang/translations";
import { useEffect, useState, useRef } from "react";

type Language = 'en' | 'fr';

type Station = {
  stop_name: string;
  route_names: string[];
  route_ids: string[];
  background_colors: string[];
  text_colors: string[];
};

type FieldType = "departure" | "arrival";

const Fields: React.FC<{ language: Language }> = ({ language }) => {
  const [queries, setQueries] = useState({ departure: '', arrival: '' });
  const [stations, setStations] = useState<{ [K in FieldType]: Station[] }>({ departure: [], arrival: [] });
  const [isLoading, setIsLoading] = useState<{ [K in FieldType]: boolean }>({ departure: false, arrival: false });
  const [showDropdown, setShowDropdown] = useState<{ [K in FieldType]: boolean }>({ departure: false, arrival: false });

  // Refs to store debounce timers for each field
  const debounceTimers = useRef<{ [K in FieldType]: NodeJS.Timeout | null }>({ departure: null, arrival: null });

  const handleInputChange = (field: FieldType, value: string) => {
    setQueries(q => ({ ...q, [field]: value }));
    setShowDropdown(sd => ({ ...sd, [field]: true }));
  };

  // Debounced effect for departure
  useEffect(() => {
    if (!showDropdown.departure) return;
    if (debounceTimers.current.departure) clearTimeout(debounceTimers.current.departure);
    debounceTimers.current.departure = setTimeout(() => {
      if (queries.departure.length >= 2) {
        setIsLoading(l => ({ ...l, departure: true }));
        fetch(`/api/autocomplete?q=${encodeURIComponent(queries.departure)}`)
          .then((res) => res.json())
          .then((data) => {
            setStations(s => ({ ...s, departure: data.stations }));
            setIsLoading(l => ({ ...l, departure: false }));
          })
          .catch(() => setIsLoading(l => ({ ...l, departure: false })));
      } else {
        setStations(s => ({ ...s, departure: [] }));
      }
    }, 300);

    return () => {
      if (debounceTimers.current.departure) clearTimeout(debounceTimers.current.departure);
    };
  }, [queries.departure, showDropdown.departure]);

  // Debounced effect for arrival
  useEffect(() => {
    if (!showDropdown.arrival) return;
    if (debounceTimers.current.arrival) clearTimeout(debounceTimers.current.arrival);
    debounceTimers.current.arrival = setTimeout(() => {
      if (queries.arrival.length >= 2) {
        setIsLoading(l => ({ ...l, arrival: true }));
        fetch(`/api/autocomplete?q=${encodeURIComponent(queries.arrival)}`)
          .then((res) => res.json())
          .then((data) => {
            setStations(s => ({ ...s, arrival: data.stations }));
            setIsLoading(l => ({ ...l, arrival: false }));
          })
          .catch(() => setIsLoading(l => ({ ...l, arrival: false })));
      } else {
        setStations(s => ({ ...s, arrival: [] }));
      }
    }, 300);

    return () => {
      if (debounceTimers.current.arrival) clearTimeout(debounceTimers.current.arrival);
    };
  }, [queries.arrival, showDropdown.arrival]);

  const t = translations[language];

  const renderAutocomplete = (field: FieldType) => (
    <>
      {isLoading[field] && <div className="absolute bg-white dark:bg-gray-700 dark:text-white p-2 z-10">{t.loading}</div>}
      {!isLoading[field] && showDropdown[field] && stations[field].length > 0 && (
        <div className="absolute top-full dark:bg-gray-700 dark:text-white left-0 mt-1 border border-gray-300 rounded bg-white shadow-md max-h-60 overflow-y-auto min-w-max max-w-xs z-10">
          {stations[field].map((station: Station) => {
            const logos = station.route_names.map((name, idx) => ({
              name,
              id: station.route_ids[idx],
              bg: station.background_colors[idx],
              color: station.text_colors[idx],
            }));
            logos.sort((a, b) => Number(a.name) - Number(b.name));
            return (
              <div
                key={station.stop_name}
                className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                onClick={() => {
                  setQueries(q => ({ ...q, [field]: station.stop_name }));
                  setStations(s => ({ ...s, [field]: [] }));
                  setShowDropdown(sd => ({ ...sd, [field]: false }));
                }}
              >
                <div className="flex gap-1 mr-2 flex-shrink-0">
                  {logos.map((logo, idx) => (
                    <img
                      key={logo.id + idx}
                      src={`/metros/${logo.name}.png`}
                      alt={logo.name}
                      className="w-6 h-6"
                      style={{
                        backgroundColor: logo.bg,
                        color: logo.color,
                        borderRadius: '50%',
                        border: '1px solid #ccc',
                        marginRight: 2,
                      }}
                    />
                  ))}
                </div>
                <span className="whitespace-normal break-words">{station.stop_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col items-left relative justify-center h-screen border border-gray-300 dark:border-gray-600 rounded-sm max-w-60 max-h-60 m-5 shadow-md dark:shadow-lg">
      <form className="flex flex-col justify-center items-center gap-2">
        <label className="dark:text-white">{t.departure}</label>
        <div className="relative">
          <input
            type="text"
            className="w-50 border-2 rounded-sm dark:border-white dark:text-white"
            value={queries.departure}
            onChange={e => handleInputChange("departure", e.target.value)}
            onFocus={() => setShowDropdown(sd => ({ ...sd, departure: true }))}
            autoComplete="off"
          />
          {renderAutocomplete("departure")}
        </div>

        <label className="dark:text-white">{t.arrival}</label>
        <div className="relative">
          <input
            type="text"
            className="w-50 border-2 rounded-sm dark:border-white dark:text-white"
            value={queries.arrival}
            onChange={e => handleInputChange("arrival", e.target.value)}
            onFocus={() => setShowDropdown(sd => ({ ...sd, arrival: true }))}
            autoComplete="off"
          />
          {renderAutocomplete("arrival")}
        </div>

        <button
          type="submit"
          className="w-32 px-3 py-1 mt-2 border-2 border-green-600 text-green-500 dark:border-pink-400 dark:text-pink-400 font-medium rounded-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-green-600 hover:text-white hover:dark:bg-pink-400 hover:dark:text-white"
        >
          {t.calculate}
        </button>
      </form>
    </div>
  );
};

export default Fields;