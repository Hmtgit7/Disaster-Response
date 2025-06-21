import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client for regular operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service role for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database initialization function
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // For development with mock credentials, we'll skip table creation
    // and just check if we can connect to the database
    const { data, error } = await supabase.from('disasters').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Tables do not exist. Using mock data mode for development...');
      // In development mode, we'll use in-memory data instead
      return;
    }
    
    if (error) {
      console.error('Database connection error:', error);
      console.log('Using mock data mode for development...');
      return;
    }
    
    // If we get here, tables exist, so insert sample data
    await insertSampleData();
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.log('Using mock data mode for development...');
  }
};

const insertSampleData = async () => {
  try {
    // Check if sample data already exists
    const { data: existingDisasters } = await supabase
      .from('disasters')
      .select('id')
      .limit(1);

    if (existingDisasters && existingDisasters.length > 0) {
      console.log('Sample data already exists, skipping...');
      return;
    }

    // Insert sample disasters
    const sampleDisasters = [
      {
        title: 'NYC Flood Emergency',
        location_name: 'Manhattan, NYC',
        location: 'POINT(-74.0060 40.7128)',
        description: 'Heavy flooding in Manhattan affecting Lower East Side and Financial District',
        tags: ['flood', 'urgent', 'manhattan'],
        owner_id: 'netrunnerX'
      },
      {
        title: 'California Wildfire',
        location_name: 'Los Angeles, CA',
        location: 'POINT(-118.2437 34.0522)',
        description: 'Major wildfire spreading rapidly in Los Angeles County',
        tags: ['wildfire', 'california', 'emergency'],
        owner_id: 'reliefAdmin'
      },
      {
        title: 'Texas Tornado',
        location_name: 'Dallas, TX',
        location: 'POINT(-96.7970 32.7767)',
        description: 'Tornado touchdown reported in Dallas metropolitan area',
        tags: ['tornado', 'texas', 'dallas'],
        owner_id: 'netrunnerX'
      }
    ];

    for (const disaster of sampleDisasters) {
      await supabase.from('disasters').insert(disaster);
    }

    console.log('Sample data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}; 