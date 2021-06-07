/**
 * Analytics test data mock.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import md5 from 'md5';
import faker from 'faker';
import { zip, from, Observable } from 'rxjs';
import { map, reduce, take } from 'rxjs/operators';
import { STORE_NAME } from '../datastore/constants';

const ANALYTICS_METRIC_TYPES = {
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
};

const ANALYTICS_DIMENSION_OPTIONS = {
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
	'ga:pageTitle': ( i ) => i <= 12 ? `Test Post ${ i }` : false,
	'ga:pagePath': ( i ) => i <= 12 ? `/test-post-${ i }/` : false,
};

/**
 * Gets metric key.
 *
 * @since 1.28.0
 *
 * @param {string|Object} metric Metric name or object.
 * @return {string} Metric key.
 */
function getMetricKey( metric ) {
	return metric?.expression || metric.toString();
}

/**
 * Gets metric type.
 *
 * @since 1.28.0
 *
 * @param {string|Object} metric Metric name or object.
 * @return {string} Type of the metric.
 */
function getMetricType( metric ) {
	return ANALYTICS_METRIC_TYPES[ getMetricKey( metric ) ];
}

/**
 * Generates and returns metric values.
 *
 * @since 1.28.0
 *
 * @param {Array.<Object>} validMetrics Metric list.
 * @param {number}         count        Maximum number of values to generate.
 * @return {Array.<Object>} Array of metric values.
 */
function generateMetricValues( validMetrics, count ) {
	const metrics = [];

	for ( let i = 0; i < count; i++ ) {
		const values = [];

		validMetrics.forEach( ( validMetric ) => {
			switch ( getMetricType( validMetric ) ) {
				case 'INTEGER':
					values.push( faker.random.number( { min: 0, max: 100 } ).toString() );
					break;
				case 'PERCENT':
					values.push( faker.random.float( { min: 0, max: 100 } ).toString() );
					break;
				case 'TIME':
					values.push( faker.random.number( { min: 0, max: 3600 } ).toString() ); // 1 hour max.
					break;
				case 'CURRENCY':
					values.push( faker.random.float( { min: 0, max: 10000 } ).toString() ); // $10k max.
					break;
			}
		} );

		metrics.push( { values } );
	}

	return metrics;
}

/**
 * Sorts report rows and returns it.
 *
 * @since 1.28.0
 *
 * @param {Array.<Object>}        rows    Array of rows to sort.
 * @param {Array.<Object>}        metrics Array of report metrics.
 * @param {Object|Array.<Object>} orderby Sorting options.
 * @return {Array.<Object>} Sorted rows.
 */
function sortRows( rows, metrics, orderby ) {
	let sorted = rows;

	const orders = Array.isArray( orderby ) ? orderby : [ orderby ];
	for ( const order of orders ) {
		const direction = order?.sortOrder === 'DESCENDING' ? -1 : 1;
		const index = metrics.findIndex( ( metric ) => getMetricKey( metric ) === order?.fieldName );
		if ( index < 0 ) {
			continue;
		}

		sorted = sorted.sort( ( a, b ) => {
			let valA = parseFloat( a.metrics[ index ]?.values?.[ 0 ] );
			if ( Number.isNaN( valA ) ) {
				valA = 0;
			}

			let valB = parseFloat( b.metrics[ index ]?.values?.[ 0 ] );
			if ( Number.isNaN( valB ) ) {
				valB = 0;
			}

			return ( valA - valB ) * direction;
		} );
	}

	return sorted;
}

/**
 * Generates mock data for Analytics reports.
 *
 * @since 1.28.0
 *
 * @param {Object} args Report options.
 * @return {Array.<Object>} An array with generated report.
 */
export function getAnalyticsMockResponse( args ) {
	const originalSeedValue = faker.seedValue;
	const argsHash = parseInt(
		md5( args.url || 'http://example.com' ).substring( 0, 8 ),
		16,
	);

	// We set seed for every data mock to make sure that the same arguments get the same report data.
	// It means that everyone will have the same report data and will see the same widgets in the storybook.
	// This approach gives us additional flexibility to control randomness on a per widget basis.
	if ( ! Number.isNaN( argsHash ) ) {
		faker.seed( argsHash );
	}

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
	const metricValuesCount = compareStartDate && compareEndDate ? 2 : 1;

	const validMetrics = ( args.metrics || [] ).filter( ( metric ) => !! getMetricType( metric ) );
	const streams = [];

	// Generate streams (array) of dimension values. Each dimension will have its own stream (array) of data.
	// Then streams will be merged into one (see zip( ... ) function call) and metric values will be added to each
	// dimension set in the combined stream (array). We need to use array of streams because report arguments may
	// have 0 or N dimensions (N > 1) which means that in the each row of the report data we will have an array
	// of dimension values.
	const dimensions = Array.isArray( args.dimensions ) ? args.dimensions : [ args.dimensions ];
	dimensions.forEach( ( dimension ) => {
		if ( dimension === 'ga:date' ) {
			// Generates a stream (an array) of dates when the dimension is ga:date.
			streams.push( new Observable( ( observer ) => {
				const currentDate = new Date( args.compareStartDate || args.startDate );
				const end = new Date( args.endDate );

				while ( currentDate.getTime() <= end.getTime() ) {
					observer.next( currentDate.toISOString().split( 'T' )[ 0 ].replace( /\D/g, '' ) );
					currentDate.setDate( currentDate.getDate() + 1 );
				}

				observer.complete();
			} ) );
		} else if ( dimension && typeof ANALYTICS_DIMENSION_OPTIONS?.[ dimension ] === 'function' ) {
			// Generates a stream (an array) of dimension values using a function associated with the current dimension.
			streams.push( new Observable( ( observer ) => {
				for ( let i = 1; i <= 90; i++ ) { // 90 is the max number of dates in the longest date range.
					const val = ANALYTICS_DIMENSION_OPTIONS[ dimension ]( i );
					if ( val ) {
						observer.next( val );
					} else {
						break;
					}
				}

				observer.complete();
			} ) );
		} else if ( dimension && Array.isArray( ANALYTICS_DIMENSION_OPTIONS?.[ dimension ] ) ) {
			// Uses predefined array of dimension values to create a stream (an array) from.
			streams.push( from( ANALYTICS_DIMENSION_OPTIONS[ dimension ] ) );
		} else {
			// In case when a dimension is not provided or is not recognized, we use NULL to create a stream (an array) with just one value.
			streams.push( from( [ null ] ) );
		}
	} );

	// This is the list of operations that we apply to the cobmined stream (array) of dimension values.
	const ops = [
		// Convert a dimension value to a row object and generate metric values.
		map( ( dimensionValue ) => ( {
			dimensions: Array.isArray( dimensionValue ) ? dimensionValue : [ dimensionValue ],
			metrics: generateMetricValues( validMetrics, metricValuesCount ),
		} ) ),
		// Make sure we take the appropriate number of rows.
		take( args.limit > 0 ? +args.limit : 90 ),
		// Accumulate all rows into a single array.
		reduce( ( rows, row ) => [ ...rows, row ], [] ),
		// Sort rows if args.orderby is provided.
		map( ( rows ) => args.orderby ? sortRows( rows, validMetrics, args.orderby ) : rows ),
	];

	// Process the stream of dimension values and add generated rows to the report data object.
	zip( ...streams ).pipe( ...ops ).subscribe( ( rows ) => {
		data.rows = rows;
		data.rowCount = rows.length;

		// We pretend that the first row contains minimums and the last one maximums because we don't
		// really need mathematically correct values and can simplify the process of finding this information.
		data.minimums = [ ...( rows[ 0 ]?.metrics || [] ) ];
		data.maximums = [ ...( rows[ rows.length - 1 ]?.metrics || [] ) ];

		// Same here, we pretend that the last row contains totals because we don't need it to be mathematically valid.
		data.totals = [ ...( rows[ rows.length - 1 ]?.metrics || [] ) ];
	} );

	// Set the original seed value for the faker.
	faker.seed( originalSeedValue );

	return [ {
		nextPageToken: null,
		columnHeader: {
			dimensions: args.dimensions || null,
			metricHeader: {
				metricHeaderEntries: validMetrics.map( ( metric ) => ( {
					name: metric?.alias || metric?.expression || metric.toString(),
					type: getMetricType( metric ),
				} ) ),
			},
		},
		data,
	} ];
}

/**
 * Generates mock response for Analytics reports.
 *
 * @since 1.34.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 * @param {Object}           options  Report options.
 */
export const provideAnalyticsMockReport = ( registry, options ) => {
	registry.dispatch( STORE_NAME ).receiveGetReport(
		getAnalyticsMockResponse( options ),
		{ options }
	);
};
