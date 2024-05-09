/**
 * Analytics 4 test data mock.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import invariant from 'invariant';
import { castArray, cloneDeep, isPlainObject, zip } from 'lodash';
import { Observable, merge, from } from 'rxjs';
import { map, reduce, take, toArray, mergeMap } from 'rxjs/operators';

/**
 * Internal dependencies
 */
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { isValidDateString, stringifyObject } from '../../../util';
import { stringToDate } from '../../../util/date-range/string-to-date';
import { isValidDimensionFilters } from './report-validation';

export const STRATEGY_CARTESIAN = 'cartesian';
export const STRATEGY_ZIP = 'zip';

const ANALYTICS_4_METRIC_TYPES = {
	totalUsers: 'TYPE_INTEGER',
	newUsers: 'TYPE_INTEGER',
	activeUsers: 'TYPE_INTEGER',
	sessions: 'TYPE_INTEGER',
	bounceRate: 'TYPE_FLOAT',
	conversions: 'TYPE_INTEGER',
	screenPageViews: 'TYPE_INTEGER',
	screenPageViewsPerSession: 'TYPE_FLOAT',
	engagedSessions: 'TYPE_INTEGER',
	engagementRate: 'TYPE_FLOAT',
	averageSessionDuration: 'TYPE_SECONDS',
	sessionConversionRate: 'TYPE_FLOAT',
	sessionsPerUser: 'TYPE_FLOAT',
	totalAdRevenue: 'TYPE_INTEGER',
};

const ANALYTICS_4_DIMENSION_OPTIONS = {
	sessionDefaultChannelGrouping: [
		'Direct',
		'Organic Search',
		'Paid Social',
		'(other)',
		'Email',
		'Affiliates',
		'Referral',
		'Paid Search',
		'Video',
		'Display',
	],
	sessionDefaultChannelGroup: [ 'Organic Search' ],
	country: [
		'United States',
		'United Kingdom',
		'India',
		'(not set)',
		'France',
		'Ukraine',
		'Italy',
		'Mexico',
	],
	city: [
		'Dublin',
		'(not set)',
		'Cork',
		'New York',
		'London',
		'Los Angeles',
		'San Francisco',
	],
	deviceCategory: [ 'Desktop', 'Tablet', 'Mobile' ],
	pageTitle: ( i ) => ( i <= 12 ? `Test Post ${ i }` : false ),
	pagePath: ( i ) => ( i <= 12 ? `/test-post-${ i }/` : false ),
	newVsReturning: [ 'new', 'returning' ],
	'customEvent:googlesitekit_post_author': ( i ) =>
		i <= 12 ? `User ${ i }` : false,
	'customEvent:googlesitekit_post_categories': [
		'Entertainment; Sports; Media',
		'Wealth',
		'Health',
		'Technology',
		'Business',
	],
	audienceResourceName: [
		'properties/12345/audiences/1',
		'properties/12345/audiences/2',
		'properties/12345/audiences/3',
	],
};

/**
 * Parses dimension arguments, returns dimensions as an array of strings.
 *
 * @since 1.113.0
 *
 * @param {string|Object|Array<string|Object>} dimensions A single dimension or an array of dimensions.
 * @return {Array<string>} Array of dimension names.
 */
function parseDimensionArgs( dimensions ) {
	const dimensionsArray = castArray( dimensions );

	if ( dimensionsArray.length && typeof dimensionsArray[ 0 ] === 'object' ) {
		return dimensionsArray.map( ( dimension ) => dimension.name );
	}

	return dimensionsArray;
}

/**
 * Gets the key for a metric or dimension.
 *
 * @since 1.94.0
 *
 * @param {string|Object} item Metric or dimension name or object.
 * @return {string} Metric or dimension key.
 */
function getItemKey( item ) {
	return item?.name || item?.toString();
}

/**
 * Gets metric type.
 *
 * @since 1.94.0
 *
 * @param {string|Object} metric Metric name or object.
 * @return {string} Type of the metric.
 */
function getMetricType( metric ) {
	return ANALYTICS_4_METRIC_TYPES[ getItemKey( metric ) ];
}

/**
 * Generates and returns metric values.
 *
 * @since 1.94.0
 *
 * @param {Array.<Object>} validMetrics Metric list.
 * @return {Array.<Object>} Array of metric values.
 */
function generateMetricValues( validMetrics ) {
	const values = [];

	validMetrics.forEach( ( validMetric ) => {
		switch ( getMetricType( validMetric ) ) {
			case 'TYPE_INTEGER':
				values.push( {
					value: faker.datatype
						.number( { min: 0, max: 100 } )
						.toString(),
				} );
				break;
			case 'TYPE_FLOAT':
				values.push( {
					value: faker.datatype
						.float( {
							min: 0,
							max: 1,
							// The GA4 API returns 17 decimal places, so specify that here, although it seems like Faker is only returning up to 16.
							precision: 0.00000000000000001,
						} )
						.toString(),
				} );
				break;
			case 'TYPE_SECONDS':
				values.push( {
					value: faker.datatype
						.number( { min: 0, max: 60 } )
						.toString(),
				} );
				break;
		}
	} );

	return values;
}

/**
 * Generates the cartesian product of a set of arrays, i.e. all possible combinations of their values.
 *
 * Cribbed from https://stackoverflow.com/a/36234242/12296658, thanks to the original author(s).
 *
 * @since 1.94.0
 *
 * @param {Array.<Array>} arrays An array of arrays.
 * @return {Array.<Array>} The cartesian product of the input arrays.
 */
function cartesianProduct( arrays ) {
	return arrays.reduce(
		function ( arrayA, arrayB ) {
			return arrayA
				.map( function ( valueA ) {
					return arrayB.map( function ( valueB ) {
						return valueA.concat( [ valueB ] );
					} );
				} )
				.reduce( function ( innerA, innerB ) {
					return innerA.concat( innerB );
				}, [] );
		},
		[ [] ]
	);
}

/**
 * Finds a metric value in a row.
 *
 * @since 1.95.0
 *
 * @param {Object}               row        Report row.
 * @param {Array<string|Object>} metrics    Array of valid metrics.
 * @param {string}               metricName Metric name.
 * @return {number|null} Metric value, or null if not found.
 */
function findMetricValue( row, metrics, metricName ) {
	const index = metrics.findIndex(
		( metric ) => getItemKey( metric ) === metricName
	);
	if ( index === -1 ) {
		return null;
	}
	return parseInt( row.metricValues[ index ].value, 10 );
}

/**
 * Finds a dimension value in a row.
 *
 * @since 1.95.0
 *
 * @param {Object}               row           Report row.
 * @param {Array<string|Object>} dimensions    Array of valid dimensions.
 * @param {string}               dimensionName Dimension name.
 * @return {string|null} Dimension value, or null if not found.
 */
function findDimensionValue( row, dimensions, dimensionName ) {
	const index = dimensions.findIndex(
		( dimension ) => getItemKey( dimension ) === dimensionName
	);
	if ( index === -1 ) {
		return null;
	}
	return row.dimensionValues[ index ].value;
}

/**
 * Compares two rows by the given sorting options.
 *
 * @since 1.95.0
 *
 * @param {Array.<Object>} rowA       First row to compare.
 * @param {Array.<Object>} rowB       Second row to compare.
 * @param {Array.<Object>} metrics    Array of report metrics.
 * @param {Array.<Object>} dimensions Array of report dimensions.
 * @param {Array.<Object>} orderby    Sorting options.
 * @return {Array.<Object>} Sorted rows.
 */
function compareRows( rowA, rowB, metrics, dimensions, orderby ) {
	const order = orderby[ 0 ];
	let valA, valB;

	if ( order.metric ) {
		valA = findMetricValue( rowA, metrics, order.metric.metricName );
		valB = findMetricValue( rowB, metrics, order.metric.metricName );
	} else if ( order.dimension ) {
		valA = findDimensionValue(
			rowA,
			dimensions,
			order.dimension.dimensionName
		);
		valB = findDimensionValue(
			rowB,
			dimensions,
			order.dimension.dimensionName
		);
	}

	if ( valA === valB ) {
		if ( orderby.length > 1 ) {
			return compareRows(
				rowA,
				rowB,
				metrics,
				dimensions,
				orderby.slice( 1 )
			);
		}
		return 0;
	}

	const direction = order.desc ? -1 : 1;
	return ( valA < valB ? -1 : 1 ) * direction;
}

/**
 * Sorts report rows and returns it.
 *
 * @since 1.94.0
 *
 * @param {Array.<Object>} rows       Array of rows to sort.
 * @param {Array.<Object>} metrics    Array of report metrics.
 * @param {Array.<Object>} dimensions Array of report dimensions.
 * @param {Array.<Object>} orderby    Sorting options.
 * @return {Array.<Object>} Sorted rows.
 */
export function sortRows( rows, metrics, dimensions, orderby ) {
	return rows.sort( ( rowA, rowB ) =>
		compareRows( rowA, rowB, metrics, dimensions, orderby )
	);
}

/**
 * Generates date range.
 *
 * @since 1.94.0
 *
 * @param {string} startDate The start date.
 * @param {string} endDate   The end date.
 * @return {Array.<string>} An array with dates.
 */
function generateDateRange( startDate, endDate ) {
	const dates = [];

	const currentDate = stringToDate( startDate );
	const end = stringToDate( endDate );

	while ( currentDate.getTime() <= end.getTime() ) {
		// Ensure the generated dates are the same regardless of local timezone.
		const year = currentDate.getFullYear();
		const month = String( currentDate.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( currentDate.getDate() ).padStart( 2, '0' );

		dates.push( `${ year }${ month }${ day }` );

		currentDate.setDate( currentDate.getDate() + 1 );
	}

	return dates;
}

/**
 * Generates mock data for Analytics 4 reports.
 *
 * @since 1.94.0
 * @since 1.96.0 Added support for using zip to generate dimension combinations.
 *
 * @param {Object} options        Report options.
 * @param {Object} [extraOptions] Extra options for report generation.
 * @return {Array.<Object>} An array with generated report.
 */
export function getAnalytics4MockResponse(
	options,
	extraOptions = { dimensionCombinationStrategy: STRATEGY_CARTESIAN }
) {
	invariant(
		isPlainObject( options ),
		'report options are required to generate a mock response.'
	);
	invariant(
		isValidDateString( options.startDate ),
		'a valid startDate is required.'
	);
	invariant(
		isValidDateString( options.endDate ),
		'a valid endDate is required.'
	);

	// Ensure we don't mutate the passed options to avoid unexpected side effects for the caller.
	const args = cloneDeep( options );

	const originalSeedValue = faker.seedValue;
	const argsURL = args.url || 'http://example.com';

	let seed = argsURL;

	if ( args.dimensionFilters ) {
		invariant(
			isValidDimensionFilters( args.dimensionFilters ),
			'dimensionFilters must be an object with valid keys and values.'
		);

		seed += stringifyObject( args.dimensionFilters );
	}

	const argsHash = parseInt( md5( seed ).substring( 0, 8 ), 16 );

	// We set seed for every data mock to make sure that the same arguments get the same report data.
	// It means that everyone will have the same report data and will see the same widgets in the storybook.
	// This approach gives us additional flexibility to control randomness on a per widget basis.
	if ( ! Number.isNaN( argsHash ) ) {
		faker.seed( argsHash );
	}

	const data = {
		rowCount: 0,
		rows: [],
		totals: [],
		minimums: [],
		maximums: [],
		metadata: {
			currencyCode: 'USD',
			timeZone: 'America/Los_Angeles',
		},
		kind: 'analyticsData#runReport',
	};

	const { compareStartDate, compareEndDate } = args;
	const hasDateRange = compareStartDate && compareEndDate;

	const validMetrics = ( args.metrics || [] ).filter(
		( metric ) => !! getMetricType( metric )
	);
	const streams = [];

	// Generate streams (array) of dimension values. Each dimension will have its own stream (array) of data.
	// Then streams will be merged into one (see zip( ... ) function call) and metric values will be added to each
	// dimension set in the combined stream (array). We need to use array of streams because report arguments may
	// have 0 or N dimensions (N > 1) which means that in the each row of the report data we will have an array
	// of dimension values.
	const dimensions = args.dimensions
		? parseDimensionArgs( args.dimensions )
		: [];

	if ( hasDateRange ) {
		dimensions.push( 'dateRange' );
	}

	dimensions.forEach( ( singleDimension ) => {
		const dimension = getItemKey( singleDimension );

		if ( dimension === 'date' ) {
			const dateRanges = [
				generateDateRange( args.startDate, args.endDate ),
			];

			if ( args.compareStartDate && args.compareEndDate ) {
				// When a comparison date range is specified, the report will contain a combined date range of all the dates in the current and compare periods.
				dateRanges.push(
					generateDateRange(
						args.compareStartDate,
						args.compareEndDate
					)
				);
			}

			// Create a set of unique dates from the date ranges.
			const dateRange = new Set( dateRanges.flat() );

			// Generates a stream (an array) of dates.
			streams.push( from( [ ...dateRange ] ) );
		} else if ( dimension === 'dateRange' ) {
			streams.push( from( [ 'date_range_0', 'date_range_1' ] ) );
		} else if (
			dimension &&
			typeof ANALYTICS_4_DIMENSION_OPTIONS[ dimension ] === 'function'
		) {
			// Generates a stream (an array) of dimension values using a function associated with the current dimension.
			streams.push(
				new Observable( ( observer ) => {
					for ( let i = 1; i <= 90; i++ ) {
						// 90 is the max number of dates in the longest date range.
						const val =
							ANALYTICS_4_DIMENSION_OPTIONS[ dimension ]( i );
						if ( val ) {
							observer.next( val );
						} else {
							break;
						}
					}

					observer.complete();
				} )
			);
		} else if (
			dimension &&
			Array.isArray( ANALYTICS_4_DIMENSION_OPTIONS[ dimension ] )
		) {
			// Uses predefined array of dimension values to create a stream (an array) from.
			streams.push( from( ANALYTICS_4_DIMENSION_OPTIONS[ dimension ] ) );
		} else {
			// In case when a dimension is not provided or is not recognized, we use NULL to create a stream (an array) with just one value.
			streams.push( from( [ null ] ) );
		}
	} );

	const limit = args.limit > 0 ? +args.limit : 90;
	// If we have a date range, we need to double the limit to account for the fact that we duplicate each row for each date range.
	const rowLimit = hasDateRange ? limit * 2 : limit;

	// This is the list of operations that we apply to the combined stream (array) of dimension values.
	const ops = [
		// Convert a dimension value to a row object and generate metric values.
		map( ( dimensionValue ) => ( {
			dimensionValues: castArray( dimensionValue ).map( ( value ) => ( {
				value,
			} ) ),
			metricValues: generateMetricValues( validMetrics ),
		} ) ),
		// Make sure we take the appropriate number of rows.
		take( rowLimit ),
		// Accumulate all rows into a single array.
		reduce( ( rows, row ) => [ ...rows, row ], [] ),
		// Sort rows if args.orderby is provided.
		map( ( rows ) =>
			args.orderby
				? sortRows( rows, validMetrics, dimensions, args.orderby )
				: rows
		),
	];

	const { dimensionCombinationStrategy } = extraOptions;
	let mergeMapper;
	if ( dimensionCombinationStrategy === STRATEGY_CARTESIAN ) {
		// When STRATEGY_CARTESIAN is specified we use the cartesianProduct function to generate all possible combinations of dimension values.
		mergeMapper = cartesianProduct;
	} else if ( dimensionCombinationStrategy === STRATEGY_ZIP ) {
		// When STRATEGY_ZIP is specified we use the zip function to generate one-to-one combinations of dimension values.
		mergeMapper = ( arrays ) => zip( ...arrays );
	} else {
		throw new Error(
			`Invalid dimension combination strategy: ${ dimensionCombinationStrategy }`
		);
	}

	// Process the streams of dimension values and add generated rows to the report data object.
	// First we merge all streams into one which will emit each set of dimension values as an array.
	merge( ...streams.map( ( stream ) => stream.pipe( toArray() ) ) )
		.pipe(
			// Then we convert the resulting stream to an array...
			toArray(),
			// So that we can pass it to the mergeMapper function defined above in order to generate the combinations of dimension values.
			// Using mergeMap here ensures the resulting set of values will be emitted as a new stream.
			mergeMap( mergeMapper ),
			// Then we apply the remaining operations to generate a row for each combination of dimension values.
			...ops
		)
		.subscribe( ( rows ) => {
			data.rows = rows;
			data.rowCount = rows.length;

			// We pretend that the first row contains minimums and the last one maximums because we don't
			// really need mathematically correct values and can simplify the process of finding this information.
			data.minimums = [
				{
					dimensionValues: dimensions.map( ( dimension ) => {
						if ( dimension === 'dateRange' ) {
							return { value: 'date_range_0' };
						}

						return {
							value: 'RESERVED_MIN',
						};
					} ),
					metricValues: cloneDeep( rows[ 0 ]?.metricValues || [] ),
				},
			].concat(
				hasDateRange
					? [
							{
								dimensionValues: dimensions.map(
									( dimension ) => {
										if ( dimension === 'dateRange' ) {
											return {
												value: 'date_range_1',
											};
										}

										return {
											value: 'RESERVED_MIN',
										};
									}
								),
								metricValues: cloneDeep(
									rows[ 1 ]?.metricValues || []
								),
							},
					  ]
					: []
			);

			// For maximums and totals, if we have a date range the second to last row will be date_range_0 and the last row will be date_range_1.
			// When there is no date range we only need to use the last row.
			const firstItemIndex = rows.length - ( hasDateRange ? 2 : 1 );

			data.maximums = [
				{
					dimensionValues: dimensions.map( ( dimension ) => {
						if ( dimension === 'dateRange' ) {
							return { value: 'date_range_0' };
						}

						return {
							value: 'RESERVED_MAX',
						};
					} ),
					metricValues: cloneDeep(
						rows[ firstItemIndex ]?.metricValues || []
					),
				},
			].concat(
				hasDateRange
					? [
							{
								dimensionValues: dimensions.map(
									( dimension ) => {
										if ( dimension === 'dateRange' ) {
											return {
												value: 'date_range_1',
											};
										}

										return {
											value: 'RESERVED_MAX',
										};
									}
								),
								metricValues: cloneDeep(
									rows[ rows.length - 1 ]?.metricValues || []
								),
							},
					  ]
					: []
			);

			// Same here, we pretend that the last row contains totals because we don't need it to be mathematically valid.
			data.totals = [
				{
					dimensionValues: dimensions.map( ( dimension ) => {
						if ( dimension === 'dateRange' ) {
							return { value: 'date_range_0' };
						}

						return {
							value: 'RESERVED_TOTAL',
						};
					} ),
					metricValues: cloneDeep(
						rows[ firstItemIndex ]?.metricValues || []
					),
				},
			].concat(
				hasDateRange
					? [
							{
								dimensionValues: dimensions.map(
									( dimension ) => {
										if ( dimension === 'dateRange' ) {
											return {
												value: 'date_range_1',
											};
										}

										return {
											value: 'RESERVED_TOTAL',
										};
									}
								),
								metricValues: cloneDeep(
									rows[ rows.length - 1 ]?.metricValues || []
								),
							},
					  ]
					: []
			);
		} );

	// Set the original seed value for the faker.
	faker.seed( originalSeedValue );

	return {
		dimensionHeaders: args?.dimensions
			? dimensions.map( ( dimension ) => ( {
					name: dimension,
			  } ) )
			: null,
		metricHeaders: validMetrics.map( ( metric ) => ( {
			name: metric?.name || metric.toString(),
			type: getMetricType( metric ),
		} ) ),
		...data,
	};
}

/**
 * Generates mock response for Analytics 4 reports.
 *
 * @since 1.94.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 * @param {Object}           options  Report options.
 */
export function provideAnalytics4MockReport( registry, options ) {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( getAnalytics4MockResponse( options ), { options } );
}
