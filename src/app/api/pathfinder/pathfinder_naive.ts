const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const dir = '../../../../data/'

function addSecondsToTime(timeStr, secondsToAdd) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);

  // Convert time to total seconds
  let totalSeconds = hours * 3600 + minutes * 60 + seconds + secondsToAdd;

  // Convert back to hh:mm:ss
  const newHours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const newMinutes = Math.floor(totalSeconds / 60);
  const newSeconds = totalSeconds % 60;

  // Format with leading zeros
  const pad = n => n.toString().padStart(2, '0');

  return `${pad(newHours)}:${pad(newMinutes)}:${pad(newSeconds)}`;
}


async function computeIntersections(db) {

  const transfers = await db.all("SELECT from_id, to_id, time FROM transfers");

  const transferStops = new Set();
  const transferDict = {}
  const transferTimeDict = {}

  transfers.forEach( row => {
    const from = row.from_id
    const to = row.to_id
    if(!transferDict[from]){
        transferDict[from] = []
    }
    transferDict[from].push(to)

    transferTimeDict[from+ "->"+ to] = row.time

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

  return [transferDict, stopRouteDict, routeOfStopDict, stopNamesDict, transferTimeDict]
}


async function findMinTransfers(startStop, endStop, maxResults = 3, dicts) {
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

          const newPath = [...path, { route: nextRoute, from: stop, via: transferStop}];
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


async function fastestPath(path, dicts, endStop, startTime, db){


    const transferDict = dicts[0]
    const stopRouteDict = dicts[1]
    const routeOfStopDict = dicts[2]
    const stopNamesDict = dicts[3]
    const transferTimeDict = dicts[4]

    

    for (let i = 0; i < path.length; i++){

        const currentPath = path[i]
        var currentTime = startTime

        console.log('Path n°', i+1)
        console.log("-------------------------------------------------------")

        for (let j = 0; j < currentPath.path.length; j++){
            const segment = currentPath.path[j]
            var targetStop;
            if ( j+1 < currentPath.path.length){
                targetStop = currentPath.path[j+1].from
            } else{
                targetStop = endStop
            }
            
            
            
            var viaOtherWay;
            transferDict[segment.via].forEach(
                transfer =>{
                    if (routeOfStopDict[transfer] == routeOfStopDict[segment.via]){
                        viaOtherWay = transfer
                    }
                }  
            )

            var targetOtherWay;
            transferDict[targetStop].forEach(
                transfer =>{
                    if (routeOfStopDict[transfer] == routeOfStopDict[segment.via]){
                        targetOtherWay = transfer
                    }
                }  
            )

            console.log(segment.via, viaOtherWay)
            console.log(targetStop, targetOtherWay)
            const segmentTrip1 = await db.all(`
                SELECT st.trip_id, t1.direction, st.departure_time, st.stop_sequence
                FROM StopTimes st
                LEFT JOIN Trips t1 ON st.trip_id = t1.trip_id
                WHERE st.stop_id = ?
                AND st.trip_id IN (SELECT trip_id FROM StopTimes WHERE stop_id IN (?,?))
                AND st.departure_time >= ?
                ORDER BY st.departure_time, t1.direction
				LIMIT 1
                `,[segment.via, targetStop, targetOtherWay, currentTime]);

            const segmentTrip2 = await db.all(`
                SELECT st.trip_id, t1.direction, st.departure_time, st.stop_sequence
                FROM StopTimes st
                LEFT JOIN Trips t1 ON st.trip_id = t1.trip_id
                WHERE st.stop_id = ?
                AND st.trip_id IN (SELECT trip_id FROM StopTimes WHERE stop_id IN (?,?))
                AND st.departure_time >= ?
                ORDER BY st.departure_time, t1.direction
				LIMIT 1
                `,[viaOtherWay, targetStop, targetOtherWay, currentTime]);
            
            console.log(segmentTrip1[0],segmentTrip2[0])

            const targetSequence  = await db.all(`
                SELECT st.trip_id, direction, stop_id, stop_sequence, departure_time 
                FROM StopTimes st
                JOIN Trips t ON st.trip_id = t.trip_id
                WHERE (st.trip_id = ?
                OR st.trip_id = ?)
                AND (st.stop_id = ?
                OR st.stop_id = ?)
                AND departure_time > ?
                `,
                [
                    segmentTrip1[0].trip_id, 
                    segmentTrip2[0].trip_id,
                    targetStop,
                    targetOtherWay,
                    segmentTrip1[0].departure_time
                ])
                console.log(targetSequence[0])
                if( targetStop == endStop){
                    currentTime = targetSequence[0].departure_time
                } else{
                    currentTime = addSecondsToTime(targetSequence[0].departure_time, transferTimeDict[targetSequence[0].stop_id + "->" + currentPath.path[j+1].via])
                }
                
                console.log(currentTime)
            

            

        }
        currentPath.time = currentTime
        
    }
    var minPath;
    var minTime = "30:00:00";
    path.forEach( currentPath => {
        console.log(currentPath.time)
        if(currentPath.time < minTime){
            minPath = currentPath;
            minTime = currentPath.time
        } 
    })
    return minPath
}




function reconstructPath(path, dicts){
    const transferDict = dicts[0]
    const stopRouteDict = dicts[1]
    const routeOfStopDict = dicts[2]
    const stopNamesDict = dicts[3]

    const segments = []
    for (let i = 0; i < path.length; i++) {}
}

//findMinTransfers("IDFM:463197", "IDFM:463323", 5).then(res => console.log(res?.path.forEach(line => console.log(line))))


async function test(){
    const db = await open({
        filename: path.join(__dirname, dir, 'db.sqlite'),
        driver: sqlite3.Database
    });

    const startStop = "IDFM:463193"
    const endStop = "IDFM:463323"

    const dicts = await computeIntersections(db)

    const results = await findMinTransfers(startStop, endStop, 8, dicts)

    
    await findMinTransfers(startStop, endStop, 10, dicts).then(res => res.forEach(itin => { 
        console.log(itin)
        itin.path.forEach( path => console.log(path)) 
        console.log("----------NEXT--------")
    }))

    const minPath = await fastestPath(results, dicts, endStop, "08:00:00", db)


    minPath.path.forEach( segment => console.log(segment))
    console.log(minPath)

    console.log("Program Over")


    db?.close
}

test()