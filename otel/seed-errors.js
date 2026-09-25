#!/usr/bin/env node
/**
 * Seeds the PoC with synthetic Site Kit errors.
 *
 * The viewer is only convincing with realistic volume: the same bug recurring
 * across releases and sites is exactly the pattern that the current GA
 * reporting cannot show, so the demo needs it present.
 *
 * Deliberately mirrors the real distribution seen in the GA error dashboard —
 * one dominant bug across many sites, a long tail of rarer ones, and the same
 * bug appearing under different view contexts and plugin versions.
 *
 * Usage: `node otel/seed-errors.js [count]`.
 */

const ENDPOINT = process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/logs';
const COUNT = Number( process.argv[ 2 ] || 400 );

const VERSIONS = [ '1.185.0', '1.186.0', '1.187.0' ];
const VIEW_CONTEXTS = [
	'mainDashboard',
	'entityDashboard',
	'adminBar',
	'wpDashboard',
	'moduleSetup',
];

// Minified identifiers differ per build; the seeder varies them on purpose so
// the demo shows the fingerprint holding them together.
const MINIFIED = [ 'l', 'e', 'xy', 'o', 'a' ];

const BUGS = [
	{
		weight: 55,
		type: 'TypeError',
		message: ( m ) =>
			`Cannot destructure property 'triggerTourForView' of '(0 , ${ m }.useDispatch)(...)' as it is null.`,
		stack: [ 'FeatureTours', 'DashboardMainApp', 'ErrorHandler' ],
	},
	{
		weight: 18,
		type: 'TypeError',
		message: ( m ) =>
			`Cannot destructure property 'clearSiteGoalsBreakdownTooltipPending' of '(0 , ${ m }.useDispatch)(...)' as it is null.`,
		stack: [ 'SiteGoalsBreakdown', 'KeyMetrics', 'DashboardMainApp' ],
	},
	{
		weight: 12,
		type: 'Error',
		message: () =>
			'Minified React error #152; visit https://reactjs.org/docs/error-decoder.html?invariant=152 for the full message.',
		stack: [ 'WidgetRenderer', 'WidgetAreaRenderer' ],
	},
	{
		weight: 9,
		type: 'TypeError',
		// Property names survive minification — that is precisely why the
		// fingerprint keeps them and discards the identifier before the dot.
		message: () =>
			"Cannot read properties of undefined (reading 'propertyID')",
		stack: [ 'AudienceTile', 'AudienceSegmentation' ],
	},
	{
		weight: 6,
		type: 'RangeError',
		message: () => 'Maximum call stack size exceeded',
		stack: [ 'MetricTileWrapper', 'KeyMetrics' ],
	},
];

// --- Fingerprinting -------------------------------------------------------
// Mirrors assets/js/util/otel/fingerprint.ts. Real records carry a fingerprint
// computed in the plugin, so seeded records must too, or the viewer has
// nothing to group on.
//
// This duplication is a PoC shortcut and a maintenance hazard: change a rule
// there without changing it here and seeded records silently stop grouping
// with real ones. Productionising this would share one implementation.

function normalize( input ) {
	return String( input || '' )
		.replace( /https?:\/\/[^\s)]+/g, '<url>' )
		.replace( /(?:\/[\w.@-]+){2,}/g, '<path>' )
		.replace( /:\d+:\d+/g, '' )
		.replace( /\b(?=[0-9a-f]*[a-f])[0-9a-f]{8,}\b/gi, '<hash>' )
		.replace( /\b[a-zA-Z_$]{1,2}\.(?=[a-zA-Z_$])/g, '*.' )
		.replace( /\b\d{6,}\b/g, '<n>' )
		.replace( /\s+/g, ' ' )
		.trim();
}

function fingerprint( type, message, stack ) {
	const frames = String( stack || '' )
		.split( '\n' )
		.map( ( f ) => f.trim() )
		.filter( Boolean )
		.slice( 0, 3 )
		.join( ' | ' );

	const input = [
		normalize( type ),
		normalize( message ),
		normalize( frames ),
	]
		.filter( Boolean )
		.join( ' :: ' );

	const bytes = new TextEncoder().encode( input );
	let hash = 0x811c9dc5;
	for ( let index = 0; index < bytes.length; index++ ) {
		hash ^= bytes[ index ];
		hash = Math.imul( hash, 0x01000193 ) >>> 0;
	}
	return hash.toString( 16 ).padStart( 8, '0' );
}

function pick( arr ) {
	return arr[ Math.floor( Math.random() * arr.length ) ];
}

function pickBug() {
	const total = BUGS.reduce( ( sum, b ) => sum + b.weight, 0 );
	let roll = Math.random() * total;
	for ( const bug of BUGS ) {
		roll -= bug.weight;
		if ( roll <= 0 ) {
			return bug;
		}
	}
	return BUGS[ 0 ];
}

function attr( key, value ) {
	return {
		key,
		value:
			typeof value === 'boolean'
				? { boolValue: value }
				: { stringValue: String( value ) },
	};
}

function buildRecord( siteIndex ) {
	const bug = pickBug();
	const minified = pick( MINIFIED );
	const version = pick( VERSIONS );
	const viewContext = pick( VIEW_CONTEXTS );
	const site = `https://site-${ siteIndex }.example.com`;
	const message = bug.message( minified );

	// Spread over the last 45 minutes.
	//
	// Not an arbitrary choice: Loki rejects entries more than about an hour
	// behind the head of a stream (`reason="too_far_behind"` in
	// loki_discarded_samples_total), so seeding across days silently drops
	// most of the data. A production backend would not have this constraint,
	// and nothing about the pipeline depends on it — it is purely a property
	// of the stand-in storage this PoC uses.
	const ageMs = Math.floor( Math.random() * 45 * 60 * 1000 );
	const timeMs = Date.now() - ageMs;

	const stack = bug.stack
		.map(
			( frame, index ) =>
				`    at ${ frame } (/home/user${ siteIndex }/public_html/wp-content/plugins/google-site-kit/dist/assets/js/googlesitekit-main-dashboard.js:2:${
					180000 + index * 7919
				})`
		)
		.join( '\n' );

	return {
		resource: {
			attributes: [
				attr( 'service.name', 'site-kit-wp' ),
				attr( 'service.version', version ),
				attr( 'sitekit.site_url', site ),
				attr(
					'sitekit.wp_version',
					pick( [ '6.7.2', '6.8.1', '6.9' ] )
				),
				attr(
					'sitekit.php_version',
					pick( [ '7.4.33', '8.1.27', '8.2.14', '8.3.6' ] )
				),
				attr( 'sitekit.modules_active', 'search-console,analytics-4' ),
				// Marks the record as fabricated. Synthetic volume is needed
				// to show what triage looks like at scale — one dev install
				// cannot produce 76 sites across three releases — but it must
				// never be mistakable for a real report.
				attr( 'sitekit.synthetic', true ),
			],
		},
		scopeLogs: [
			{
				scope: { name: 'sitekit.browser', version: '0.1.0' },
				logRecords: [
					{
						timeUnixNano: `${ timeMs }000000`,
						severityNumber: 17,
						severityText: 'ERROR',
						body: { stringValue: message },
						attributes: [
							attr( 'exception.type', bug.type ),
							attr( 'exception.message', message ),
							attr( 'exception.stacktrace', stack ),
							attr( 'sitekit.error_source', 'react_boundary' ),
							attr( 'sitekit.view_context', viewContext ),
							attr( 'sitekit.component_stack', stack ),
							attr(
								'sitekit.fingerprint',
								fingerprint( bug.type, message, stack )
							),
						],
					},
				],
			},
		],
	};
}

async function main() {
	console.log( `Seeding ${ COUNT } error records to ${ ENDPOINT }…` );

	let sent = 0;
	const BATCH = 20;

	for ( let index = 0; index < COUNT; index += BATCH ) {
		const resourceLogs = [];
		for (
			let index_ = 0;
			index_ < Math.min( BATCH, COUNT - index );
			index_++
		) {
			// ~80 distinct sites, so the "sites affected" column is meaningful.
			resourceLogs.push(
				buildRecord( 1 + Math.floor( Math.random() * 80 ) )
			);
		}

		const res = await fetch( ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( { resourceLogs } ),
		} );

		if ( ! res.ok ) {
			console.error( `  batch failed: HTTP ${ res.status }` );
			process.exit( 1 );
		}

		sent += resourceLogs.length;
	}

	console.log( `Done. ${ sent } records sent.` );
	console.log( 'Open the triage viewer at http://localhost:8080' );
}

main().catch( ( err ) => {
	console.error( err );
	process.exit( 1 );
} );
