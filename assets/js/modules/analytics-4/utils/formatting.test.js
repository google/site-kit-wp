/**
 * Formatting tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

import { decodeAmpersand, splitCategories } from './formatting';

describe( 'formatting', () => {
	describe( 'decodeAmpersand', () => {
		it( 'correctly decodes ampersand entities', () => {
			const stringToDecode = 'Health &amp; wellness';
			const expectedString = 'Health & wellness';
			const decodedString = decodeAmpersand( stringToDecode );

			expect( decodedString ).toStrictEqual( expectedString );
		} );

		it( 'retains ampersand characters', () => {
			const stringToDecode = 'Health & wellness';
			const decodedString = decodeAmpersand( stringToDecode );

			expect( decodedString ).toStrictEqual( stringToDecode );
		} );
	} );
	describe( 'splitCategories', () => {
		it( 'correctly splits by ;', () => {
			const categoriesString = 'One; Two; Three';
			const expectedArray = [ 'One', 'Two', 'Three' ];
			const categoriesArray = splitCategories( categoriesString );

			expect( categoriesArray ).toStrictEqual( expectedArray );
		} );

		it( 'correctly converts ampersand entities on split', () => {
			const categoriesString = 'One &amp; Two; Three; Four';
			const expectedArray = [ 'One & Two', 'Three', 'Four' ];
			const categoriesArray = splitCategories( categoriesString );

			expect( categoriesArray ).toStrictEqual( expectedArray );
		} );

		it( 'correctly retains ampersand characters on split', () => {
			const categoriesString = 'One & Two; Three; Four';
			const expectedArray = [ 'One & Two', 'Three', 'Four' ];
			const categoriesArray = splitCategories( categoriesString );

			expect( categoriesArray ).toStrictEqual( expectedArray );
		} );
	} );
} );
