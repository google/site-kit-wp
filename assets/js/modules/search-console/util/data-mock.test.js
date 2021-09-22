/**
 * Data mock tests.
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
 * Internal dependencies
 */
import { getSearchConsoleMockResponse } from './data-mock';

describe( 'getSearchConsoleMockResponse', () => {
	const startDate = '2021-07-01';
	const endDate = '2021-07-28';

	it( 'throws if called without report options', () => {
		expect( () => getSearchConsoleMockResponse() ).toThrow(
			'report options are required'
		);
	} );

	it( 'throws if called without a valid startDate', () => {
		expect( () =>
			getSearchConsoleMockResponse( { startDate: 'not-a-date' } )
		).toThrow( 'a valid startDate is required' );
	} );

	it( 'throws if called without a valid endDate', () => {
		expect( () =>
			getSearchConsoleMockResponse( { endDate: 'not-a-date', startDate } )
		).toThrow( 'a valid endDate is required' );
	} );

	it( 'generates a valid report', () => {
		const report = getSearchConsoleMockResponse( {
			startDate,
			endDate,
			dimensions: 'date',
		} );

		expect( report ).toHaveLength( 28 );
	} );
} );
