/**
 * `modules/adsense` data store: service tests.
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

/**
 *
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../../tests/js/utils';
import { ACCOUNT_STATUS_APPROVED, SITE_STATUS_ADDED } from '../util/status';
import { MODULES_ADSENSE } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { decodeServiceURL } from '../../../../../tests/js/mock-accountChooserURL-utils';

describe( 'module/adsense service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};

	const settings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: true,
		accountStatus: ACCOUNT_STATUS_APPROVED,
		siteStatus: SITE_STATUS_ADDED,
	};
	const siteInfo = {
		referenceSiteURL: 'http://example.com/',
	};

	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			beforeEach( () => {
				registry.dispatch( CORE_USER ).receiveUserInfo( userData );
			} );

			it( 'retrieves the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_ADSENSE )
					.getServiceURL();

				expect( new URL( serviceURL ) ).toMatchObject( {
					origin: 'https://accounts.google.com',
					pathname: '/accountchooser',
				} );
				expect( serviceURL ).toMatchQueryParameters( {
					continue: 'https://www.google.com/adsense/new/u/0',
					Email: 'admin@example.com',
				} );
			} );

			it( 'prepends a forward slash to to the path if missing', () => {
				const serviceURLNoSlashes = registry
					.select( MODULES_ADSENSE )
					.getServiceURL( { path: 'test/path/to/deeplink' } );

				expect(
					new URL( decodeServiceURL( serviceURLNoSlashes ) ).pathname
				).toMatch( new RegExp( '/test/path/to/deeplink$' ) );

				const serviceURLWithLeadingSlash = registry
					.select( MODULES_ADSENSE )
					.getServiceURL( { path: '/test/path/to/deeplink' } );

				expect(
					new URL( decodeServiceURL( serviceURLWithLeadingSlash ) )
						.pathname
				).toMatch( new RegExp( '/test/path/to/deeplink$' ) );
			} );

			it( 'adds query args', () => {
				const path = '/test/path/to/deeplink';
				const query = {
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry
					.select( MODULES_ADSENSE )
					.getServiceURL( { path, query } );

				expect( decodeServiceURL( serviceURL ) ).toMatchQueryParameters(
					query
				);
			} );
		} );

		describe( 'getServiceReportURL', () => {
			beforeEach( () => {
				registry.dispatch( MODULES_ADSENSE ).setSettings( settings );
			} );

			it( 'should return undefined if accountID is undefined', () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.setSettings( { accountID: undefined } );

				const url = registry
					.select( MODULES_ADSENSE )
					.getServiceReportURL();
				expect( url ).toBeUndefined();
			} );

			it( 'should construct the correct `path` for the URL', () => {
				const correctPath = `${ settings.accountID }/reporting`;

				const resultingURL = registry
					.select( MODULES_ADSENSE )
					.getServiceReportURL();

				expect(
					new URL( decodeServiceURL( resultingURL ) ).pathname
				).toMatch( new RegExp( `${ correctPath }$` ) );
			} );

			it( 'should append `reportArgs` arguments to the `query` if received', () => {
				const reportArgs = { foo: 'bar' };
				const url = registry
					.select( MODULES_ADSENSE )
					.getServiceReportURL( reportArgs );

				expect( decodeServiceURL( url ) ).toMatchQueryParameters( {
					...reportArgs,
				} );
			} );

			it( 'should add a `dd` argument to the query if there is a registered reference site URL', () => {
				const reportArgs = { foo: 'bar' };

				registry.dispatch( CORE_SITE ).receiveSiteInfo( siteInfo );

				const url = registry
					.select( MODULES_ADSENSE )
					.getServiceReportURL( reportArgs );
				const domain = new URL( siteInfo.referenceSiteURL ).host;

				expect( decodeServiceURL( url ) ).toMatchQueryParameters( {
					...reportArgs,
					dd: `1YsiteY1Y${ domain }Y${ domain }`,
				} );
			} );

			it( 'should not add a `dd` query argument when there is no referenceSiteURL', () => {
				const reportArgs = { foo: 'bar' };

				registry
					.dispatch( CORE_SITE )
					.receiveSiteInfo( { referenceSiteURL: undefined } );

				const url = registry
					.select( MODULES_ADSENSE )
					.getServiceReportURL( reportArgs );

				expect( decodeServiceURL( url ) ).toMatchQueryParameters( {
					...reportArgs,
				} );
			} );
		} );
	} );
} );
