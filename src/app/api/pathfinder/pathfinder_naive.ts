const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const dir = '../../../../data/'

function parseTimeToMinutes(timeStr) {
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 60 + m + s / 60;
}

function timeDiff(t1, t2) {
    return parseTimeToMinutes(t2) - parseTimeToMinutes(t1);
}

async function buildGraph(db, startStop, startTime) {
    const graph = {};

    // 1. Trajets dans un même trip
    const trips = await db.all(`
        SELECT DISTINCT Trips.trip_id, route_id
        FROM Trips 
        JOIN StopTimes
        ON Trips.trip_id = StopTimes.trip_id
        WHERE stop_id = ?
        AND departure_time >= ?
        AND departure_time <= ?
        ORDER BY departure_time`,[startStop, startTime, "10:30:00"]);
    for ( const { trip_id } of trips ){
        console.log(trip_id)
    }
    //const timeThreshold = startTime;
    for (const { trip_id } of trips) {
        const stops = await db.all(`
        SELECT stop_id, departure_time
        FROM StopTimes
        WHERE trip_id = ?
        ORDER BY stop_sequence`
        , [trip_id]);
        for (let i = 0; i < stops.length - 1; i++) {
            const from = `${stops[i].stop_id}@${stops[i].departure_time}`;
            const to = `${stops[i + 1].stop_id}@${stops[i + 1].departure_time}`;
            const duration = timeDiff(stops[i].departure_time, stops[i + 1].departure_time);
            if (!graph[from]) graph[from] = [];
            graph[from].push({ to, weight: duration });
        }
    }

    // 2. Transferts entre arrêts
    const transfers = await db.all("SELECT from_id, to_id, time FROM Transfers");
    for (const { from_id, to_id, time } of transfers) {
        const fromKey = `${from_id}@TRANSFER`;
        const toKey = `${to_id}@TRANSFER`;
        if (!graph[fromKey]) graph[fromKey] = [];
        graph[fromKey].push({ to: toKey, weight: time });
    }

    return graph;
}

function dijkstra(graph, startNode) {
    const distances = {};
    const previous = {};
    const queue = new Set(Object.keys(graph));
    console.log(graph["IDFM:480330@09:44:00"])

    for (const node of queue) {
        distances[node] = Infinity;
    }
    distances[startNode] = 0;

    while (queue.size > 0) {
        console.log("n°",queue.size)
        let current = [...queue].reduce((min, node) => distances[node] < distances[min] ? node : min, [...queue][0]);
        queue.delete(current);

        if (!graph[current]) continue;

        for (const neighbor of graph[current]) {
            console.log("HERERERE")
            const alt = distances[current] + neighbor.weight;
            console.log(alt, distances[neighbor.to], current, neighbor, distances[current])
            if (alt < distances[neighbor.to] || !distances[neighbor.to]) {
                console.log(current, " To ", neighbor)
                distances[neighbor.to] = alt;
                previous[neighbor.to] = current;
            }
        }
    }

    return { distances, previous };
}

function reconstructPath(previous, endNode) {
    const p = [];
    let current = endNode;
    console.log(current)
    while (current) {
        console.log(previous[current])
        p.unshift(current);
        current = previous[current];
    }
    return p;
}

async function findBestRoute(startStop, endStop, startTime = "08:00:00") {
    const db = await open({
        filename: path.join(__dirname, dir, 'db.sqlite'),
        driver: sqlite3.Database
    });

    const graph = await buildGraph(db, startStop, startTime);

    const startNodes = Object.keys(graph).filter(n => n.startsWith(`${startStop}@`));
    const endNodes = Object.keys(graph).filter(n => n.startsWith(`${endStop}@`));

    if (startNodes.length === 0 || endNodes.length === 0) {
        console.log("No matching start or end stop found in graph.");
        return;
    }
    const bestStart = startNodes.find(n => parseTimeToMinutes(n.split('@')[1]) >= parseTimeToMinutes(startTime));
    console.log(bestStart)
    if (!bestStart || !graph[bestStart]) {
        console.log("Start node:", bestStart);
        console.log("End nodes:", endNodes.slice(0, 5));
        console.log("Graph has start:", graph.hasOwnProperty(bestStart));
        console.log("Graph size:", Object.keys(graph).length)
        console.error("No valid start node found in the graph for this time.");
        return;
    }

    const { distances, previous } = dijkstra(graph, startNodes[0]);

    let bestEnd = null;
    let minDistance = Infinity;
    console.log(Object.keys(distances).filter(n => n.startsWith(`${startNodes}@`)))
    console.log(Object.keys(distances).filter(n => n.startsWith(`463323@`)))
    console.log(endNodes)
    for (const node of endNodes) {
        if (distances[node] < minDistance) {
            bestEnd = node;
            console.log(bestEnd)
            minDistance = distances[node];
        }
    }

    if (!bestEnd) {
        console.log("No reachable destination found.");
        return;
    }

    const itnry = reconstructPath(previous, endNodes[0]);
    console.log("Best path:");
    itnry.forEach(p => console.log(" -> ", p));
    console.log(`Total travel time: ${minDistance.toFixed(1)} minutes`);

    await db.close();
}


// Exemple d’appel
//findBestRoute("IDFM:21958", "IDFM:463323", "08:00:00");

async function stopIsWhichLine(stop_id){
    const db = await open({
        filename: path.join(__dirname, dir, 'db.sqlite'),
        driver: sqlite3.Database
    });
    const line = await db.all(`
        SELECT DISTINCT route_id
        FROM Trips
        JOIN StopTimes
        ON Trips.trip_id = StopTimes.trip_id
        WHERE stop_id = ? 
        `, [stop_id])
    console.log(line[0]["route_id"]);
    db.close()
}

console.log("Gare de Lyon is on line")
stopIsWhichLine("IDFM:21958")