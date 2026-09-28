/**
 * `formatConsentDate` tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { formatConsentDate } from './formatConsentDate';

describe( 'formatConsentDate', () => {
	// The test environment runs in American English, the `en-US` locale.
	it( 'should format a `YYYY-MM-DD` date as a long date in the site locale', () => {
		expect( formatConsentDate( '2026-07-28' ) ).toBe( 'July 28, 2026' );
	} );

	it.each( [
		[ 'a missing value', undefined ],
		[ 'an empty value', '' ],
		[ 'a date in the `MM/DD/YYYY` format', '07/28/2026' ],
		[ 'a date with an out-of-range month and day', '2026-13-45' ],
	] )( 'should return an empty string for %s', ( _, consentDate ) => {
		expect( formatConsentDate( consentDate ) ).toBe( '' );
	} );
} );
