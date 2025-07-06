import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import db from '@/lib/db';

export async function GET() {
	try {
		const stmt = db.prepare('SELECT route_id, background_color FROM Routes');
		const rows = stmt.all();
		return NextResponse.json(rows);
	} catch (e) {
		console.error('Error in /api/routes-colors:', e);
		return NextResponse.json([], { status: 500 });
	}
}
