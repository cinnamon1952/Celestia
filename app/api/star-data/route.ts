/**
 * API Route: Star Data
 * 
 * Serves the star catalog as JSON
 * This allows for future enhancements like:
 * - Pagination for larger catalogs
 * - Filtering by magnitude or region
 * - Dynamic data loading
 */

import { NextResponse } from 'next/server';
import starData from '@/lib/data/stars.json';

export async function GET() {
  return NextResponse.json(starData);
}
