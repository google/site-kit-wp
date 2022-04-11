/**
 * Tests for faker.js data generation.
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
 * External dependencies
 */
import faker from 'faker';

describe( 'Fake data generation', () => {
	it( 'should be consistent based on the seed data', () => {
		// This ensures all data created by faker throughout tests is consistent
		// between test runs.
		//
		// This prevents any issues with some test data, when entirely random,
		// causing issues generating random data when used for things like unique
		// IDs, React `key` props, etc.
		//
		// If this test is failing, you probably changed `knownSafeSeed` from `500`.
		// There should be no reason to do this, but this test serves to alert
		// developers if they make changes to the faker seed data.
		expect( {
			string: faker.lorem.word(),
			number: faker.datatype.number(),
			boolean: faker.datatype.boolean(),
			array: [
				faker.random.arrayElement(),
				faker.random.arrayElement(),
				faker.random.arrayElement(),
			],
		} ).toMatchInlineSnapshot( `
		Object {
		  "array": Array [
		    "b",
		    "b",
		    "a",
		  ],
		  "boolean": false,
		  "number": 7474,
		  "string": "eligendi",
		}
	` );
	} );
} );
