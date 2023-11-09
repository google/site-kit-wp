/**
 * Geometry related utility functions tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { elementsOverlap } from './geometry';

describe( 'elementsOverlap', () => {
	document.body.innerHTML = `
<div id="element1"></div>
<div id="element2"></div>
`;
	it( 'should return true when elements overlap', () => {
		// JSDOM doesn't do any rendering, so getBoundingClientRect() always returns 0, 0, 0, 0.
		// We need to mock it to provide non-zero values.
		const element1 = document.querySelector( '#element1' );
		element1.getBoundingClientRect = () => ( {
			top: 50,
			right: 100,
			bottom: 100,
			left: 50,
		} );

		const element2 = document.querySelector( '#element2' );
		element2.getBoundingClientRect = () => ( {
			top: 60,
			right: 110,
			bottom: 110,
			left: 60,
		} );
		expect( elementsOverlap( element1, element2 ) ).toBe( true );
	} );

	it( 'should return false when elements do not overlap', () => {
		// JSDOM doesn't do any rendering, so getBoundingClientRect() always returns 0, 0, 0, 0.
		// We need to mock it to provide non-zero values.
		const element1 = document.querySelector( '#element1' );
		element1.getBoundingClientRect = () => ( {
			top: 0,
			right: 50,
			bottom: 50,
			left: 0,
		} );

		const element2 = document.querySelector( '#element2' );
		element2.getBoundingClientRect = () => ( {
			top: 51,
			right: 100,
			bottom: 100,
			left: 51,
		} );
		expect( elementsOverlap( element1, element2 ) ).toBe( false );
	} );
} );
