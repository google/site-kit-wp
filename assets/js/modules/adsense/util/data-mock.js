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
import md5 from 'md5';
import { range } from 'rxjs';
import { map, reduce } from 'rxjs/operators';

const METRIC_RATIO = 'METRIC_RATIO';
const METRIC_TALLY = 'METRIC_TALLY';
const METRIC_CURRENCY = 'METRIC_CURRENCY';

const ADSENSE_METRIC_TYPES = {
	EARNINGS: METRIC_CURRENCY,
	PAGE_VIEWS_RPM: METRIC_CURRENCY,
	IMPRESSIONS: METRIC_TALLY,
	PAGE_VIEWS_CTR: METRIC_RATIO,
};

/**
 * Generates and returns report headers.
 *
 * @since n.e.x.t
 *
 * @param {Array.<string>} metrics    Metircs list.
 * @param {Array.<string>} dimensions Dimensions list.
 * @return {Array.<Object>} Headers list.
 */
function generateHeaders( metrics, dimensions ) {
	const headers = [];

	dimensions.forEach( ( dimension ) => {
		headers.push( {
			currency: null,
			name: dimension.toUpperCase(),
			type: 'DIMENSION',
		} );
	} );

	metrics.forEach( ( metric ) => {
		const ucMetric = metric.toUpperCase();
		headers.push( {
			currency: ADSENSE_METRIC_TYPES[ ucMetric ] === METRIC_CURRENCY ? 'USD' : null,
			name: ucMetric,
			type: ADSENSE_METRIC_TYPES[ ucMetric ],
		} );
	} );

	return headers;
}

/**
 * Generates and returns metric values.
 *
 * @since n.e.x.t
 *
 * @param {string}         date    The current date.
 * @param {Array.<string>} metrics Metrics list.
 * @return {Array.<string>} Array of metric values.
 */
function generateMetricValues( date, metrics ) {
	const values = [];

	for ( const metric of metrics ) {
		switch ( ADSENSE_METRIC_TYPES[ metric.toUpperCase() ] ) {
			case METRIC_TALLY:
				values.push( faker.random.number( { min: 0, max: 100 } ).toString() );
				break;
			case METRIC_CURRENCY:
				values.push( faker.random.float( { min: 0, max: 100 } ).toFixed( 2 ) );
				break;
			case METRIC_RATIO:
				values.push( faker.random.float( { min: 0, max: 1 } ).toFixed( 2 ) );
				break;
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
 * @since n.e.x.t
 *
 * @param {string}         date       The current date.
 * @param {Array.<string>} dimensions Dimensions list.
 * @return {Array.<string>} Array of dimension values.
 */
function generateDimensionValues( date, dimensions ) {
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

/**
 * Generates mock data for AdSense reports.
 *
 * @since n.e.x.t
 *
 * @param {Object} args Report options.
 * @return {Array.<Object>} An array with generated report.
 */
export function getAdSenseMockResponse( args ) {
	const originalSeedValue = faker.seedValue;
	const argsHash = parseInt(
		md5( JSON.stringify( args ) ).substring( 0, 8 ),
		16,
	);

	// We set seed for every data mock to make sure that the same arguments get the same report data.
	// It means that everyone will have the same report data and will see the same widgets in the storybook.
	// This approach gives us additional flexibility to control randomness on a per widget basis.
	if ( ! Number.isNaN( argsHash ) ) {
		faker.seed( argsHash );
	}

	const metrics = ( Array.isArray( args.metrics ) ? args.metrics : [ args.metrics ] ).filter( ( metric ) => !! metric );
	const dimensions = ( Array.isArray( args.dimensions ) ? args.dimensions : [ args.dimensions ] ).filter( ( dimension ) => !! dimension );

	const data = {
		kind: 'adsense#report',
		startDate: args.startDate,
		endDate: args.endDate,
		totalMatchedRows: '0',
		headers: generateHeaders( metrics, dimensions ),
		totals: [],
		averages: [],
		rows: [],
	};

	const startDate = new Date( args.startDate );
	const endDate = new Date( args.endDate );
	const dayInMilliseconds = 24 * 60 * 60 * 1000;
	const totalDays = 1 + ( ( endDate - startDate ) / dayInMilliseconds ); // +1 to include the endDate into the dates range.

	// This is the list of operations that we will apply to the range (array) of numbers.
	const ops = [
		// Converts range number to a date string.
		map( ( item ) => ( new Date( startDate.getTime() + ( dayInMilliseconds * item ) ) ).toISOString().split( 'T' )[ 0 ] ),
		// Add dimension and metric values.
		map( ( date ) => [ ...generateDimensionValues( date, dimensions ), ...generateMetricValues( date, metrics ) ] ),
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

	return data;
}
