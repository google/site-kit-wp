/**
 * AdSense test data mock.
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
import faker from 'faker';
import invariant from 'invariant';
import md5 from 'md5';
import { castArray, isPlainObject } from 'lodash';
import { range } from 'rxjs';
import { map, reduce } from 'rxjs/operators';

/**
 * Internal dependencies
 */
import { MODULES_ADSENSE } from '../datastore/constants';
import { getDateString, isValidDateString, stringToDate } from '../../../util';
import { validateMetrics } from './report-validation';
import { dateInstanceToAdSenseDate } from './date';

const METRIC_RATIO = 'METRIC_RATIO';
const METRIC_TALLY = 'METRIC_TALLY';
const METRIC_CURRENCY = 'METRIC_CURRENCY';

const ADSENSE_METRIC_TYPES = {
	ESTIMATED_EARNINGS: METRIC_CURRENCY,
	PAGE_VIEWS_RPM: METRIC_CURRENCY,
	IMPRESSIONS: METRIC_TALLY,
	PAGE_VIEWS_CTR: METRIC_RATIO,
};

class DataFactory {
	/**
	 * Constructor.
	 *
	 * @since 1.36.0
	 */
	constructor() {
		this.metricMemory = {};
	}

	/**
	 * Generates and returns report headers.
	 *
	 * @since 1.36.0
	 *
	 * @param {Array.<string>} metrics    Metrics list.
	 * @param {Array.<string>} dimensions Dimensions list.
	 * @return {Array.<Object>} Headers list.
	 */
	createHeaders( metrics, dimensions ) {
		const headers = [];

		dimensions.forEach( ( dimension ) => {
			headers.push( {
				currencyCode: null,
				name: dimension.toUpperCase(),
				type: 'DIMENSION',
			} );
		} );

		metrics.forEach( ( metric ) => {
			const ucMetric = metric.toUpperCase();
			headers.push( {
				currencyCode:
					ADSENSE_METRIC_TYPES[ ucMetric ] === METRIC_CURRENCY
						? 'USD'
						: null,
				name: ucMetric,
				type: ADSENSE_METRIC_TYPES[ ucMetric ],
			} );
		} );

		return headers;
	}

	/**
	 * Generates and returns metric values.
	 *
	 * @since 1.36.0
	 *
	 * @param {string}         date    The current date.
	 * @param {Array.<string>} metrics Metrics list.
	 * @return {Array.<string>} Array of metric values.
	 */
	createMetricValues( date, metrics ) {
		const values = [];
		const delta = 0.15;

		for ( const metric of metrics ) {
			const lastValue = this.metricMemory[ metric ];
			const min = lastValue * ( 1 - delta );
			const max = lastValue * ( 1 + delta );

			switch ( ADSENSE_METRIC_TYPES[ metric.toUpperCase() ] ) {
				case METRIC_TALLY: {
					const options =
						lastValue === undefined
							? { min: 500, max: 700 }
							: {
									min: Math.floor( min ),
									max: Math.ceil( max ),
							  };

					const newValue = faker.datatype.number( options );
					values.push( newValue.toString() );
					this.metricMemory[ metric ] = newValue;
					break;
				}
				case METRIC_CURRENCY: {
					const options =
						lastValue === undefined
							? { min: 500, max: 700 }
							: { min, max };

					const newValue = faker.datatype.float( options );
					values.push( newValue.toFixed( 2 ) );
					this.metricMemory[ metric ] = newValue;
					break;
				}
				case METRIC_RATIO: {
					const options =
						lastValue === undefined
							? { min: 0.4, max: 0.6 }
							: {
									min,
									max: Math.min( max, 1 ),
							  };

					const newValue = faker.datatype.float( options );
					values.push( newValue.toFixed( 2 ) );
					this.metricMemory[ metric ] = newValue;
					break;
				}
				default:
					values.push( '' );
					break;
			}
		}

		return values;
	}

	/**
	 * Generates and returns dimension values.
	 *
	 * @since 1.36.0
	 *
	 * @param {string}         date       The current date.
	 * @param {Array.<string>} dimensions Dimensions list.
	 * @return {Array.<string>} Array of dimension values.
	 */
	createDimensionValues( date, dimensions ) {
		const values = [];

		for ( const dimension of dimensions ) {
			switch ( dimension.toUpperCase() ) {
				case 'DATE':
					values.push( date );
					break;
			}
		}

		return values;
	}
}

/**
 * Creates a row object from an array of values.
 *
 * @since 1.36.0
 *
 * @param {Array} array Array.
 * @return {Object} Row.
 */
function rowFromArray( array ) {
	return {
		cells: array.map( ( value ) => ( { value } ) ),
	};
}

/**
 * Generates mock data for AdSense reports.
 *
 * @since 1.36.0
 *
 * @param {Object} args Report options.
 * @return {Array.<Object>} An array with generated report.
 */
export function getAdSenseMockResponse( args ) {
	invariant(
		isPlainObject( args ),
		'report options are required to generate a mock response.'
	);
	invariant(
		isValidDateString( args.startDate ),
		'a valid startDate is required.'
	);
	invariant(
		isValidDateString( args.endDate ),
		'a valid endDate is required.'
	);
	validateMetrics( args.metrics );

	const originalSeedValue = faker.seedValue;
	const argsHash = parseInt(
		md5( JSON.stringify( args ) ).substring( 0, 10 ),
		16
	);

	// We set seed for every data mock to make sure that the same arguments get the same report data.
	// It means that everyone will have the same report data and will see the same widgets in the storybook.
	// This approach gives us additional flexibility to control randomness on a per widget basis.
	if ( ! Number.isNaN( argsHash ) ) {
		faker.seed( argsHash );
	}

	const factory = new DataFactory();
	const metrics = castArray( args.metrics ).filter( ( metric ) => !! metric );
	const dimensions = castArray( args.dimensions ).filter(
		( dimension ) => !! dimension
	);

	const data = {
		warnings: [],
		startDate: args.startDate,
		endDate: args.endDate,
		totalMatchedRows: '0',
		headers: factory.createHeaders( metrics, dimensions ),
		totals: [],
		averages: [],
		rows: [],
	};

	const startDate = stringToDate( args.startDate );
	const endDate = stringToDate( args.endDate );
	const dayInMilliseconds = 24 * 60 * 60 * 1000;
	const totalDays = 1 + ( endDate - startDate ) / dayInMilliseconds; // +1 to include the endDate into the dates range.

	// This is the list of operations that we will apply to the range (array) of numbers.
	const ops = [
		// Converts range number to a date string.
		map( ( item ) => {
			// Valid use of `new Date()` with an argument.
			// eslint-disable-next-line sitekit/no-direct-date
			const updatedMilliseconds = new Date( startDate ).setDate(
				startDate.getDate() + item
			);

			// Valid use of `new Date()` with an argument.
			// eslint-disable-next-line sitekit/no-direct-date
			return getDateString( new Date( updatedMilliseconds ) );
		} ),
		// Add dimension and metric values.
		map( ( date ) => [
			...factory.createDimensionValues( date, dimensions ),
			...factory.createMetricValues( date, metrics ),
		] ),
		// Accumulate all rows into a single array.
		reduce( ( rows, row ) => [ ...rows, row ], [] ),
	];

	// Process the stream of dates and add generated rows to the report data object.
	range( 0, totalDays )
		.pipe( ...ops )
		.subscribe( ( rows ) => {
			data.rows = rows;
			data.totalMatchedRows = rows.length.toString();

			// We pretend that the first row contains averages and the last one totals because we don't
			// really need mathematically correct values and can simplify the process of finding this information.
			data.totals = [ ...( rows[ rows.length - 1 ] || [] ) ];
			data.averages = [ ...( rows[ 0 ] || [] ) ];
		} );

	// Set the original seed value for the faker.
	faker.seed( originalSeedValue );

	return {
		...data,
		// v2 transforms.
		rows: data.rows.map( ( rowArray ) => rowFromArray( rowArray ) ),
		totals: rowFromArray( data.totals ),
		averages: rowFromArray( data.averages ),
		startDate: dateInstanceToAdSenseDate( startDate ),
		endDate: dateInstanceToAdSenseDate( endDate ),
	};
}

/**
 * Generates mock response for AdSense reports.
 *
 * @since 1.36.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 * @param {Object}           options  Report options.
 */
export function provideAdSenseMockReport( registry, options ) {
	registry
		.dispatch( MODULES_ADSENSE )
		.receiveGetReport( getAdSenseMockResponse( options ), {
			options,
		} );
}

/**
 * Provides multiple mock reports for AdSense.
 *
 * @since 1.145.0
 *
 * @param {wp.data.registry} registry     Registry with all available stores registered.
 * @param {Array.<Object>}   optionsArray Array of report options.
 */
export function provideAdSenseMockReports( registry, optionsArray ) {
	optionsArray.forEach( ( options ) => {
		provideAdSenseMockReport( registry, options );
	} );
}
