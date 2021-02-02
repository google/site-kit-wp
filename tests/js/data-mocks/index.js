import faker from 'faker';

export function makeFactory( options ) {
	const {
		metrics: allMetrics,
	} = options;

	const metricKey = ( metric ) => metric?.expression || metric.toString();
	const getMetricType = ( metric ) => allMetrics[ metricKey( metric ) ];
	const filterMetrics = ( metric ) => !! getMetricType( metric );

	const stringToDate = ( dateString ) => new Date( `${ dateString } 00:00:00` );

	return ( { startDate, endDate, dimensions, metrics } ) => {
		const validMetrics = metrics.filter( filterMetrics );

		const columnHeader = {
			dimensions,
			metricHeader: {
				metricHeaderEntries: validMetrics.map( ( metric ) => ( {
					name: metric?.alias || metric?.expression || metric.toString(),
					type: getMetricType( metric ),
				} ) ),
			},
		};

		const data = {
			dataLastRefreshed: null,
			isDataGolden: null,
			rowCount: 0, // should be real number of rows
			samplesReadCounts: null,
			samplingSpaceSizes: null,
			rows: [],
			totals: [],
			minimums: [],
			maximums: [],
		};

		const report = {
			nextPageToken: null,
			columnHeader,
			data,
		};

		const currentDate = stringToDate( startDate );
		const end = stringToDate( endDate );

		while ( +currentDate <= +end ) {
			const row = {
				dimensions: [],
				metrics: [],
			};

			dimensions.forEach( ( dimension ) => {
				switch ( dimension ) {
					case 'ga:date':
						row.dimensions.push(
							currentDate.toISOString().split( 'T' )[ 0 ].replace( /\D/g, '' )
						);
						break;
				}
			} );

			validMetrics.forEach( ( metric ) => {
				const values = [];

				switch ( getMetricType( metric ) ) {
					case 'INTEGER':
						dimensions.forEach( () => {
							values.push( faker.random.number( 100 ) );
						} );
						break;
					case 'PERCENT':
						break;
					case 'TIME':
						break;
					case 'CURRENCY':
						break;
				}

				row.metrics.push( { values } );
			} );

			data.rows.push( row );
			data.rowCount++;

			currentDate.setDate( currentDate.getDate() + 1 );
		}

		return [ report ];
	};
}

export const analyticsFactory = makeFactory( {
	metrics: {
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
} );
