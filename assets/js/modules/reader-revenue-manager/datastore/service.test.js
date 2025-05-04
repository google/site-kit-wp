/**
 * `modules/reader-revenue-manager` data store: service tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { decodeServiceURL } from '../../../../../tests/js/mock-accountChooserURL-utils';

describe( 'modules/reader-revenue-manager service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};

	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			registry.dispatch( CORE_USER ).receiveUserInfo( userData );
		} );

		describe( 'getServiceURL', () => {
			it( 'should retrieve the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getServiceURL();

				expect( new URL( decodeServiceURL( serviceURL ) ).origin ).toBe(
					'https://publishercenter.google.com'
				);
			} );

			it( 'should append a utm_source of "sitekit" to the URL', () => {
				const serviceURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getServiceURL();

				const query = {
					utm_source: 'sitekit',
				};

				expect( decodeServiceURL( serviceURL ) ).toMatchQueryParameters(
					query
				);
			} );

			it( 'should add the path parameter', () => {
				const serviceURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getServiceURL( {
						path: 'reader-revenue-manager',
					} );

				expect(
					new URL( decodeServiceURL( serviceURL ) ).pathname
				).toMatch( '/reader-revenue-manager' );
			} );

			it( 'should append correct query parameters to the URL', () => {
				const query = {
					param1: '1',
					param2: '2',
					publicationID: 'ABCDEFG',
				};

				const serviceURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getServiceURL( {
						query,
					} );

				expect( decodeServiceURL( serviceURL ) ).toMatchQueryParameters(
					{
						...query,
						utm_source: 'sitekit',
					}
				);
			} );
		} );

		describe( 'getDetailsLinkURL', () => {
			it( 'should return the service URL that navigates to the Reader Revenue Manager screen of the publication', () => {
				const publicationID = 'ABCDEFG';

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID,
					} );

				const detailsLinkURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getDetailsLinkURL();

				const expectedURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getServiceURL( {
						path: 'reader-revenue-manager',
						query: {
							publication: publicationID,
						},
					} );

				expect( new URL( decodeServiceURL( detailsLinkURL ) ) ).toEqual(
					new URL( decodeServiceURL( expectedURL ) )
				);
			} );
		} );

		describe( 'getCreatePublicationLinkURL', () => {
			it( 'should return the service URL that navigates to the create publication screen with the correct query params', () => {
				const createPublicationLinkURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCreatePublicationLinkURL();

				const expectedURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getServiceURL( {
						query: {
							prefill_canonical_domain: 'https://example.com',
							prefill_lang: 'en-US',
							app_redirect: 'rrm',
						},
					} );

				expect(
					new URL( decodeServiceURL( createPublicationLinkURL ) )
				).toEqual( new URL( decodeServiceURL( expectedURL ) ) );
			} );
		} );
	} );
} );
