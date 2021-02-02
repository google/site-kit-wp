import faker from 'faker';
import { from, Observable } from 'rxjs';
import { map, reduce, take } from 'rxjs/operators';

function getObjectHash( obj ) {
	const msg = JSON.stringify( obj );
	let hash = 0;

	for ( let i = 0; i < msg.length; i++ ) {
		hash = ( ( hash << 5 ) - hash ) + msg.charCodeAt( i ); // eslint-disable-line no-bitwise
		hash |= 0; // eslint-disable-line no-bitwise
	}

	return hash;
}

function stringToDate( dateString ) {
	return new Date( `${ dateString } 00:00:00` );
}

export function makeFactory( options ) {
	const {
		metricTypes,
		dimensionOptions,
	} = options;

	const metricKey = ( metric ) => metric?.expression || metric.toString();
	const getMetricType = ( metric ) => metricTypes[ metricKey( metric ) ];
	const filterMetrics = ( metric ) => !! getMetricType( metric );

	return ( args ) => {
		faker.seed( getObjectHash( args ) );

		const dimensions = Array.isArray( args.dimensions )
			? args.dimensions
			: [ args.dimensions ].filter( ( item ) => !! item );

		const data = {
			dataLastRefreshed: null,
			isDataGolden: null,
			rowCount: 0,
			samplesReadCounts: null,
			samplingSpaceSizes: null,
			rows: [],
			totals: [],
			minimums: [],
			maximums: [],
		};

		const { compareStartDate, compareEndDate } = args;
		const valuesCount = compareStartDate && compareEndDate ? 2 : 1;

		const ops = [
			map( ( dimensionValue ) => ( {
				dimensions: [ dimensionValue ],
				metrics: [],
			} ) ),
			map( ( row ) => {
				for ( let i = 0; i < valuesCount; i++ ) {
					const values = [];

					switch ( getMetricType( validMetrics[ 0 ] ) ) {
						case 'INTEGER':
							values.push( faker.random.number( { min: 0, max: 100 } ).toString() );
							break;
						case 'PERCENT':
							values.push( faker.random.float( { min: 0, max: 100 } ).toString() );
							break;
						case 'TIME':
							break;
						case 'CURRENCY':
							break;
					}

					row.metrics.push( { values } );
				}

				return row;
			} ),
			take( args.limit > 0 ? +args.limit : 999999 ),
			reduce( ( acc, val ) => [ ...acc, val ], [] ),
		];

		let stream$;

		const validMetrics = ( args.metrics || [] ).filter( filterMetrics );
		const keyDimension = dimensions?.[ 0 ];
		if ( keyDimension === 'ga:date' ) {
			stream$ = new Observable( ( observer ) => {
				const currentDate = stringToDate( args.startDate );
				const end = stringToDate( args.endDate );

				while ( +currentDate <= +end ) {
					observer.next( currentDate.toISOString().split( 'T' )[ 0 ].replace( /\D/g, '' ) );
					currentDate.setDate( currentDate.getDate() + 1 );
				}

				observer.complete();
			} );
		} else if ( Array.isArray( dimensionOptions?.[ keyDimension ] ) ) {
			stream$ = from( dimensionOptions[ keyDimension ] );
		} else {
			stream$ = from( [ null ] );
		}

		stream$.pipe( ...ops ).subscribe( ( rows ) => {
			data.rows = rows;
			data.rowCount = rows.length;

			data.minimums = [ ...( rows[ 0 ]?.metrics || [] ) ];
			data.maximums = [ ...( rows[ rows.length - 1 ]?.metrics || [] ) ];

			if ( getMetricType( validMetrics[ 0 ] ) === 'INTEGER' ) {
				data.totals = [];
				for ( let i = 0; i < valuesCount; i++ ) {
					data.totals.push( {
						values: [
							data.rows.reduce( ( acc, row ) => acc + parseFloat( row.metrics[ i ].values[ 0 ] ), 0 ).toString(),
						],
					} );
				}
			} else {
				data.totals = [ ...( rows[ rows.length - 1 ]?.metrics || [] ) ];
			}
		} );

		return [ {
			nextPageToken: null,
			columnHeader: {
				dimensions,
				metricHeader: {
					metricHeaderEntries: validMetrics.map( ( metric ) => ( {
						name: metric?.alias || metric?.expression || metric.toString(),
						type: getMetricType( metric ),
					} ) ),
				},
			},
			data,
		} ];
	};
}

export const analyticsFactory = makeFactory( {
	metricTypes: {
		'ga:users': 'INTEGER',
		'ga:newUsers': 'INTEGER',
		'ga:sessions': 'INTEGER',
		'ga:goalCompletionsAll': 'INTEGER',
		'ga:pageviews': 'INTEGER',
		'ga:uniquePageviews': 'INTEGER',
		'ga:bounceRate': 'PERCENT',
		'ga:avgSessionDuration': 'TIME',
		'ga:adsensePageImpressions': 'INTEGER',
		'ga:adsenseCTR': 'PERCENT',
		'ga:adsenseRevenue': 'CURRENCY',
		'ga:adsenseECPM': 'CURRENCY',
	},
	dimensionOptions: {
		'ga:channelGrouping': [
			'Organic Search',
			'Referral',
			'Direct',
			'(other)',
		],
		'ga:country': [
			'United States',
			'United Kingdom',
			'India',
			'(not set)',
			'France',
			'Ukraine',
			'Italy',
			'Mexico',
		],
		'ga:deviceCategory': [
			'desktop',
			'tablet',
			'mobile',
		],
	},
} );
