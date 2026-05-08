/**
 * Tests for setting utilities.
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

/**
 * Internal dependencies
 */
import {
	getPostTypesString,
	getProductIDLabel,
	getProductIDs,
	getPaymentOption,
} from './settings';

describe( 'getPostTypesString', () => {
	it( 'returns post type labels for postTypes setting slugs', () => {
		const postTypes = [ 'post', 'page' ];

		const allPostTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
			{
				slug: 'attachment',
				label: 'Media',
			},
		];

		expect( getPostTypesString( postTypes, allPostTypes ) ).toBe(
			'Posts, Pages'
		);
	} );

	it( 'returns "All post types" if postTypes cover all post types', () => {
		const postTypes = [ 'post', 'page', 'attachment' ];

		const allPostTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
			{
				slug: 'attachment',
				label: 'Media',
			},
		];

		expect( getPostTypesString( postTypes, allPostTypes ) ).toBe(
			'All post types'
		);
	} );

	it.each( [ null, undefined, [] ] )(
		'should return postTypes slugs when allPostTypes is %s',
		( allPostTypes ) => {
			expect(
				getPostTypesString( [ 'post', 'page' ], allPostTypes )
			).toBe( 'post, page' );
		}
	);

	it( 'returns an empty string if postTypes is empty', () => {
		const allPostTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
		];

		expect( getPostTypesString( [], allPostTypes ) ).toBe( '' );
	} );

	it( 'returns an empty string if postTypes is falsey', () => {
		const allPostTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
		];

		expect( getPostTypesString( false, allPostTypes ) ).toBe( '' );
	} );
} );

describe( 'getProductIDs', () => {
	it( 'should return product ID names from products array', () => {
		const products = [
			{ name: 'ABC:product-1' },
			{ name: 'DEF:product-2' },
		];

		expect( getProductIDs( products ) ).toEqual( [
			'ABC:product-1',
			'DEF:product-2',
		] );
	} );

	it( 'should return an empty array when products is undefined', () => {
		expect( getProductIDs( undefined ) ).toEqual( [] );
	} );

	it( 'should return an empty array when products is null', () => {
		expect( getProductIDs( null ) ).toEqual( [] );
	} );

	it( 'should return an empty array when products is empty', () => {
		expect( getProductIDs( [] ) ).toEqual( [] );
	} );

	it( 'should skip products with missing name property', () => {
		const products = [
			{ name: 'ABC:product-1' },
			{},
			{ name: 'DEF:product-2' },
		];

		expect( getProductIDs( products ) ).toEqual( [
			'ABC:product-1',
			'DEF:product-2',
		] );
	} );
} );

describe( 'getPaymentOption', () => {
	it( 'should return the first truthy payment option', () => {
		const paymentOptions = {
			contributions: null,
			subscriptions: true,
			noPayment: null,
			thankStickers: null,
		};

		expect( getPaymentOption( paymentOptions ) ).toBe( 'subscriptions' );
	} );

	it( 'should return the first truthy option when multiple are true', () => {
		const paymentOptions = {
			subscriptions: null,
			contributions: true,
			noPayment: true,
			thankStickers: null,
		};

		expect( getPaymentOption( paymentOptions ) ).toBe( 'contributions' );
	} );

	it( 'should return an empty string when all options are null', () => {
		const paymentOptions = {
			subscriptions: null,
			contributions: null,
			noPayment: null,
			thankStickers: null,
		};

		expect( getPaymentOption( paymentOptions ) ).toBe( '' );
	} );

	it( 'should return an empty string when paymentOptions is undefined', () => {
		expect( getPaymentOption( undefined ) ).toBe( '' );
	} );

	it( 'should return an empty string when paymentOptions is null', () => {
		expect( getPaymentOption( null ) ).toBe( '' );
	} );

	it( 'should return an empty string when paymentOptions is empty', () => {
		expect( getPaymentOption( {} ) ).toBe( '' );
	} );
} );

describe( 'getProductIDLabel', () => {
	it( 'returns the product ID label', () => {
		expect( getProductIDLabel( 'publicationID:productID' ) ).toBe(
			'productID'
		);
	} );

	it( 'returns the full product ID if no separator is found', () => {
		expect( getProductIDLabel( 'productID' ) ).toBe( 'productID' );
	} );

	it( 'returns an empty string if productID is falsey', () => {
		expect( getProductIDLabel( undefined ) ).toBe( '' );
	} );
} );
