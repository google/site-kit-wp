/**
 * `numFmt` tests
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
import { set, unset } from 'lodash';

/**
 * Internal dependencies
 */
import { numFmt } from '../';

const setupGoogleSiteKit = ( langCode ) => {
	set( global._googlesitekitLegacyData, 'locale', langCode );
};

// Unlike normal space. ASCII 32
// This `NO-BREAK SPACE` or HTML's `&nbsp;` is used by Intl.NumberFormat between unit and number. ASCII `194 160`
const NO_BREAK_SPACE = ' ';

describe( 'numFmt', () => {
	afterEach( () => {
		unset( global._googlesitekitLegacyData, 'locale' );
	} );

	const siteKitLocales = [
		[ 'de_DE_formal', 1.238725, '%', `123,87${ NO_BREAK_SPACE }%` ],
		[ 'de_CH_informal', 1.238725, '%', '123.87%' ],
		[ 'pt_PT_ao90', 1.238725, '%', '123,87%' ],
		[ 'fr', 1.238725, '%', `123,87${ NO_BREAK_SPACE }%` ],
		[ 'en_US', 1.238725, '%', '123.87%' ],
		[ 'en_US', 123.87, 'USD', '$123.87' ],
		[ 'ur', 123.87, 'USD', `$${ NO_BREAK_SPACE }123.87` ],
		[ 'en_US', 12, 's', '12s' ],
		[ 'en_US', 123, 's', '2m 3s' ],
		[ 'en_US', 10000000, '', '10M' ],
		[ 'en_US', 999, '', '999' ],
		[ 'en_US', 9, 's', '9s' ],
		[ 'en_US', 60 * 60 * 3 + 60 * 5 + 12, 's', '3h 5m 12s' ],
		[
			'en_US',
			60 * 60 * 3 + 60 * 5 + 12,
			{ style: 'duration' },
			'3 hr 5 min 12 sec',
		],
		[
			'en_US',
			60 * 60 * 3 + 60 * 5 + 12,
			{ style: 'duration', unitDisplay: 'narrow' },
			'3h 5m 12s',
		],
		[
			'en_US',
			60 * 60 * 3 + 60 * 5 + 12,
			{ style: 'duration', unitDisplay: 'long' },
			'3 hours 5 minutes 12 seconds',
		],
		[ 'en_US', 65, 's', '1m 5s' ],
		[ 'en_US', 125, 's', '2m 5s' ],
		[ 'en_US', 35, 's', '35s' ],
		[ 'en_US', 60, 's', '1m' ],
		[ 'en_US', 60 * 60 * 3 + 60 * 5 + 12, 's', '3h 5m 12s' ],
		[ 'en_US', 60 * 60 * 7 + 60 * 2 + 42, 's', '7h 2m 42s' ],
		[ 'en_US', 0, 's', '0s' ],
	];

	it.each( siteKitLocales )(
		'formats numbers correctly with locale variant %s',
		( locale, number, unit, expected ) => {
			setupGoogleSiteKit( locale );
			expect( numFmt( number, unit ) ).toStrictEqual( expected );
		}
	);
} );
