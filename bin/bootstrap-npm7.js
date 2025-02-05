const fs = require( 'fs' );
const path = require( 'path' );
const os = require( 'os' );
const { execSync } = require( 'child_process' );

const tmpDir = path.join( os.tmpdir(), 'npm7-bootstrap' );

// Create temp directory
fs.mkdirSync( tmpDir, { recursive: true } );

// Create minimal package.json
fs.writeFileSync(
	path.join( tmpDir, 'package.json' ),
	JSON.stringify( { dependencies: { npm: '7.24.2' } } )
);

try {
	// Install npm 7 in temp directory
	execSync( 'npm install', { stdio: 'inherit', cwd: tmpDir } );

	// Use npm 7 to install project dependencies
	execSync( path.join( tmpDir, 'node_modules', '.bin', 'npm' ) + ' install', {
		stdio: 'inherit',
	} );
} finally {
	// Clean up temp directory
	fs.rmSync( tmpDir, { recursive: true } );
}
