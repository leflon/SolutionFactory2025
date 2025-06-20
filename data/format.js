import fs, {readFile} from 'fs';
import readline from 'readline';
import Database from 'better-sqlite3';

const db = new Database('db.sqlite');

//#region SCHEMAS
console.log('== Creating Database Schemas...');
db.exec(`CREATE TABLE IF NOT EXISTS Routes(route_id TEXT PRIMARY KEY, name TEXT, type TEXT, background_color TEXT, text_color TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS Trips(route_id TEXT, trip_id TEXT PRIMARY KEY, service_id TEXT, name TEXT, direction TEXT, wheelchair_accessible INTEGER, bikes_accessible INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS StopTimes(trip_id TEXT, arrival_time TEXT, departure_time TEXT, stop_id TEXT, stop_sequence INTEGER, PRIMARY KEY (trip_id, stop_id, stop_sequence))`);
db.exec(`CREATE TABLE IF NOT EXISTS Stops(stop_id TEXT PRIMARY KEY, name TEXT, latitude REAL, longitude REAL, zone_id INTEGER, parent_station TEXT, wheelchair_accessible INTEGER, bikes_accessible INTEGER)`);
db.exec(`CREATE TABLE IF NOT EXISTS Transfers(from_id TEXT, to_id TEXT, time INTEGER)`);
//#endregion


//#region Utility Functions
async function* readFileLines(filePath) {
	// Assuming agency.txt is in the same directory as this script.
	if (!fs.existsSync(filePath))
		throw new Error(`File not found: ${filePath}`);

	const fileStream = fs.createReadStream(filePath);

	const rl = readline.createInterface({
		input: fileStream
	});

	// Skip the first line (header)
	const iterator = rl[Symbol.asyncIterator]();
	await iterator.next(); // Discard the first line
	for await (const line of iterator)
		yield line;
}
//#endregion

//#region Import, Format  & Insert
console.log('== Importing Routes...');

let generator, parsed, query;
/* Routes */
generator = readFileLines('raw/routes.txt');
query = db.prepare(`INSERT INTO ROUTES VALUES (?, ?, ?, ?, ?)`);

const routeTypes = ['tramway', 'metro', 'train', 'bus'];
for await (const line of generator) {
	parsed = line.split(',');
	const type = routeTypes[parsed[5]] || 'fun'; // Fun for funicular, as its number id is 7.
	query.run(parsed[0], parsed[3], type, parsed[7], parsed[8]);
}



//#endregion