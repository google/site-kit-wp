/**
 * `modules/search-consoles` data store: settings tests.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { createTestRegistry, unsubscribeFromAll } from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';
import { validateCanSubmitChanges, INVARIANT_INVALID_PROPERTY_SELECTION } from './settings';
import { INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';

describe( 'modules/search-console settings', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'submitChanges', () => {
		const settingsEndpoint = /^\/google-site-kit\/v1\/modules\/search-console\/data\/settings/;

		beforeEach( () => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: 'http://example.com/',
			} );
		} );

		it( 'should not trigger saveSettings action if nothing is changed', async () => {
			await registry.dispatch( STORE_NAME ).submitChanges();
			expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
		} );

		it( 'should send a POST request when saving changed settings', async () => {
			fetchMock.postOnce(
				settingsEndpoint,
				( url, opts ) => ( { body: JSON.parse( opts.body )?.data, status: 200 } ),
			);

			registry.dispatch( STORE_NAME ).setPropertyID( 'https://example.com/' );
			await registry.dispatch( STORE_NAME ).submitChanges();

			expect( fetchMock ).toHaveFetched( settingsEndpoint, {
				body: {
					data: {
						propertyID: 'https://example.com/',
					},
				},
			} );
		} );
	} );

	describe( 'validateCanSubmitChanges', () => {
		it( 'should throw an error if propertyID is invalid', () => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: '',
			} );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow( INVARIANT_INVALID_PROPERTY_SELECTION );
		} );

		it( 'should not throw if propertyID is valid', () => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: 'http://example.com/',
			} );

			expect( () => validateCanSubmitChanges( registry.select ) ).not.toThrow( INVARIANT_INVALID_PROPERTY_SELECTION );
		} );

		it( 'should throw if there are no changes to the form', () => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: 'http://example.com/',
			} );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow( INVARIANT_SETTINGS_NOT_CHANGED );
		} );

		it( 'should not throw if there are changes to the form', () => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: 'http://example.com/',
			} );

			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: 'http://sitekit.google.com/',
			} );

			expect( () => validateCanSubmitChanges( registry.select ) ).not.toThrow( INVARIANT_SETTINGS_NOT_CHANGED );
		} );
	} );
} );
