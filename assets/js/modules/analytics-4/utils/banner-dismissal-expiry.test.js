/**
 * GA4 Activation Banner dismissal expiry time tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { getBannerDismissalExpiryTime } from './banner-dismissal-expiry';

describe( 'modules/analytics-4 banner dismissal expiry', () => {
	describe( 'getBannerDismissalExpiryTime', () => {
		it.each( [
			[ '2023-04-30', 2592000 ],
			[ '2023-05-01', 2592000 ],
			[ '2023-05-02', 2505600 ],
			[ '2023-05-03', 2419200 ],
			[ '2023-05-28', 259200 ],
			[ '2023-05-29', 172800 ],
			[ '2023-05-30', 172800 ],
			[ '2023-05-31', 172800 ],
			[ '2023-06-01', 172800 ],
			[ '2023-06-02', 172800 ],
		] )( 'on %s date should return %d', ( referenceDate, expected ) => {
			expect( getBannerDismissalExpiryTime( referenceDate ) ).toBe(
				expected
			);
		} );
	} );
} );
