import md5 from 'md5';

let firstDate = null;
let prevDate = null;

const seen = new Set();

export function createLogger( name, { colour = 0, logOnlyOnce = false } = {} ) {
	return ( ...args ) => {
		if ( logOnlyOnce ) {
			const messageHash = md5( JSON.stringify( [ name, ...args ] ) );
			if ( seen.has( messageHash ) ) {
				return;
			}
			seen.add( messageHash );
		}

		// eslint-disable-next-line sitekit/no-direct-date
		const now = Date.now();
		if ( ! firstDate ) {
			firstDate = now;
		}
		if ( ! prevDate ) {
			prevDate = now;
		}
		const elapsed = `${ now - prevDate }`.padStart( 6, ' ' );
		const elapsedSinceFirst = `${ now - firstDate }`.padStart( 6, ' ' );
		prevDate = now;
		global.console.log(
			// eslint-disable-next-line sitekit/no-direct-date
			`[${ new Date()
				.toISOString()
				.substring(
					0,
					23
				) }] \x1b[37m${ elapsed }\x1b[0m \x1b[37m${ elapsedSinceFirst }\x1b[0m \x1b[${ colour }m${ name }\x1b[0m`,
			...args.map( ( arg ) =>
				typeof arg === 'object' ? JSON.stringify( arg, null, 2 ) : arg
			)
		);
	};
}
