/**
 * Tests for getInsufficientPermissionsErrorDescription.
 *
 * Site Kit by Google, Copyright 2021 Google LL
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

import { getInsufficientPermissionsErrorDescription as createErrorMessage } from './insufficient-permissions-error-description';

describe( 'getInsufficientPermissionsErrorDescription', () => {
	describe( 'default parameters', () => {
		it( 'should return the default values', () => {
			expect( createErrorMessage() ).toBe( '' );
		} );
	} );

	describe( 'invalid module property', () => {
		const cases = [
			[ 'Module with no properties', {} ],
			[
				'Module only with name',
				{
					name: 'Adsense',
				},
			],
			[
				'Module only with slug',
				{
					slug: 'analytics',
				},
			],
			[
				'Module with name and slug as empty strings',
				{
					name: '',
					slug: '',
				},
			],
			[
				'Module with name and slug as falsy values',
				{
					name: 0,
					slug: false,
				},
			],
		];

		it.each( cases )( '%s', ( _, module ) => {
			expect( createErrorMessage( '', module ) ).toBe( '' );
		} );
	} );

	describe( 'not supported module', () => {
		const apollo = {
			slug: 'apollo-module',
			name: 'Apollo',
		};

		const cases = [
			[
				'without user',
				{ ...apollo },
				`Your Google account does not have sufficient permissions to access Apollo data, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information`,
			],
			[
				'with user',
				{ ...apollo, owner: { login: 'bar' } },
				`Your Google account does not have sufficient permissions to access Apollo data, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information`,
			],
		];

		it.each( cases )( `Search console: '%s'`, ( _, module, expected ) => {
			expect( createErrorMessage( '', module ) ).toBe( expected );
		} );
	} );

	describe( 'search console error', () => {
		const searchConsole = {
			slug: 'search-console',
			name: 'Search Console',
		};

		const cases = [
			[
				'without user',
				{ ...searchConsole },
				`Your Google account does not have sufficient permissions for this Search Console property, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information`,
			],
			[
				'with user',
				{ ...searchConsole, owner: { login: 'bar' } },
				`Your Google account does not have sufficient permissions for this Search Console property, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information`,
			],
		];

		it.each( cases )( `Search console: '%s'`, ( _, module, expected ) => {
			expect( createErrorMessage( '', module ) ).toBe( expected );
		} );
	} );

	describe( 'google analytics error', () => {
		const analytics = {
			slug: 'analytics',
			name: 'Analytics',
		};

		const cases = [
			[
				'Insufficient permissions for this account without user',
				{ ...analytics },
				`Your Google account does not have sufficient permissions for this Analytics account, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information`,
			],
			[
				'Insufficient permissions for this account with user',
				{ ...analytics, owner: { login: 'bar' } },
				`Your Google account does not have sufficient permissions for this Analytics account, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information`,
			],
			[
				'Insufficient permissions for this property without user',
				{ ...analytics },
				`Your Google account does not have sufficient permissions for this Analytics view, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information`,
			],
			[
				'Insufficient permissions for this property with user',
				{ ...analytics, owner: { login: 'bar' } },
				`Your Google account does not have sufficient permissions for this Analytics view, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information`,
			],
			[
				'Insufficient permissions for this view without user',
				{ ...analytics },
				`Your Google account does not have sufficient permissions for this Analytics view, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information`,
			],
			[
				'Insufficient permissions for this view with user',
				{ ...analytics, owner: { login: 'bar' } },
				`Your Google account does not have sufficient permissions for this Analytics view, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information`,
			],
			[
				'unknown error without user',
				{ ...analytics },
				`Your Google account does not have sufficient permissions to access Analytics data, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by an administrator — you can contact them for more information`,
			],
			[
				'unknown error with user',
				{ ...analytics, owner: { login: 'bar' } },
				`Your Google account does not have sufficient permissions to access Analytics data, so you won't be able to see stats from it on the Site Kit dashboard. This service was originally connected by the administrator "bar" — you can contact them for more information`,
			],
		];

		it.each( cases )( `'%s'`, ( error, module, expected ) => {
			expect( createErrorMessage( error, module ) ).toBe( expected );
		} );
	} );
} );
