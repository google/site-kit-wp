// Linux machines should use Docker's default gateway IP address to connect to.
let hostname = '172.17.0.1';

// If the moby arg is set, then backstop is running within a container.
if ( process.argv.includes( '--moby' ) ) {
	const hostArg = process.argv.find( ( arg ) => arg.match( /^--storybook-host=/ ) );
	hostname = hostArg.replace( /^--storybook-host=/, '' );
} else if ( process.platform === 'darwin' || process.platform === 'win32' ) {
	// On MacOS and Windows, a dedicated hostname is available for resolving the host.
	hostname = 'host.docker.internal';
}

module.exports = hostname;
