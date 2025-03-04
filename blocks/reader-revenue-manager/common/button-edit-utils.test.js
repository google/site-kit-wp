/**
 * Button edit utils test.
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
import { getNoticeAndDisabled } from './button-edit-utils';

describe( 'getNoticeAndDisabled', () => {
	const defaultOptions = {
		paymentOption: 'subscriptions',
		requiredPaymentOption: 'subscriptions',
		hasModuleAccess: true,
		postProductID: 'test-product',
		snippetMode: 'sitewide',
		postTypes: [ 'post' ],
		postType: 'post',
		invalidPaymentOptionWithModuleAccessNotice:
			'Invalid payment option (with access)',
		invalidPaymentOptionWithoutModuleAccessNotice:
			'Invalid payment option (without access)',
		noSnippetWithModuleAccessNotice: 'No snippet (with access)',
		noSnippetWithoutModuleAccessNotice: 'No snippet (without access)',
	};

	it( 'should return not disabled and no notice when all conditions are met', () => {
		const result = getNoticeAndDisabled( defaultOptions );

		expect( result ).toEqual( {
			disabled: false,
			notice: null,
		} );
	} );

	it( 'should return disabled and the correct notice when the payment option does not match the required option with module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			paymentOption: 'contributions',
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'Invalid payment option (with access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the payment option does not match the required option without module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			paymentOption: 'contributions',
			hasModuleAccess: false,
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'Invalid payment option (without access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the post product ID is "none" with module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			postProductID: 'none',
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'No snippet (with access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the post product ID is "none" without module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			postProductID: 'none',
			hasModuleAccess: false,
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'No snippet (without access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the post product ID is empty and the snippet mode is per_post with module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			postProductID: '',
			snippetMode: 'per_post',
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'No snippet (with access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the post product ID is empty and the snippet mode is per_post without module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			postProductID: '',
			snippetMode: 'per_post',
			hasModuleAccess: false,
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'No snippet (without access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the post type is not included in the post types with module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			postProductID: '',
			snippetMode: 'post_types',
			postTypes: [ 'page' ],
			postType: 'post',
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'No snippet (with access)',
		} );
	} );

	it( 'should return disabled and the correct notice when the post type is not included in the post types without module access', () => {
		const result = getNoticeAndDisabled( {
			...defaultOptions,
			postProductID: '',
			snippetMode: 'post_types',
			postTypes: [ 'page' ],
			postType: 'post',
			hasModuleAccess: false,
		} );

		expect( result ).toEqual( {
			disabled: true,
			notice: 'No snippet (without access)',
		} );
	} );
} );
