const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const dir = '../../../../data/'
/*
function parseTimeToMinutes(timeStr) {
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 60 + m + s / 60;
}

function timeDiff(t1, t2) {
    return parseTimeToMinutes(t2) - parseTimeToMinutes(t1);
}

async function buildGraph(startTime) {
    const graph = {};

    // 1. Trajets dans un même trip
    const trips = await db.all(`
        SELECT DISTINCT Trips.trip_id 
        FROM Trips 
        JOIN StopTimes
        ON Trips.trip_id = StopTimes.trip_id
        WHERE departure_time >= ?
        GROUP BY route_id
        ORDER BY departure_time`,[startTime]);
    const timeThreshold = startTime;
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
            //if (!graph[from]) graph[from] = [];
            //graph[from].push({ to, weight: duration });
        }
    }

    // 2. Transferts entre arrêts
    const transfers = await db.all("SELECT from_id, to_id, time FROM Transfers");
    for (const { from_id, to_id, time } of transfers) {
        const fromKey = `${from_id}@TRANSFER`;
        const toKey = `${to_id}@TRANSFER`;
        //if (!graph[fromKey]) graph[fromKey] = [];
        //graph[fromKey].push({ to: toKey, weight: time });
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
        console.log(queue.size)
        let current = [...queue].reduce((min, node) => distances[node] < distances[min] ? node : min, [...queue][0]);
        queue.delete(current);

        if (!graph[current]) continue;

        for (const neighbor of graph[current]) {
            console.log("HERERERE")
            const alt = distances[current] + neighbor.weight;
            console.log(alt, distances[neighbor.to], current, neighbor, distances[current])
            if (alt < distances[neighbor.to] || !distances[neighbor.to]) {
                console.log("THERRERERRE")
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

    const graph = await buildGraph(db, startTime);

    const startNodes = Object.keys(graph).filter(n => n.startsWith(`${startStop}@`));
    const endNodes = Object.keys(graph).filter(n => n.startsWith(`${endStop}@`));

    if (startNodes.length === 0 || endNodes.length === 0) {
        console.log("No matching start or end stop found in graph.");
        return;
    }
    console.log(startNodes)
    //const bestStart = startNodes.find(n => parseTimeToMinutes(n.split('@')[1]) >= parseTimeToMinutes(startTime));
    //console.log(bestStart)
    //if (!bestStart) {
      //  console.log("No valid starting time found.");
        //return;
    //}

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

    //if (!bestEnd) {
    //    console.log("No reachable destination found.");
    //    return;
    //}

    const itnry = reconstructPath(previous, endNodes[0]);
    console.log("Best path:");
    itnry.forEach(p => console.log(" -> ", p));
    console.log(`Total travel time: ${minDistance.toFixed(1)} minutes`);

    await db.close();
}


// Exemple d’appel
//findBestRoute("IDFM:21958", "IDFM:463323", "08:00:00");



/*
async function stopIsOnWhichLine(db, stop_id){
    const fetchLine = await db.all(`
        SELECT DISTINCT route_id, stop_id
        FROM Trips
        JOIN StopTimes
        ON Trips.trip_id = StopTimes.trip_id
        WHERE stop_id = ? 
        `, [stop_id])
    const line = fetchLine[0]["route_id"];
    console.log(line)
    return line;
}


async function LineIntersection(){
    const db = await open({
        filename: path.join(__dirname, dir, 'db.sqlite'),
        driver: sqlite3.Database
    });
    const fetchIntersec = await db.all(`
        SELECT route_id from_id, to_id, 
        FROM Transfers, Trips
        JOIN StopTimes
        ON StopTimes.stop_id = Transfers.from_id
        JOIN Trips
        ON Trips.trip_id = StopTimes.trip_id
        WHERE stop_id = ? 
        `)
    const stops = fetchIntersec
    console.log(stops)
    
    console.log(stops[0]["route_id"], stops[0]["stop_id"], stops[0]["to_id"], stops.length)
    
    const FetchLines = await db.all(`
    SELECT route_id
    FROM Routes
    `)
    const Lines = FetchLines
    console.log(Lines.length)
    for (let i = 0; i < Lines.length; i++){
        const line = Lines[i]
        for (let j = 0; j < stops.length; j++){
            const stop = stops[i]
            console.log(line["route_id"], stopIsOnWhichLine(db, stop["from_id"]))
            if (line["route_id"] == stopIsOnWhichLine(db, stop["from_id"]))
                console.log(stops.find( (e) => e["from_id"] == stop["from_id"]))
        }

    }
    

    db.close()
}

//LineIntersection()
*/


async function computeIntersections() {
    const db = await open({
    filename: path.join(__dirname, dir, 'db.sqlite'),
    driver: sqlite3.Database
});

  const transfers = await db.all("SELECT from_id, to_id FROM transfers");

  const transferStops = new Set();
  const transferDict = {}
  transfers.forEach( row => {
    const from = row.from_id
    const to = row.to_id
    if(!transferDict[from]){
        transferDict[from] = []
    }
    transferDict[from].push(to)
    transferStops.add(from);
    transferStops.add();
  })

  const stopRoutes = await db.all(`
    SELECT DISTINCT stop_id, Trips.route_id
    FROM StopTimes
    JOIN Trips
    ON StopTimes.trip_id = Trips.trip_id
  `);

  const stopRouteDict = {}
  const routeOfStopDict = {}
  stopRoutes.forEach(row =>{
    const route = row.route_id
    const stop = row.stop_id
    routeOfStopDict[stop] = route
    if(!stopRouteDict[route]){
        stopRouteDict[route] = []
    }
    stopRouteDict[route].push(stop)
  })

  const stopNames= await db.all(`
      SELECT stop_id, plain_name
      FROM Stops
      `)
  const stopNamesDict = {}
  stopNames.forEach(row => {
    const stop = row.stop_id
    const name = row.plain_name
    stopNamesDict[stop] = name
  })

  return [transferDict, stopRouteDict, routeOfStopDict, stopNamesDict]
}

function dijkstra(start, stop){
    const dicts = computeIntersections()
    const transferDict = dicts[0]
    const stopRouteDict = dicts[1]
    const routeOfStopDict = dicts[2]


}


async function findMinTransfers(startStop, endStop, maxResults = 3) {
    const dicts = await computeIntersections()
    const transferDict = dicts[0]
    const stopRouteDict = dicts[1]
    const routeOfStopDict = dicts[2]
    const stopNamesDict = dicts[3]

    const startRoutes = Array.isArray(routeOfStopDict[startStop])
    ? routeOfStopDict[startStop]
    : [routeOfStopDict[startStop]];

  const endRoutes = new Set(
    Array.isArray(routeOfStopDict[endStop])
      ? routeOfStopDict[endStop]
      : [routeOfStopDict[endStop]]
  );

  if (!startRoutes[0] || endRoutes.size === 0) return [];

  const results = [];
  const seenPaths = new Set(); // Pour filtrer les doublons
  const queue = [];

  for (const route of startRoutes) {
    const initialPath = [{ route, via: startStop }];
    const key = pathKey(initialPath, stopNamesDict);
    seenPaths.add(key);

    queue.push({
      route,
      transfers: 0,
      path: initialPath,
      visitedRoutes: new Set([route])
    });
  }

  while (queue.length > 0 && results.length < maxResults) {
    const {
      route: currentRoute,
      transfers,
      path,
      visitedRoutes
    } = queue.shift();

    const stops = stopRouteDict[currentRoute] || [];

    for (const stop of stops) {
      const transferStops = transferDict[stop] || [];

      for (const transferStop of transferStops) {

        const nextRoutesRaw = routeOfStopDict[transferStop];
        const nextRoutes = Array.isArray(nextRoutesRaw)
          ? nextRoutesRaw
          : [nextRoutesRaw];

        for (const nextRoute of nextRoutes) {
          if (!nextRoute || visitedRoutes.has(nextRoute)) continue;

          const newVisited = new Set(visitedRoutes);
          newVisited.add(nextRoute);

          const newPath = [...path, { route: nextRoute, via: transferStop }];
          const key = pathKey(newPath, stopNamesDict);

          if (seenPaths.has(key)) continue;
          seenPaths.add(key);

          if (endRoutes.has(nextRoute)) {
            results.push({
              transfers: transfers + 1,
              path: newPath
            });

            if (results.length >= maxResults) break;
          } else {
            queue.push({
              route: nextRoute,
              transfers: transfers + 1,
              path: newPath,
              visitedRoutes: newVisited
            });
          }
        }

        if (results.length >= maxResults) break;
      }

      if (results.length >= maxResults) break;
    }

  }

  return results;
}

// Génère une clé unique à partir d'un chemin
function pathKey(path, stopNamesDict) {
  return path.map(step => `${step.route}-${stopNamesDict[step.via]})}`).join(" > ");
}

//findMinTransfers("IDFM:463197", "IDFM:463323", 5).then(res => console.log(res?.path.forEach(line => console.log(line))))

findMinTransfers("IDFM:463193", "IDFM:463323", 10).then(res => res.forEach(itin => { 
    console.log(itin)
    itin.path.forEach( path => console.log(path)) 
    console.log("----------NEXT--------")
}))
