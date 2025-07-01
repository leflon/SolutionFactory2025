import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const stops = [
  'Saint-Denis–Pleyel',
  'Mairie de Saint-Ouen',
  'Saint-Ouen',
  'Porte de Clichy',
  'Pont Cardinet',
  'Saint-Lazare',
  'Madeleine',
  'Pyramides',
  'Châtelet',
  'Gare de Lyon',
  'Bercy',
  'Cour Saint-Émilion',
  'Bibliothèque F. Mitterrand',
  'Olympiades',
  'Maison Blanche',
  'Hôpital Bicêtre',
  'Villejuif–Gustave Roussy',
  'L’Haÿ-les-Roses',
  'Chevilly-Larue',
  'Thiais - Orly',
  'Aéroport d’Orly'
];

const LinePlan = () => {
  const [visibleStops, setVisibleStops] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastStopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < stops.length - 1) {
        setVisibleStops(prev => [...prev, stops[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 200); // slightly faster for fluidity
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastStopRef.current && containerRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          lastStopRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end' });
        }, 100);
      });
    }
  }, [visibleStops]);

  return (
    <div className="p-4 bg-white text-purple-800">
      <div ref={containerRef} className="overflow-x-auto border border-gray-300 rounded-xl p-4 shadow-md">
        <div className="flex items-center w-max">
          {visibleStops.map((stop, idx) => (
            <React.Fragment key={idx}>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex flex-col items-center mx-2"
                ref={idx === visibleStops.length - 1 ? lastStopRef : null}
              >
                <div className="w-4 h-4 bg-purple-800 rounded-full mb-1"></div>
                <span className="text-xs text-center whitespace-nowrap">{stop}</span>
              </motion.div>
              {idx < stops.length - 2 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '30px' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-1 bg-purple-800"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LinePlan;