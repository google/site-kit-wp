export default ( vars ) => {
	const { modules } = global.googlesitekit;
	const match = vars.path.match( /google-site-kit\/v1\/modules\/([\w-]+)\/data\/([\w-]+)/ );

	if ( match && match[ 1 ] && match[ 2 ] ) {
		const [ , identifier, datapoint ] = match;

		if ( identifier && datapoint && modules[ identifier ] && modules[ identifier ][ datapoint ] ) {
			return Promise.resolve( modules[ identifier ][ datapoint ] );
		}
	}

	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', vars );

	return {
		then: () => {
			return {
				catch: () => false,
			};
		},
	};
};
