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
import { Observable, zip } from 'rxjs';
import { map, reduce } from 'rxjs/operators';

const ADSENSE_METRIC_TYPES = {
	EARNINGS: 'FLOAT',
	PAGE_VIEWS_RPM: 'FLOAT',
	IMPRESSIONS: 'INTEGER',
	PAGE_VIEWS_CTR: 'FLOAT',
};

/**
 * Generates and returns metric values.
 *
 * @since n.e.x.t
 *
 * @param {Array.<string>} metrics Metric list.
 * @return {Array.<string>} Array of metric values.
 */
function generateMetricValues( metrics ) {
	const values = [];

	for ( const metric of metrics ) {
		switch ( ADSENSE_METRIC_TYPES[ metric.toUpperCase() ] ) {
			case 'INTEGER':
				values.push( faker.random.number( { min: 0, max: 100 } ).toString() );
				break;
			case 'FLOAT':
				values.push( faker.random.float( { min: 0, max: 100 } ).toFixed( 2 ) );
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

	const data = {
		kind: 'adsense#report',
		startDate: args.startDate,
		endDate: args.endDate,
		totalMatchedRows: '0',
		headers: [],
		totals: [],
		averages: [],
		rows: [],
	};

	const streams = [];

	( Array.isArray( args.dimensions ) ? args.dimensions : [ args.dimensions ] ).forEach( ( dimension ) => {
		switch ( dimension.toUpperCase() ) {
			case 'DATE':
				// Generates a stream (an array) of dates when the dimension is ga:date.
				streams.push( new Observable( ( observer ) => {
					const currentDate = new Date( args.startDate );
					const end = new Date( args.endDate );

					while ( currentDate.getTime() <= end.getTime() ) {
						observer.next( currentDate.toISOString().split( 'T' )[ 0 ] );
						currentDate.setDate( currentDate.getDate() + 1 );
					}

					observer.complete();
				} ) );
				break;
		}
	} );

	// This is the list of operations that we apply to the cobmined stream (array) of dimension values.
	const ops = [
		// Make sure each row is an array.
		map( ( row ) => Array.isArray( row ) ? row : [ row ] ),
		// Add metric values.
		map( ( row ) => [
			...row,
			...generateMetricValues( ( Array.isArray( args.metrics ) ? args.metrics : [ args.metrics ] ).filter( ( metric ) => !! metric ) ),
		] ),
		// Accumulate all rows into a single array.
		reduce( ( rows, row ) => [ ...rows, row ], [] ),
	];

	// Process the stream of dimension values and add generated rows to the report data object.
	zip( ...streams ).pipe( ...ops ).subscribe( ( rows ) => {
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
