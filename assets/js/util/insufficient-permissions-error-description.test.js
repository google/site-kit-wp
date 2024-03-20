/**
 * Tests for getInsufficientPermissionsErrorDescription.
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

import { getInsufficientPermissionsErrorDescription } from './insufficient-permissions-error-description';

describe( 'getInsufficientPermissionsErrorDescription', () => {
	it( 'should return the default values', () => {
		expect( getInsufficientPermissionsErrorDescription() ).toBe( '' );
	} );

	describe( 'invalid module property', () => {
		const cases = [
			[
				'should return an empty string when the module does not have properties',
				{},
			],
			[
				'when the module only have a `name` property',
				{
					name: 'Adsense',
				},
			],
			[
				'when the module only have a `slug` property',
				{
					slug: 'analytics-4',
				},
			],
			[
				'when the `module` and `slug` properties are empty`',
				{
					name: '',
					slug: '',
				},
			],
			[
				'when the `module` and `slug` property are falsy values',
				{
					name: 0,
					slug: false,
				},
			],
		];

		it.each( cases )( 'should return an empty string %s', ( _, module ) => {
			expect(
				getInsufficientPermissionsErrorDescription( '', module )
			).toBe( '' );
		} );
	} );

	describe( 'not supported module', () => {
		const apollo = {
			slug: 'apollo-module',
			name: 'Apollo',
		};

		const cases = [
			[
				'return a generic error message when the `slug` and `module` does ont exists`',
				{ ...apollo },
				'Your Google account does not have sufficient permissions to access Apollo data, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information.',
			],
			[
				'return an error with the `login` name when the property `owner` is provided',
				{ ...apollo, owner: { login: 'bar' } },
				'Your Google account does not have sufficient permissions to access Apollo data, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information.',
			],
		];

		it.each( cases )( 'should %s', ( _, module, expected ) => {
			expect(
				getInsufficientPermissionsErrorDescription( '', module )
			).toBe( expected );
		} );
	} );

	describe( 'search console error', () => {
		const searchConsole = {
			slug: 'search-console',
			name: 'Search Console',
		};

		const cases = [
			[
				'return an error for the `Search Console` module when the `owner` property is not provided',
				{ ...searchConsole },
				'Your Google account does not have sufficient permissions for this Search Console property, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information.',
			],
			[
				'return an error for the `Search Console` module when the `owner` property is not provided',
				{ ...searchConsole, owner: { login: 'bar' } },
				'Your Google account does not have sufficient permissions for this Search Console property, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information.',
			],
		];

		it.each( cases )( 'should %s', ( _, module, expected ) => {
			expect(
				getInsufficientPermissionsErrorDescription( '', module )
			).toBe( expected );
		} );
	} );

	describe( 'google analytics error', () => {
		const analytics = {
			slug: 'analytics-4',
			name: 'Analytics',
		};

		const cases = [
			[
				'insufficient permissions error for this account when the `owner` key is not provide',
				{ ...analytics },
				'Your Google account does not have sufficient permissions for this Analytics account, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information.',
			],
			[
				'insufficient permissions error for this account when the `owner` key is provided',
				{ ...analytics, owner: { login: 'bar' } },
				'Your Google account does not have sufficient permissions for this Analytics account, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information.',
			],
			[
				'insufficient permissions error for this property when the `owner` key is not provided',
				{ ...analytics },
				'Your Google account does not have sufficient permissions for this Analytics property, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information.',
			],
			[
				'insufficient permissions error for this property when the `owner` key is provided',
				{ ...analytics, owner: { login: 'bar' } },
				'Your Google account does not have sufficient permissions for this Analytics property, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information.',
			],
			[
				'insufficient permissions error for this view when the `owner` key is not provided',
				{ ...analytics },
				'Your Google account does not have sufficient permissions for this Analytics view, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information.',
			],
			[
				'insufficient permissions error for this view when the `owner` key is provided',
				{ ...analytics, owner: { login: 'bar' } },
				'Your Google account does not have sufficient permissions for this Analytics view, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information.',
			],
			[
				'unknown error when the `owner` key is not provided',
				{ ...analytics },
				'Your Google account does not have sufficient permissions to access Analytics data, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information.',
			],
			[
				'unknown error when the `owner` key is provided',
				{ ...analytics, owner: { login: 'bar' } },
				'Your Google account does not have sufficient permissions to access Analytics data, so you won’t be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information.',
			],
		];

		it.each( cases )(
			"should return %s is provided for the 'Analytics' module",
			( error, module, expected ) => {
				expect(
					getInsufficientPermissionsErrorDescription( error, module )
				).toBe( expected );
			}
		);
	} );
} );
