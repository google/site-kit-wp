/**
 * Tests for Analytics 4 reporting API validation utilities.
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
import { isValidMetrics } from './report-validation';

describe( 'Analytics Reporting API validation', () => {
	describe( 'isValidMetrics', () => {
		it( 'should return TRUE if a non empty string is passed', () => {
			expect( isValidMetrics( 'test' ) ).toBeTruthy();
		} );

		it( 'should return TRUE if a valid object is passed', () => {
			expect( isValidMetrics( {
				expression: 'test',
				name: 'Test',
			} ) ).toBeTruthy();

			// 'name' is optional.
			expect( isValidMetrics( {
				expression: 'test',
			} ) ).toBeTruthy();
		} );

		it( 'should return TRUE if a valid array of objects/strings is passed', () => {
			expect( isValidMetrics( [
				{
					expression: 'test',
					name: 'Test',
				},
				'test2',
				'test3',
				{
					expression: 'test4',
					name: 'Test4',
				},
				{ expression: 'test5' },
			] ) ).toBeTruthy();
		} );

		it( 'should return FALSE if neither string nor array is passed', () => {
			expect( isValidMetrics( 5.2 ) ).toBeFalsy();
		} );

		it( 'should return FALSE if not a valid array of objects/strings is passed', () => {
			expect( isValidMetrics( [
				{
					expression: 'test',
					name: 'Test',
				},
				'test2',
				5,
				{
					expression: 'test4',
					name: 'Test4',
				},
			] ) ).toBeFalsy();
		} );
	} );
} );
