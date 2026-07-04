/**
 * `modules/tagmanager` util: validation function tests.
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
import { isUniqueContainerName } from './validation';

describe( 'tag manager / utils / validation', () => {
	describe( 'isUniqueContainerName', () => {
		it( 'should return TRUE when "containers" arg is not an array yet', () => {
			expect( isUniqueContainerName( 'test container', undefined ) ).toBe(
				true
			);
		} );

		it( 'should return TRUE when a container name is unique', () => {
			expect(
				isUniqueContainerName( 'test container', [
					{ name: 'amp container' },
				] )
			).toBe( true );
		} );

		it( 'should return FALSE if a container name is not unique', () => {
			expect(
				isUniqueContainerName( 'test container', [
					{ name: 'test container' },
				] )
			).toBe( false );
		} );
	} );
} );
