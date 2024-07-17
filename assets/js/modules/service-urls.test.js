/**
 * Common Service URL tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { createTestRegistry, provideUserInfo } from '../../../tests/js/utils';

function mapURLs( cases, getServiceURL ) {
	return cases
		.map( ( ...args ) => getServiceURL( ...args ) )
		.map( ( url ) => {
			let u = new URL( url );
			// Check if it's a new service URL first.
			if ( u.pathname === '/accountchooser' ) {
				// If so, return the service URL from its `continue` param.
				u = new URL( u.searchParams.get( 'continue' ) );
			} else if ( u.searchParams.has( 'authuser' ) ) {
				u.searchParams.delete( 'authuser' );
			}
			return u.toString();
		} );
}

it( 'ensures all serviceURLs are properly constructed', () => {
	const registry = createTestRegistry();
	provideUserInfo( registry );

	// Each item in the array is the object of arguments to pass to getServiceURL.
	const cases = [
		{},
		{ path: 'foo-path' },
		{ path: 'foo-path', query: { bar: 'baz' } },
	];

	const serviceURLsByStore = {};
	for ( const storeName in registry.stores ) {
		if ( registry.stores[ storeName ]?.selectors?.getServiceURL ) {
			serviceURLsByStore[ storeName ] = mapURLs(
				cases,
				registry.stores[ storeName ].selectors.getServiceURL
			);
		}
	}

	// These URLs were generated using the 1.82.0 source, and stripped of the `authuser` param.
	// This assertion ensures these are constructed in the same way going forward.
	expect( serviceURLsByStore ).toEqual( {
		'modules/adsense': [
			'https://www.google.com/adsense/new/u/0',
			'https://www.google.com/adsense/new/u/0/foo-path',
			'https://www.google.com/adsense/new/u/0/foo-path?bar=baz',
		],
		'modules/analytics-4': [
			'https://analytics.google.com/analytics/web/',
			'https://analytics.google.com/analytics/web/#/foo-path',
			'https://analytics.google.com/analytics/web/?bar=baz#/foo-path',
		],
		'modules/pagespeed-insights': [
			'https://pagespeed.web.dev/',
			'https://pagespeed.web.dev/foo-path',
			'https://pagespeed.web.dev/foo-path?bar=baz',
		],
		'modules/reader-revenue-manager': [
			'https://publishercenter.google.com/?utm_source=sitekit',
			'https://publishercenter.google.com/foo-path?utm_source=sitekit',
			'https://publishercenter.google.com/foo-path?bar=baz&utm_source=sitekit',
		],
		'modules/search-console': [
			'https://search.google.com/search-console',
			'https://search.google.com/search-console/foo-path',
			'https://search.google.com/search-console/foo-path?bar=baz',
		],
		'modules/tagmanager': [
			'https://tagmanager.google.com/',
			'https://tagmanager.google.com/#/foo-path',
			'https://tagmanager.google.com/?bar=baz#/foo-path',
		],
	} );
} );
