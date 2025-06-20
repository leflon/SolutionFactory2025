import fs, {readFile} from 'fs';
import readline from 'readline';
import Database from 'better-sqlite3';

const db = new Database('db.sqlite');

//#region SCHEMAS
console.log('== Creating Database Schemas... == ');
db.exec(`CREATE TABLE IF NOT EXISTS Routes(route_id TEXT PRIMARY KEY, name TEXT, type TEXT, background_color TEXT, text_color TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS Trips(route_id TEXT, service_id TEXT, trip_id TEXT PRIMARY KEY, direction TEXT, wheelchair_accessible INTEGER, bikes_allowed INTEGER, FOREIGN KEY (route_id) REFERENCES Routes(route_id))`);
db.exec(`CREATE TABLE IF NOT EXISTS StopTimes(trip_id TEXT, departure_time TEXT, stop_id TEXT, stop_sequence INTEGER, PRIMARY KEY (trip_id, stop_id, stop_sequence))`);
db.exec(`CREATE TABLE IF NOT EXISTS Stops(stop_id TEXT PRIMARY KEY, name TEXT, latitude REAL, longitude REAL, zone_id INTEGER, parent_station TEXT, wheelchair_accessible INTEGER, bikes_accessible INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS Transfers(from_id TEXT, to_id TEXT, time INTEGER)`);
//#endregion


//#region Utility Functions
async function saveFileToDatabase(filePath, callback) {
	process.stderr.write(`Saving file: ${filePath}...\n`);
	const startTime = Date.now();
	// Assuming agency.txt is in the same directory as this script.
	if (!fs.existsSync(filePath))
		throw new Error(`File not found: ${filePath}`);

	const fileStream = fs.createReadStream(filePath);

	const rl = readline.createInterface({
		input: fileStream
	});
	const iterator = rl[Symbol.asyncIterator]();

	// Skip the first line (header)
	let i = 0;
	for await (const line of iterator) {
		if (i++ === 0) continue;
		const parsedLine = line.split(',');
		callback(parsedLine);
		process.stdout.write(`\r${i}` + ' '.repeat(10));
	}
	process.stdout.write(`\r(${Date.now() - startTime}ms)${' '.repeat(10)}\n`);
}
//#endregion

//#region Import, Format  & Insert
console.log('== Importing & Saving data... ==');

const metroRouteIds = new Set();
const metroTripIds = new Set();
/* Routes */
await saveFileToDatabase('raw/routes.txt', (parsed) => {
	const query = db.prepare(`INSERT INTO Routes VALUES (?, ?, ?, ?, ?)`);
	if (parsed[5] !== '1')
		return; // Skip non-metro routes
	metroRouteIds.add(parsed[0]);
	query.run(parsed[0], parsed[3], 'metro', parsed[7], parsed[8]);
});


/* Trips */
await saveFileToDatabase('raw/trips.txt', (parsed) => {
	const query = db.prepare(`INSERT INTO Trips VALUES (?, ?, ?, ?, ?, ?)`);
	if (!metroRouteIds.has(parsed[0]))
		return; // Skip non-metro routes
	metroTripIds.add(parsed[2]);
	query.run(parsed[0], parsed[1], parsed[2], parsed[5], Number(parsed[7] === '1'), Number(parsed[8] === '1'));
});
process.exit(1);
process.stdout.write('Importing Trips...');
taskStartTime = Date.now();
generator = readFileLines('raw/trips.txt');
query = db.prepare(`INSERT INTO Trips VALUES (?, ?, ?, ?, ?, ?)`);
let i = 0;
for await (const line of generator) {
	parsed = line.split(',');
	if (!metroRouteIds.has(parsed[0]))
		continue; // Skip non-metro routes
	metroTripIds.add(parsed[2]);
	query.run(parsed[0], parsed[1], parsed[2], parsed[5], Number(parsed[7] === '1'), Number(parsed[8] === '1'));
}
process.stdout.write(`(${Date.now() - taskStartTime}ms)\n`);

/* StopTimes */
process.stdout.write('Importing StopTimes, takes a few minutes...');
taskStartTime = Date.now();
generator = readFileLines('raw/stop_times.txt');
query = db.prepare(`INSERT INTO StopTimes VALUES (?, ?, ?, ?)`);
for await (const line of generator) {
	parsed = line.split(',');
	if (!metroTripIds.has(parsed[0]))
		continue; // Skip non-metro trips
	query.run(parsed[0], parsed[2], parsed[3], Number(parsed[4]));
}
process.stdout.write(`(${Date.now() - taskStartTime}ms)\n`);

//#endregion