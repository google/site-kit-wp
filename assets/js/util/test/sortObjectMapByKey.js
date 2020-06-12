/**
 * sortObjectMapByKey tests.
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
 * Internal depedencies
 */
import { sortObjectMapByKey } from '../';

const sortMe = {
	objectOne: { name: 'First', order: 1 },
	objectTwo: { name: 'Fifth', order: 10 },
	objectThree: { name: 'Fourth', order: 9 },
	objectFour: { name: 'Second', order: 3 },
	objectFive: { name: 'Third', order: 7 },
};

describe( 'sortObjectMapByKey', () => {
	it( 'returns an array correctly sorted passed key', () => {
		const expectedResults = [
			{ name: 'First', order: 1 },
			{ name: 'Second', order: 3 },
			{ name: 'Third', order: 7 },
			{ name: 'Fourth', order: 9 },
			{ name: 'Fifth', order: 10 },
		];

		expect( sortObjectMapByKey( sortMe, 'order' ) ).toStrictEqual( expectedResults );
	} );
	it( 'returns an array with the same order if sort key is omitted or is not on the object', () => {
		const expectedResults = [
			{ name: 'First', order: 1 },
			{ name: 'Fifth', order: 10 },
			{ name: 'Fourth', order: 9 },
			{ name: 'Second', order: 3 },
			{ name: 'Third', order: 7 },
		];
		expect( sortObjectMapByKey( sortMe ) ).toStrictEqual( expectedResults );
		expect( sortObjectMapByKey( sortMe, 'undefinedSortKey' ) ).toStrictEqual( expectedResults );
	} );
} );
