import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiInfo } from "react-icons/fi";
import { FaDoorOpen, FaPeopleGroup, FaTrainSubway } from "react-icons/fa6";
import Image from "next/image";
import LinePlan from "./LinePlan";

type Station = {
    name: string;
    pointOfInterest?: string;
    imageUrl?: string;
};

const highlightedStations: Station[] = [
    {
        name: "Château de Vincennes",
        pointOfInterest: "Un château médiéval fortifié à l'est de Paris.",
        imageUrl: "/stations/Vincennes.jpg",
    },
    {
        name: "Nation",
        pointOfInterest: "Grande place emblématique avec statue de la République.",
        imageUrl: "/stations/nation.jpg",
    },
    {
        name: "Gare de Lyon",
        pointOfInterest: "L’une des principales gares parisiennes avec sa tour horloge.",
        imageUrl: "/stations/gare-de-lyon.jpg",
    },
    {
        name: "Bastille",
        pointOfInterest: "Opéra moderne et symbole historique de la Révolution.",
        imageUrl: "/stations/bastille.jpg",
    },
];

type MetroLineInfoProps = {
    lineName: string;
    color: string;
    openingDate: string;
    dailyRiders: string;
    rollingStock: string;
};

export default function MetroLineInfo({
    lineName,
    color,
    openingDate,
    dailyRiders,
    rollingStock,
}: MetroLineInfoProps) {
    const [showInfo, setShowInfo] = useState(false);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setShowInfo(false);
                setSelectedStation(null);
            }
        }

        if (showInfo) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showInfo]);

    return (
        <div className="relative">
            <button
                className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-sm hover:bg-gray-200 transition"
                onClick={() => setShowInfo(!showInfo)}
                title="Informations sur la ligne"
            >
                <FiInfo className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>

            {showInfo && (
                <motion.div
                    ref={widgetRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-3xl border border-gray-300 rounded-md shadow-lg bg-white p-4"
                >
                    <div className="flex items-center justify-center mb-4 gap-2">
                        <h2 className="text-lg font-bold">Informations -</h2>
                        <Image
                            src={`/metros/1.png`}
                            alt="Logo Métro"
                            width={25}
                            height={25}
                            className="rounded-full shrink-0"
                        />
                    </div>

                    <div className="flex items-center gap-4 mb-4 justify-around">
                        <div className="flex items-center flex-col"><FaDoorOpen /> {openingDate}</div>
                        <div className="flex items-center flex-col"><FaPeopleGroup /> {dailyRiders}</div>
                        <div className="flex items-center flex-col"><FaTrainSubway /> {rollingStock}</div>
                    </div>
                    <LinePlan />
                </motion.div>
            )}
        </div>
    );
}
