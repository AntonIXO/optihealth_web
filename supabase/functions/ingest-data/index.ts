// File: supabase/functions/ingest-data/index.ts
// This Edge Function handles the ingestion of zstd-compressed health data points.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
// Import the fzstd library - a pure JavaScript zstd decompression library.
import { decompress } from 'https://esm.sh/fzstd@0.1.1';
import { decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Define the structure of a single data point for type safety.
interface DataPoint {
  metric_source_id: number;
  metric_name: string;
  timestamp: string; // ISO 8601 format
  value_numeric?: number;
  value_text?: string;
  value_json?: Record<string, any>;
}

serve(async (req: Request) => {
  // 1. --- CORS Preflight Handling ---
  // Immediately handle OPTIONS requests for CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 2. --- Authentication and Client Initialization ---
    // Create a Supabase client with the user's auth token to enforce RLS.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    // First get the token from the Authorization header
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // NEW: Get the JSON body, which contains our Base64 string.
    const body = await req.json();
    if (!body || !body.data || typeof body.data !== 'string') {
        return new Response(JSON.stringify({ error: 'Request body must be a JSON object with a "data" property containing a Base64 string.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // NEW: Decode the Base64 string back to binary data (Uint8Array).
    const compressedData = decode(body.data);

    if (compressedData.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'Decoded data cannot be empty.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
      });
    }

    // Decompress the data using the fzstd library.
    const decompressedData = decompress(compressedData);

    // Decode the decompressed byte array (UTF-8) into a JSON string.
    const jsonString = new TextDecoder().decode(decompressedData);

    // Parse the JSON string into our array of data points.
    const dataPoints: DataPoint[] = JSON.parse(jsonString);

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      return new Response(JSON.stringify({ error: 'Decompressed data must be a non-empty array of data points.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. --- Database RPC Call ---
    // Call the PostgreSQL function `bulk_insert_data_points` to insert the data.
    const { error } = await supabaseClient.rpc('bulk_insert_data_points', {
      points: dataPoints,
    });

    if (error) {
      console.error('RPC Error:', error);
      return new Response(JSON.stringify({ error: 'Failed to insert data.', details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. --- Success Response ---
    return new Response(JSON.stringify({ message: `Successfully ingested ${dataPoints.length} data points.` }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });

  } catch (e) {
    console.error('Unexpected Error:', e);
    // Check for common errors, like malformed compressed data.
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
