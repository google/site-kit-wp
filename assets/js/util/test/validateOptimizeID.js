/**
 * `validateOptimizeID` tests
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { validateOptimizeID } from '../';

const valuesToTest = [
	[
		'GTM-XXXXXXX',
		true,
	],
	[
		'GTM-XXXXXX',
		false,
	],
	[
		'GTM-1234567',
		true,
	],
	[
		'GTMXXXXXXXX',
		false,
	],
	[
		'gtm-xxxxxxx',
		false,
	],
	[
		'OPT-XXXXXXX',
		true,
	],
	[
		'OPT-XXXXXX',
		false,
	],
	[
		'OPT-1234567',
		true,
	],
	[
		'OPTXXXXXXXX',
		false,
	],
	[
		'opt-xxxxxxx',
		false,
	],
];

describe( 'validateOptimizeID', () => {
	it.each( valuesToTest )( 'should validate %s with validation status %p', ( stringToValidate, expected ) => {
		expect( Boolean( validateOptimizeID( stringToValidate ) ) ).toStrictEqual( expected );
	} );
} );
