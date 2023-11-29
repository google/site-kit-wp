/**
 * Time related utility functions tests.
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
import {
	convertDateStringToUNIXTimestamp,
	convertSecondsToArray,
} from './convert-time';

describe( 'convertSecondsToArray', () => {
	it.each( [
		[
			'should return an array with 0 as values if a string is passed as parameter',
			'test',
			[ 0, 0, 0, 0 ],
		],
		[
			'should return an array with 0 as values if an object is passed as parameter',
			{},
			[ 0, 0, 0, 0 ],
		],
		[
			'should return an array with 0 as values if an array is passed as parameter',
			[],
			[ 0, 0, 0, 0 ],
		],
		[
			'should return an array with 0 as values if a boolean is passed as parameter',
			true,
			[ 0, 0, 0, 0 ],
		],
		[
			'should return an array with the correct values if seconds and milliseconds are passed as parameter',
			196.385,
			[ 0, 3, 16, 385 ],
		],
		[
			'should return an array with the correct values if seconds are passed as parameter',
			196,
			[ 0, 3, 16, 0 ],
		],
	] )( '%s', ( _, args, expected ) => {
		const secondsArray = convertSecondsToArray( args );
		expect( secondsArray ).toEqual( expected );
	} );
} );

describe( 'convertDateStringToUNIXTimestamp', () => {
	it.each( [
		[
			'should return a converted unix timestamp as value if a date time string is passed as parameter',
			'2014-10-02T15:01:23Z',
			1412262083000,
		],
		[
			'should return passed unix timestamp as value if unix timestamp is passed as parameter',
			1412262083000,
			1412262083000,
		],
		[
			'should return a converted unix timestamp as value if only a date string is passed as parameter',
			'2014-10-02',
			1412208000000,
		],
		[
			'should return empty value if empty value is passed as parameter',
			'',
			'',
		],
		[
			'should return empty value if invalid date/date time string is passed as parameter',
			'15:01:23',
			'',
		],
		[
			'should return unix timestamp value if Date object is passed as parameter',
			new Date(),
			new Date().getTime(),
		],

		[
			'should return null if null value is passed as parameter',
			null,
			null,
		],
	] )( '%s', ( _, args, expected ) => {
		const unixTimestamp = convertDateStringToUNIXTimestamp( args );
		expect( unixTimestamp ).toEqual( expected );
	} );
} );
