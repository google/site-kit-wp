/**
 * Traffic Overview `getPropertyCreatedMarkerDate` utility tests.
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
import { getPropertyCreatedMarkerDate } from './getPropertyCreatedMarkerDate';

describe( 'getPropertyCreatedMarkerDate', () => {
	it( 'should return the day the Analytics property was created when it is the first plotted day', () => {
		expect(
			getPropertyCreatedMarkerDate(
				'2026-08-19',
				'2026-08-19',
				'2026-09-15'
			)
		).toBe( '2026-08-19' );
	} );

	it( 'should return the day the Analytics property was created when it is the last plotted day', () => {
		expect(
			getPropertyCreatedMarkerDate(
				'2026-09-15',
				'2026-08-19',
				'2026-09-15'
			)
		).toBe( '2026-09-15' );
	} );

	it( 'should return `undefined` when the Analytics property was created the day before the first plotted day', () => {
		expect(
			getPropertyCreatedMarkerDate(
				'2026-08-18',
				'2026-08-19',
				'2026-09-15'
			)
		).toBeUndefined();
	} );

	it( 'should return `undefined` when the Analytics property was created the day after the last plotted day', () => {
		expect(
			getPropertyCreatedMarkerDate(
				'2026-09-16',
				'2026-08-19',
				'2026-09-15'
			)
		).toBeUndefined();
	} );

	it( 'should return `undefined` when the day the Analytics property was created is `undefined`', () => {
		expect(
			getPropertyCreatedMarkerDate(
				undefined,
				'2026-08-19',
				'2026-09-15'
			)
		).toBeUndefined();
	} );
} );
