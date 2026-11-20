/**
 * Traffic Overview `getKeyFactorsNoticeText` utility tests.
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
import {
	KeyFactorsNoticeOptions,
	getKeyFactorsNoticeText,
} from './getKeyFactorsNoticeText';

/** A 28-day range with its key factors, on 2025-02-05. */
const OPTIONS: KeyFactorsNoticeOptions = {
	rangeTooShort: false,
	noPreviousPeriod: false,
	keyFactorsAvailableFrom: '2025-01-01',
	referenceDate: '2025-02-05',
	noChange: false,
	daysInSelectedRange: 28,
};

describe( 'getKeyFactorsNoticeText', () => {
	it( 'should give no text when channels changed notably', () => {
		expect( getKeyFactorsNoticeText( OPTIONS ) ).toBeNull();
	} );

	it( 'should say that no channel changed notably over the previous period of the same length', () => {
		expect(
			getKeyFactorsNoticeText( { ...OPTIONS, noChange: true } )
		).toBe(
			'No channel changed notably compared with the previous 28 days'
		);
	} );

	it( 'should name a single day in the singular', () => {
		expect(
			getKeyFactorsNoticeText( {
				...OPTIONS,
				noChange: true,
				daysInSelectedRange: 1,
			} )
		).toBe( 'No channel changed notably compared with the previous 1 day' );
	} );

	it( 'should say when the key factors will show while the previous period has no recorded traffic, rather than that no channel changed', () => {
		expect(
			getKeyFactorsNoticeText( {
				...OPTIONS,
				noPreviousPeriod: true,
				keyFactorsAvailableFrom: '2025-02-06',
				noChange: true,
			} )
		).toBe(
			'There’s no previous period to compare to yet. Check back on February 6, 2025 to see which channels changed the most.'
		);
	} );

	it( 'should ask for a range of at least 7 days for a range too short, whatever else holds', () => {
		expect(
			getKeyFactorsNoticeText( {
				...OPTIONS,
				rangeTooShort: true,
				noPreviousPeriod: true,
				noChange: true,
				daysInSelectedRange: 1,
			} )
		).toBe(
			'Select a date range of at least 7 days to see which channels changed the most'
		);
	} );
} );
