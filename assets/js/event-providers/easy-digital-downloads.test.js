/**
 * Easy digital downloads tests.
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

import { parseCartItemHTML } from './easy-digital-downloads';

describe( 'parseCartItemHTML', () => {
	it( 'should parse title and value from valid HTML', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Test Product</span>
				<span class="edd-cart-item-price">$123.45</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.title ).toBe( 'Test Product' );
		expect( result.value ).toBe( 123.45 );
	} );

	it( 'should return empty title and value 0 if elements are missing', () => {
		const html = '<li class="edd-cart-item"></li>';

		const result = parseCartItemHTML( html );

		expect( result.title ).toBe( '' );
		expect( result.value ).toBe( 0 );
	} );

	it( 'should handle non-numeric price gracefully', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Test</span>
				<span class="edd-cart-item-price">Free</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.title ).toBe( 'Test' );
		expect( result.value ).toBe( 0 );
	} );

	it( 'should correctly parse comma and dot formatted prices', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Product Title</span>
				<span class="edd-cart-item-price">€1,234.56</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.title ).toBe( 'Product Title' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse price correctly when value is an integer without decimals', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Basic Product</span>
				<span class="edd-cart-item-price">$19</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.title ).toBe( 'Basic Product' );
		expect( result.value ).toBe( 19 );
	} );
} );
