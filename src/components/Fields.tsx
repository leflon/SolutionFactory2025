import translations from "@/lang/translations";

type Language = 'en' | 'fr';

const Fields: React.FC<{ language: Language }> = ({ language }) => {
  const t = translations[language];
  return (
    <div className="flex flex-col items-left justify-center h-screen border border-gray-300 dark:border-gray-600 rounded-sm max-w-60 max-h-60 m-5 shadow-md dark:shadow-lg">
      <form className="flex flex-col justify-center items-center gap-2">
        <label className="dark:text-white">{t.departure}</label>
        <input type="text" className="w-50 border-2 rounded-sm dark:border-white dark:text-white"></input>
        <label className="dark:text-white">{t.arrival}</label>
        <input type="text" className="w-50 border-2 rounded-sm dark:border-white dark:text-white"></input>
        <button
          type="submit"
          className="w-32 px-3 py-1 mt-2 border-2 border-green-600 text-green-500 dark:border-pink-400 dark:text-pink-400 font-medium rounded-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-green-600 hover:text-white hover:dark:bg-pink-400 hover:dark:text-white"
        >
          {t.calculate}
        </button>
      </form>
    </div>
  );
}

export default Fields;