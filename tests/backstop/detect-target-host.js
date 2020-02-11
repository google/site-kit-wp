// Linux machines should use Docker's default gateway IP address to connect to.
let hostname = '172.17.0.2';

// On MacOS and Windows, `host.docker.internal` is available to point to the
// host and run backstopjs against.

// If the hostname arg is set, then we're inside the container and this should take precedence.
const hostArg = process.argv.find( ( arg ) => arg.match( /^--hostname=/ ) );

if ( hostArg ) {
	hostname = hostArg.replace( /^--hostname=/, '' );
} else if ( process.platform === 'darwin' || process.platform === 'win32' ) {
	hostname = 'host.docker.internal';
}

module.exports = hostname;
