/**
 * `modules/adsense` data store: sites tests.
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
import API from 'googlesitekit-api';
import { MODULES_ADSENSE } from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

const sitesByDomain = fixtures.sites.reduce(
	( acc, site ) => ( { ...acc, [ site.domain ]: site } ),
	{}
);

describe( 'modules/adsense sites', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {} );

	describe( 'selectors', () => {
		describe( 'getSites', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/sites'
					),
					{ body: fixtures.sites }
				);

				const accountID = fixtures.clients[ 0 ]._accountID;

				const initialSites = registry
					.select( MODULES_ADSENSE )
					.getSites( accountID );

				expect( initialSites ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.getSites( accountID ) !== undefined
				);

				const sites = registry
					.select( MODULES_ADSENSE )
					.getSites( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( sites ).toEqual( fixtures.sites );
			} );

			it( 'does not make a network request if sites for this account are already present', async () => {
				const accountID = fixtures.clients[ 0 ]._accountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSites( fixtures.sites, { accountID } );

				const sites = registry
					.select( MODULES_ADSENSE )
					.getSites( accountID );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getSites', [ accountID ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( sites ).toEqual( fixtures.sites );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/sites'
					),
					{ body: response, status: 500 }
				);

				const fakeAccountID = 'pub-777888999';
				registry.select( MODULES_ADSENSE ).getSites( fakeAccountID );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.isFetchingGetSites( fakeAccountID ) === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const sites = registry
					.select( MODULES_ADSENSE )
					.getSites( fakeAccountID );
				expect( sites ).toEqual( undefined );

				await untilResolved( registry, MODULES_ADSENSE ).getSites(
					fakeAccountID
				);
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getSite', () => {
			beforeEach( () => {
				const accountID = fixtures.clients[ 0 ]._accountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSites( fixtures.sites, { accountID } );
			} );

			it.each( [
				[ 'www.example.com', sitesByDomain[ 'example.com' ] ],
				[
					'othersubdomain.example.com',
					sitesByDomain[ 'example.com' ],
				],
				[ 'www.test-site.com', sitesByDomain[ 'test-site.com' ] ],
				[ 'some-other-tld.ie', sitesByDomain[ 'some-other-tld.ie' ] ],
			] )(
				'finds the site in this account that matches the domain: %s',
				( domain, expected ) => {
					const accountID = fixtures.clients[ 0 ]._accountID;
					const site = registry
						.select( MODULES_ADSENSE )
						.getSite( accountID, domain );
					expect( site ).toEqual( expected );
				}
			);

			it.each( [
				[ 'non-existent-site.com' ],
				[ 'some-other-tld.com' ],
			] )(
				'returns null when no site matches the given domain: %s',
				( domain ) => {
					const accountID = fixtures.clients[ 0 ]._accountID;
					const site = registry
						.select( MODULES_ADSENSE )
						.getSite( accountID, domain );
					expect( site ).toEqual( null );
				}
			);

			it( 'returns null when no site matches the given domain', () => {
				const accountID = fixtures.clients[ 0 ]._accountID;

				const site = registry
					.select( MODULES_ADSENSE )
					.getSite( accountID, 'www.non-existent-url.com' );
				expect( site ).toEqual( null );
			} );
		} );

		describe( 'getCurrentSite', () => {
			const accountID = 'pub-1234567890';

			beforeEach( () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSites( fixtures.sites, { accountID } );
			} );

			it( 'gets the AdSense site which matches the domain of the current site', async () => {
				await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					referenceSiteURL: 'http://example.com',
				} );
				const site = registry
					.select( MODULES_ADSENSE )
					.getCurrentSite( accountID );
				expect( site ).toEqual( sitesByDomain[ 'example.com' ] );
			} );

			it( 'returns null when the current site domain does not matches any site', async () => {
				await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					referenceSiteURL: 'http://non-existent-site.com',
				} );
				const site = registry
					.select( MODULES_ADSENSE )
					.getCurrentSite( accountID );
				expect( site ).toEqual( null );
			} );
		} );
	} );
} );
