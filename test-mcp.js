// Simple test for MCP server
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting MCP server test...');

// Start the MCP server process
const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')]);

// Log stderr - this is where all the server logs should go
serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER LOG]: ${data.toString().trim()}`);
});

// Wait for server to start up
setTimeout(() => {
  console.log('Sending request to MCP server...');
  
  // Send a standard MCP request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list', // This is the correct MCP method name
    params: {}
  };
  
  const requestJson = JSON.stringify(request);
  console.log(`Request: ${requestJson}`);
  serverProcess.stdin.write(requestJson + '\n');
  
  // Collect stdout (this should be JSON-RPC responses)
  let responseData = '';
  serverProcess.stdout.on('data', (data) => {
    console.log(`Received data: ${data.toString()}`);
    responseData += data.toString();
    
    try {
      // Try to parse as JSON to see if we have a complete response
      const response = JSON.parse(responseData);
      console.log('Response received:');
      console.log(JSON.stringify(response, null, 2));
      
      // Close the server after getting a response
      setTimeout(() => {
        console.log('Test complete, shutting down server...');
        serverProcess.kill();
        process.exit(0);
      }, 500);
    } catch (e) {
      // Not complete JSON yet, keep collecting
      console.log(`Error parsing JSON: ${e.message}`);
    }
  });
}, 1000);

// Handle errors
serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

// Handle process exit
serverProcess.on('exit', (code, signal) => {
  if (code !== null) {
    console.log(`Server process exited with code ${code}`);
  } else if (signal !== null) {
    console.log(`Server process killed with signal ${signal}`);
  }
}); 