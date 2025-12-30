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
	it( 'should parse name and value from valid HTML', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Test Product</span>
				<span class="edd-cart-item-price">$123.45</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Test Product' );
		expect( result.value ).toBe( 123.45 );
	} );

	it( 'should return empty name and value 0 if elements are missing', () => {
		const html = '<li class="edd-cart-item"></li>';

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( '' );
		expect( result.value ).toBe( 0 );
	} );

	it( 'should return value 0 if price text is empty', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Test Product</span>
				<span class="edd-cart-item-price"></span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Test Product' );
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

		expect( result.name ).toBe( 'Test' );
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

		expect( result.name ).toBe( 'Product Title' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse price correctly when value is a plain integer without decimal or separator', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Basic Product</span>
				<span class="edd-cart-item-price">$19</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Basic Product' );
		expect( result.value ).toBe( 19 );
	} );

	it( 'should parse European-style price with dot as thousand separator and comma as decimal', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Product</span>
				<span class="edd-cart-item-price">€1.234,56</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Product' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse European-style price with dot as thousand separator and comma as decimal, with trailing Euro symbol', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Product</span>
				<span class="edd-cart-item-price">1.234,56€</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Product' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse European-style price with comma as thousand separator and period as decimal', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Product</span>
				<span class="edd-cart-item-price">€1,234.56</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Product' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse European-style price with comma as thousand separator and period as decimal, with trailing Euro symbol', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Product</span>
				<span class="edd-cart-item-price">1,234.56€</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Product' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse large price with thousands and decimals in US format', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Enterprise Plan</span>
				<span class="edd-cart-item-price">$100,000.99</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Enterprise Plan' );
		expect( result.value ).toBe( 100000.99 );
	} );

	it( 'should parse large price in European format with no decimals', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Big Price</span>
				<span class="edd-cart-item-price">€100.000</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Big Price' );
		expect( result.value ).toBe( 100000 );
	} );

	it( 'should parse large price in European format with no decimals, with trailing Euro symbol', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Big Price</span>
				<span class="edd-cart-item-price">100.000€</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Big Price' );
		expect( result.value ).toBe( 100000 );
	} );

	it( 'should parse large price in European format with commas', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Big Price</span>
				<span class="edd-cart-item-price">€100,000</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Big Price' );
		expect( result.value ).toBe( 100000 );
	} );

	it( 'should parse large price in European format with commas, with trailing Euro symbol', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Big Price</span>
				<span class="edd-cart-item-price">100,000€</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Big Price' );
		expect( result.value ).toBe( 100000 );
	} );

	it( 'should parse large price in European format with spaces', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Big Price</span>
				<span class="edd-cart-item-price">€100 000</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Big Price' );
		expect( result.value ).toBe( 100000 );
	} );

	it( 'should parse large price in European format with spaces, with trailing Euro symbol', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Big Price</span>
				<span class="edd-cart-item-price">100 000€</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Big Price' );
		expect( result.value ).toBe( 100000 );
	} );

	it( 'should handle prices with trailing whitespace and symbol', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Whitespaced</span>
				<span class="edd-cart-item-price">   $42.00 </span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Whitespaced' );
		expect( result.value ).toBe( 42.0 );
	} );

	it( 'should parse Yen symbol and convert correctly', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Yen Product</span>
				<span class="edd-cart-item-price">¥12,345</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Yen Product' );
		expect( result.value ).toBe( 12345 );
	} );

	it( 'should parse European-style price with space as thousands separator and comma as decimal', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Euro Product</span>
				<span class="edd-cart-item-price">€1 234,56</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Euro Product' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse Swiss-style price with apostrophe as thousands separator', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Swiss Product</span>
				<span class="edd-cart-item-price">CHF 1'234.56</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Swiss Product' );
		expect( result.value ).toBe( 1234.56 );
	} );

	it( 'should parse Indian-style price format', () => {
		const html = `
			<li class="edd-cart-item">
				<span class="edd-cart-item-title">Indian Product</span>
				<span class="edd-cart-item-price">₹1,23,456.78</span>
			</li>
		`;

		const result = parseCartItemHTML( html );

		expect( result.name ).toBe( 'Indian Product' );
		expect( result.value ).toBe( 123456.78 );
	} );
} );
