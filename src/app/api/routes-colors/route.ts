import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export async function GET() {
  try {
    const db = new Database('C:/Users/gaspa/OneDrive/Bureau/MasterCamp/SolutionFactory2025/data/db.sqlite', { readonly: true });
    const stmt = db.prepare('SELECT route_id, background_color FROM Routes');
    const rows = stmt.all();
    db.close();
    return NextResponse.json(rows);
  } catch (e) {
    console.error('Error in /api/routes-colors:', e);
    return NextResponse.json([], { status: 500 });
  }
}
