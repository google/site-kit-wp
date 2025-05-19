/**
 * `modules/ads` data store: service tests.
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
 *
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../../tests/js/utils';
import { MODULES_ADS } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';

describe( 'modules/ads service store', () => {
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
			registry.dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'ads',
					name: 'Ads',
					homepage: 'https://example.com',
				},
			] );
		} );

		describe( 'getDetailsLinkURL', () => {
			it( 'should return the default ads homepage as details link URL if PAX setup is incomplete or ads is manually set up', async () => {
				await registry.dispatch( MODULES_ADS ).receiveGetSettings( {
					conversionID: '12345',
				} );

				const detailsLinkURL = registry
					.select( MODULES_ADS )
					.getDetailsLinkURL();

				const module = registry
					.select( CORE_MODULES )
					.getModule( 'ads' );

				const expectedURL = registry
					.select( CORE_USER )
					.getAccountChooserURL( module.homepage );

				expect( detailsLinkURL ).toEqual( expectedURL );
			} );

			it( 'should return a ads campaign overview deeplink URL as a details link if PAX setup is incomplete or ads is manually set up', async () => {
				const mockAccountOverviewURL =
					'https://example.com/account/overview/url';

				await registry.dispatch( MODULES_ADS ).receiveGetSettings( {
					conversionID: '12345',
					accountOverviewURL: mockAccountOverviewURL,
				} );

				const detailsLinkURL = registry
					.select( MODULES_ADS )
					.getDetailsLinkURL();

				const expectedURL = registry
					.select( CORE_USER )
					.getAccountChooserURL( mockAccountOverviewURL );

				expect( detailsLinkURL ).toEqual( expectedURL );
			} );
		} );
	} );
} );
