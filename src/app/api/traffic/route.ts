import { getStopLine } from '@/lib/db';
import { Incident } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Converts an IDFM Date string to a Date object.
 *
 * Because they use the `YYYYMMDDTHHMMSS` format rather
 * than the INTERNATIONAL STANDARD ORGANIZATION FORMAT supported by JavaScript's Date constructor.
 * @param dateString The IDFM Date string
 * @returns The converted Date object
 */
const convertDate = (dateString: string) => {
	const parser = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/gi;
	const match = parser.exec(dateString);
	if (!match) return null;
	const [, year, month, day, hour, minute, second] = match;
	return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
};

const parseId = (id: string) => {
	const parsed = /(IDFM:\w+)/gi.exec(id);
	return parsed ? parsed[1] : null;
};

/**
 * The cached response for this endpoint, to avoid sending too many requests to IDFM API,
 * which is rate-limited
 */
let cachedResponse: Incident[] | null = null;
/** The last time data was fetched from IDFM API */
let lastUpdate = new Date();
/** The Time To Live of the cached response */
const cacheTTL = 1000 * 60 * 2; // 2 minutes cache

export async function GET(req: NextRequest) {
	if (cachedResponse && lastUpdate.getTime() + cacheTTL > Date.now()) {
		return NextResponse.json({
			incidents: cachedResponse,
			lastUpdate: lastUpdate,
			ttl: cacheTTL
		});
	}
	const res = await fetch(
		'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/line_reports/physical_modes%2Fphysical_mode%3AMetro/line_reports',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'apiKey': process.env.IDFM_API_KEY
			}
		}
	);
	const { disruptions } = await res.json();
	const processedIncidents: Incident[] = [];
	for (const disruption of disruptions) {
		if (disruption.status === 'past') continue;
		if (disruption.tags.includes('Ascenseur')) continue;
		if (disruption.severity.name === 'information') continue;
		const incident: Partial<Incident> = {};
		incident.applicationPeriods = disruption.application_periods.map(
			(period: { begin: string; end: string }) => ({
				begin: convertDate(period.begin),
				end: convertDate(period.end)
			})
		);
		incident.status = disruption.status;
		incident.cause =
			disruption.cause === 'travaux' ? 'maintenance' : 'disruption';
		incident.severity = {
			name: disruption.severity.name,
			effect: disruption.severity.effect,
			color: disruption.severity.color
		};
		incident.title = disruption.messages.find(
			(m: any) => m.channel.name === 'titre'
		)?.text;
		incident.message = disruption.messages.find(
			(m: any) => m.channel.name === 'moteur'
		)?.text;
		incident.shortMessage = disruption.messages.find(
			(m: any) => m.channel.name === 'cbiv'
		)?.text;
		incident.impactedObjects = disruption.impacted_objects.map(
			(object: any) => {
				switch (object.pt_object.embedded_type) {
					case 'line':
						if (!incident.line)
							incident.line = {
								id:
									parseId(object.pt_object.line.id) || object.pt_object.line.id,
								name: object.pt_object.line.name
							};
						return {
							object: {
								id: parseId(object.pt_object.line.id),
								name: object.pt_object.line.name,
								type: 'line'
							},
							impactedSection: object.impacted_section
								? {
										from: {
											id: parseId(object.impacted_section.from.id),
											name: object.impacted_section.from.stop_area.name,
											coord: {
												lat: parseFloat(
													object.impacted_section.from.stop_area.coord.lat
												),
												lon: parseFloat(
													object.impacted_section.from.stop_area.coord.lon
												)
											}
										},
										to: {
											id: parseId(object.impacted_section.to.id),
											name: object.impacted_section.to.stop_area.name,
											coord: {
												lat: parseFloat(
													object.impacted_section.to.stop_area.coord.lat
												),
												lon: parseFloat(
													object.impacted_section.to.stop_area.coord.lon
												)
											}
										}
									}
								: undefined
						};
					case 'stop_point':
					case 'stop_area':
						const type = object.pt_object.embedded_type;
						const stopId = parseId(object.pt_object[type].id)!;
						const line = getStopLine(stopId);
						if (!incident.line) incident.line = line;
						return {
							object: {
								id: stopId,
								name: object.pt_object[type].name,
								type,
								line,
								coord: {
									lat: parseFloat(object.pt_object[type].coord.lat),
									lon: parseFloat(object.pt_object[type].coord.lon)
								}
							}
						};
				}
			}
		);
		processedIncidents.push(incident as Incident);
	}
	cachedResponse = processedIncidents;
	lastUpdate = new Date();
	return NextResponse.json({
		incidents: processedIncidents,
		lastUpdate: lastUpdate,
		ttl: cacheTTL
	});
}
