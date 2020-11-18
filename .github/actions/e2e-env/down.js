const { execSync } = require( 'child_process' );
const { resolve } = require( 'path' );

execSync( resolve( __dirname, '../../../bin/local-env/stop.sh' ), { stdio: 'inherit' } );
