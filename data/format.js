import fs, {readFile} from 'fs';
import readline from 'readline';
import Database from 'better-sqlite3';

const db = new Database('db.sqlite');

//#region CLI
// Check which datasets to import
const AVAILABLE_DATASETS = ['routes', 'trips', 'stop_times', 'stops', 'transfers'];
let importDatasets = [];
let excludeDatasets = [];

const importArgIndex = process.argv.indexOf('--import');
const excludeArgIndex = process.argv.indexOf('--exclude');

// --import flag has priority over --exclude
if (importArgIndex !== -1 && process.argv.length > importArgIndex + 1)
	importDatasets = process.argv[importArgIndex + 1].split(',').map(s => s.trim()).filter(Boolean);
else if (excludeArgIndex !== -1 && process.argv.length > excludeArgIndex + 1)
	excludeDatasets = process.argv[excludeArgIndex + 1].split(',').map(s => s.trim()).filter(Boolean);

let datasetsToImport;
if (importDatasets.length > 0) datasetsToImport = AVAILABLE_DATASETS.filter(ds => importDatasets.includes(ds));
else if (excludeDatasets.length > 0) datasetsToImport = AVAILABLE_DATASETS.filter(ds => !excludeDatasets.includes(ds));
else datasetsToImport = [...AVAILABLE_DATASETS];
//#endregion

//#region SCHEMAS
console.log(`== Datasets to import: ${datasetsToImport.join(', ')} ==`);
// Drop tables for selected datasets
for (const dataset of datasetsToImport) {
	// For stop_times to become StopTimes
	const tableName = dataset.replace(/_(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toUpperCase());
	db.exec(`DROP TABLE IF EXISTS ${tableName}`);
}

console.log('== Creating Database Schemas... == ');
db.exec(`CREATE TABLE IF NOT EXISTS Routes(route_id TEXT PRIMARY KEY, name TEXT, type TEXT, background_color TEXT, text_color TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS Trips(route_id TEXT, service_id TEXT, trip_id TEXT PRIMARY KEY, direction TEXT, wheelchair_accessible INTEGER, bikes_allowed INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS StopTimes(trip_id TEXT, departure_time TEXT, stop_id TEXT, stop_sequence INTEGER, PRIMARY KEY (trip_id, stop_id, stop_sequence))`);
db.exec(`CREATE TABLE IF NOT EXISTS Stops(stop_id TEXT PRIMARY KEY, name TEXT, latitude REAL, longitude REAL, zone_id INTEGER, parent_station TEXT, wheelchair_accessible INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS Transfers(from_id TEXT, to_id TEXT, time INTEGER)`);
//#endregion

//#region Utility Functions
/**
 * Reads a CSV file line by line and applies a callback function to each parsed line.
 * This function is used to import data from the GTFS dataset into the SQLite database.
 * @param {string} filePath the file to import
 * @param {(parsed: string[]) => any} callback The actions to perform for each item in the dataset
 */
async function saveFileToDatabase(filePath, callback) {
	console.log(`Saving data from file: ${filePath}...`);
	const startTime = Date.now();

	if (!fs.existsSync(filePath))
		throw new Error(`File not found: ${filePath}`);

	/* Using a ReadableStream avoids loading the whole file into memory */
	const fileStream = fs.createReadStream(filePath);

	const rl = readline.createInterface({
		input: fileStream
	});
	const iterator = rl[Symbol.asyncIterator]();

	let i = 0;
	for await (const line of iterator) {
		// Skip the first line (header)
		if (i++ === 0) continue;
		const parsedLine = line.split(',');
		callback(parsedLine);
		// Display how much has been treated. Blank spaces are added to avoid display issues
		process.stdout.write(`\r${i}` + ' '.repeat(10));
	}
	process.stdout.write(`\r(${Date.now() - startTime}ms)${' '.repeat(10)}\n`);
}
//#endregion

//#region Import, Format  & Insert
console.log('== Importing & Saving data... ==');

/* These sets are used to avoid saving data that is not related to the Metro network into Database
(we ignore RER, Transilien, etc.) */
const metroRouteIds = new Set();
const metroTripIds = new Set();
const metroStopIds = new Set();

/* Routes */
if (datasetsToImport.includes('routes')) {
	const insert = db.prepare(`INSERT INTO Routes VALUES (?, ?, ?, ?, ?)`);
	// By default, each `db.run` call is ran into its own implicit transaction, which dramatically slows down the process.
	// To avoid overhead, we open the transaction explicitely and include all queries for this dataset in it.
	db.exec('BEGIN');
	try {
		await saveFileToDatabase('raw/routes.txt', (parsed) => {
			if (parsed[5] !== '1') return; // Skip non-metro routes
			metroRouteIds.add(parsed[0]);
			insert.run(parsed[0], parsed[3], 'metro', parsed[7], parsed[8]);
		});
		db.exec('COMMIT');
	} catch (e) {db.exec('ROLLBACK'); throw e;}
} else {
	// If we don't re-import routes from the dataset, we still need the IDs
	// of metro-only routes in order to perform the filtering of the next datasets.
	console.log('Fetching metro route IDs from database...');
	const query = db.prepare(`SELECT route_id FROM Routes`);
	const rows = query.all();
	for (const row of rows)
		metroRouteIds.add(row.route_id);
	console.log(`Found ${metroRouteIds.size} metro route IDs.`);
}

/* Trips */
if (datasetsToImport.includes('trips')) {
	const insert = db.prepare(`INSERT INTO Trips VALUES (?, ?, ?, ?, ?, ?)`);
	db.exec('BEGIN');
	try {
		await saveFileToDatabase('raw/trips.txt', (parsed) => {
			if (!metroRouteIds.has(parsed[0])) return; // Skip non-metro routes
			metroTripIds.add(parsed[2]);
			insert.run(parsed[0], parsed[1], parsed[2], parsed[5], Number(parsed[7] === '1'), Number(parsed[8] === '1'));
		});
		db.exec('COMMIT');
	} catch (e) {db.exec('ROLLBACK'); throw e;}
} else {
	console.log('Fetching metro trip IDs from database...');
	// We don't import trips, but we need to fetch the trip IDs to filter stop times
	const query = db.prepare(`SELECT trip_id FROM Trips`);
	const rows = query.all();
	for (const row of rows)
		metroTripIds.add(row.trip_id);
	console.log(`Found ${metroTripIds.size} metro trip IDs.`);
}

/* StopTimes */
if (datasetsToImport.includes('stop_times')) {
	const insert = db.prepare(`INSERT INTO StopTimes VALUES (?, ?, ?, ?)`);
	db.exec('BEGIN');
	try {
		await saveFileToDatabase('raw/stop_times.txt', (parsed) => {
			if (!metroTripIds.has(parsed[0])) return; // Skip non-metro trips
			metroStopIds.add(parsed[3]);
			insert.run(parsed[0], parsed[2], parsed[3], Number(parsed[4]));
		});
		db.exec('COMMIT');
	} catch (e) {db.exec('ROLLBACK'); throw e;}
} else {
	console.log('Fetching metro stop IDs from database...');
	// We don't import stop times, but we need to fetch the stop IDs to filter stops and transfers
	const query = db.prepare(`SELECT stop_id FROM StopTimes`);
	const rows = query.all();
	for (const row of rows)
		metroStopIds.add(row.stop_id);
	console.log(`Found ${metroStopIds.size} metro stop IDs.`);
}

/* Stops */
if (datasetsToImport.includes('stops')) {
	const insert = db.prepare(`INSERT INTO Stops VALUES (?, ?, ?, ?, ?, ?, ?)`);
	db.exec('BEGIN');
	try {
		await saveFileToDatabase('raw/stops.txt', (parsed) => {
			if (!metroStopIds.has(parsed[0])) return; // Skip non-metro stops
			insert.run(parsed[0], parsed[2], parseFloat(parsed[4]), parseFloat(parsed[5]), parseInt(parsed[6]), parsed[9] || null, Number(parsed[10] === '1'));
		});
		db.exec('COMMIT');
	} catch (e) {db.exec('ROLLBACK'); throw e;}
}

/* Transfers */
if (datasetsToImport.includes('transfers')) {
	const insert = db.prepare(`INSERT INTO Transfers VALUES (?, ?, ?)`);
	db.exec('BEGIN');
	try {
		await saveFileToDatabase('raw/transfers.txt', (parsed) => {
			if (!metroStopIds.has(parsed[0]) || !metroStopIds.has(parsed[1])) return; // Skip non-metro transfers
			insert.run(parsed[0], parsed[1], parseInt(parsed[3]));
		});
		db.exec('COMMIT');
	} catch (e) {db.exec('ROLLBACK'); throw e;}
}

//#endregion
