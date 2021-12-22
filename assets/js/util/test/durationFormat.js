/**
 * Duration Formatting tests.
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

import { createDurationFormat } from '../i18n';

describe( 'durationFormat', () => {
	describe( 'formatUnit', () => {
		it.each( [
			[ 0, {}, '0 sec', 'en-US' ],
			[ 0, { unitDisplay: 'narrow' }, '0s', 'en-US' ],
			[ 60 * 60 * 3 + 60 * 5 + 12, {}, '3 hr 5 min 12 sec', 'en-US' ],
			[
				60 * 60 * 3 + 60 * 5 + 12,
				{ unitDisplay: 'narrow' },
				'3h 5m 12s',
				'en-US',
			],
			[
				60 * 60 * 3 + 60 * 5 + 12,
				{ unitDisplay: 'long' },
				'3 hours 5 minutes 12 seconds',
				'en-US',
			],
		] )(
			'formats %s seconds with options %o as %s',
			( duration, options, expected, locale ) => {
				const { formatUnit } = createDurationFormat( duration, {
					locale,
					...options,
				} );
				expect( formatUnit() ).toStrictEqual( expected );
			}
		);
	} );

	describe( 'formatDecimal', () => {
		it.each( [
			[ 0, '0s' ],
			[ 9, '9s' ],
			[ 12, '12s' ],
			[ 35, '35s' ],
			[ 60, '1m' ],
			[ 65, '1m 5s' ],
			[ 125, '2m 5s' ],
			[ 60 * 60 * 3 + 60 * 5 + 12, '3h 5m 12s' ],
			[ 60 * 60 * 7 + 60 * 2 + 42, '7h 2m 42s' ],
		] )(
			'formats %s seconds with options %o as %s',
			( duration, expected ) => {
				const { formatDecimal } = createDurationFormat( duration );
				expect( formatDecimal() ).toStrictEqual( expected );
			}
		);
	} );
} );
