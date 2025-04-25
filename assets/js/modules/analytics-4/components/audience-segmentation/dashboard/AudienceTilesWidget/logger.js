import md5 from 'md5';

const deepDiff = ( prev, curr ) => {
	if ( prev === curr ) {
		return null;
	}

	if ( Array.isArray( prev ) && Array.isArray( curr ) ) {
		return prev
			.map( ( item, i ) => deepDiff( item, curr[ i ] ) )
			.filter( Boolean );
	}

	if (
		typeof prev === 'object' &&
		typeof curr === 'object' &&
		prev &&
		curr
	) {
		const diff = {};
		Object.keys( { ...prev, ...curr } ).forEach( ( key ) => {
			const value = deepDiff( prev[ key ], curr[ key ] );
			if ( value !== null ) {
				diff[ key ] = value;
			}
		} );
		return Object.keys( diff ).length ? diff : null;
	}

	return { prev, curr };
};

let firstDate = null;
let prevDate = null;

const seen = new Set();
const seenArgs = new Map();

export function createLogger(
	name,
	{ colour = 0, logOnlyOnce = false, logDiff = false } = {}
) {
	return ( msg, ...args ) => {
		const messageHash = md5( JSON.stringify( [ name, msg, ...args ] ) );
		if ( logOnlyOnce ) {
			if ( seen.has( messageHash ) ) {
				return;
			}
		}
		seen.add( messageHash );

		let logArgs = args;

		if ( logDiff ) {
			const prevArgs = seenArgs.get( msg );
			if (
				prevArgs &&
				JSON.stringify( prevArgs ) !== JSON.stringify( args )
			) {
				const diff = deepDiff( prevArgs, args );
				// global.console.log( 'diff', diff );
				logArgs = [ diff ];
			}
		}
		seenArgs.set( msg, args );

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
				) }] \x1b[37m${ elapsed }\x1b[0m \x1b[37m${ elapsedSinceFirst }\x1b[0m \x1b[${ colour }m${ name }\x1b[0m ${ msg }`,
			...logArgs.map( ( arg ) =>
				typeof arg === 'object' ? JSON.stringify( arg, null, 2 ) : arg
			)
		);
	};
}
