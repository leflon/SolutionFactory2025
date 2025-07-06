import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type LinePlanProps = {
  lineId: string;
  onStationClick?: (stationName: string) => void;
};

let stops: string[] = [];

const LinePlan = ({ lineId, onStationClick }: LinePlanProps) => {
  const [lineColor, setLineColor] = useState("#777777");
  const [stations, setStations] = useState<string[]>(stops);

  useEffect(() => {

    const fetchStations = async () => {
      const res = await fetch(`/api/stations/${lineId}`);
      if (res.ok) {
        const result = await res.json();
        setStations(result.stations);
        setLineColor(result.color.startsWith("#") ? result.color : "#" + result.color);
      }
    };
    fetchStations();
  }, [lineId]);

  const margin = 60;
  const spacing = 200;
  const animationDuration = 5;

  const stationPositions = stations.map((name, idx) => ({
    name,
    x: idx * spacing,
  }));
  const maxX = stationPositions.length > 0 ? stationPositions[stationPositions.length - 1].x : 0;

  return (
    <div className="overflow-x-auto w-full" style={{ maxWidth: "100%" }}>
      <svg width={maxX + margin + 100} height={70} style={{ display: "block" }}>
        {/* Ligne animée */}
        <motion.line
          x1={margin}
          y1="35"
          x2={maxX + margin}
          y2="35"
          stroke={lineColor}
          strokeWidth="5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: animationDuration, ease: "easeInOut" }}
        />

        {/* Stations */}
        {stationPositions.map((station, idx) => {
          const offsetX = station.x + margin;
          const delay = (offsetX) / (maxX + margin) * animationDuration;
          return (
            <motion.g
              key={idx}
              className="cursor-pointer"
              whileHover={{ scale: 1.4 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => onStationClick?.(station.name)}
              >
              <motion.circle
                cx={offsetX}
                cy={35}
                r={8}
                fill="white"
                stroke="#000000"
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay,
                  duration: 0.3,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
              />
                <motion.text
                x={offsetX}
                y={20}
                textAnchor="middle"
                fontSize="10"
                transform={`rotate(-30, ${offsetX}, 20)`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.5 }}
                transition={{ delay: delay + 0.1, duration: 0.3 }}
                fill="currentColor"
                className="text-black dark:text-white"
                >
                {station.name}
                </motion.text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export default LinePlan;