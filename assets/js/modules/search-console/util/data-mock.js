/**
 * Search Console test data mock.
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
import invariant from 'invariant';
import faker from 'faker';
import md5 from 'md5';
import { isPlainObject } from 'lodash';
import { range } from 'rxjs';
import { map, reduce, take } from 'rxjs/operators';

/**
 * Internal dependencies
 */
import { MODULES_SEARCH_CONSOLE } from '../datastore/constants';
import { getDateString, isValidDateString } from '../../../util';
import { stringToDate } from '../../../util/date-range/string-to-date';

/**
 * Generates mock data for Search Console reports.
 *
 * @since 1.43.0
 *
 * @param {Object} args Report options.
 * @return {Array.<Object>} An array with generated report.
 */
export function getSearchConsoleMockResponse( args ) {
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

	const report = [];

	const startDate = stringToDate( args.startDate );
	const endDate = stringToDate( args.endDate );
	const dayInMilliseconds = 24 * 60 * 60 * 1000;
	const totalDays = 1 + ( endDate - startDate ) / dayInMilliseconds; // +1 to include the endDate into the dates range.

	// This is the list of operations that we will apply to the range (array) of numbers.
	const ops = [
		// Converts range number to a date string.
		map( ( item ) => {
			const updatedMilliseconds = new Date( startDate ).setDate(
				startDate.getDate() + item
			);
			return getDateString( new Date( updatedMilliseconds ) );
		} ),
		// Add dimension and metric values.
		map( ( date ) => ( {
			clicks: faker.datatype.number( { min: 0, max: 150 } ),
			ctr: faker.datatype.float( { min: 0, max: 1 } ),
			impressions: faker.datatype.number( { min: 0, max: 1500 } ),
			keys: [
				args.dimensions !== 'query'
					? date
					: faker.lorem
							.sentence(
								faker.datatype.number( { min: 1, max: 2 } )
							)
							.replace( '.', '' ),
			],
			position: 10 * faker.datatype.float( { min: 0, max: 1 } ),
		} ) ),
		// Limit the number of rows.
		take( args.limit || totalDays ),
		// Accumulate all rows into a single array.
		reduce( ( rows, row ) => [ ...rows, row ], [] ),
	];

	// Process the stream of dates and add generated rows to the report data object.
	range( 0, totalDays )
		.pipe( ...ops )
		.subscribe( ( rows ) => {
			report.push( ...rows );
		} );

	// Set the original seed value for the faker.
	faker.seed( originalSeedValue );

	return report;
}

/**
 * Generates mock response for Search Console reports.
 *
 * @since 1.43.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 * @param {Object}           options  Report options.
 */
export function provideSearchConsoleMockReport( registry, options ) {
	registry
		.dispatch( MODULES_SEARCH_CONSOLE )
		.receiveGetReport( getSearchConsoleMockResponse( options ), {
			options,
		} );
}
