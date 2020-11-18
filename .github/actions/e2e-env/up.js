const { execSync } = require( 'child_process' );
const { resolve } = require( 'path' );

execSync( resolve( __dirname, '../../../bin/local-env/start.sh' ), { stdio: 'inherit' } );
