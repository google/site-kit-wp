/**
 * Site Goals breakdown enabled state tests.
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
import { isSiteGoalsBreakdownEnabled } from './breakdownEnabled';

describe( 'isSiteGoalsBreakdownEnabled', () => {
	it.each( [
		[ 'the dimensions and conversion tracking are on', true, true, true ],
		[
			'the dimensions exist but conversion tracking is off',
			true,
			false,
			false,
		],
		[
			'the dimensions are missing but conversion tracking is on',
			false,
			true,
			false,
		],
		[
			'the dimensions are missing and conversion tracking is off',
			false,
			false,
			false,
		],
		[ 'the dimensions are loading', undefined, true, undefined ],
		[
			'the conversion tracking setting is loading',
			true,
			undefined,
			undefined,
		],
		[
			'the dimensions are missing while the setting is loading',
			false,
			undefined,
			false,
		],
	] )(
		'for a user who can manage options, returns the expected state when %s',
		(
			_,
			hasBreakdownDimensions,
			isConversionTrackingEnabled,
			expected
		) => {
			expect(
				isSiteGoalsBreakdownEnabled( hasBreakdownDimensions, {
					canManageOptions: true,
					isConversionTrackingEnabled,
				} )
			).toBe( expected );
		}
	);

	it.each( [
		[ 'the dimensions exist', true, true ],
		[ 'the dimensions are missing', false, false ],
	] )(
		'for a user who cannot read the setting, follows the dimensions alone when %s',
		( _, hasBreakdownDimensions, expected ) => {
			expect(
				isSiteGoalsBreakdownEnabled( hasBreakdownDimensions, {
					canManageOptions: false,
					isConversionTrackingEnabled: undefined,
				} )
			).toBe( expected );
		}
	);

	it( 'returns undefined while the capabilities are loading', () => {
		expect(
			isSiteGoalsBreakdownEnabled( true, {
				canManageOptions: undefined,
				isConversionTrackingEnabled: undefined,
			} )
		).toBeUndefined();
	} );
} );
