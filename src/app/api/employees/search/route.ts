import { NextResponse } from 'next/server';
import { readEmployeesData } from '@/lib/employeeData';
import Fuse from 'fuse.js';

// GET search employees with fuzzy matching
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const data = await readEmployeesData();

    // Configure Fuse.js for fuzzy searching
    const fuse = new Fuse(data.employees, {
      keys: [
        { name: 'firstName', weight: 0.4 },
        { name: 'lastName', weight: 0.4 },
        { name: 'email', weight: 0.2 }
      ],
      threshold: 0.4, // 0 = exact match, 1 = match anything
      includeScore: true,
      minMatchCharLength: 2
    });

    const results = fuse.search(query);

    // Return the actual employee objects (limit to top 20 results)
    const employees = results.slice(0, 20).map(result => result.item);

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Failed to search employees:', error);
    return NextResponse.json(
      { error: 'Failed to search employees' },
      { status: 500 }
    );
  }
}
