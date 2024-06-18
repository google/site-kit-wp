/**
 * `modules/ads` data store: settings tests.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { MODULES_ADS } from './constants';
import { validateCanSubmitChanges } from './settings';
import { INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';

describe( 'modules/ads settings', () => {
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
		const settingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/ads/data/settings'
		);

		beforeEach( () => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '12345',
			} );
		} );

		it( 'should not trigger saveSettings action if nothing is changed', async () => {
			await registry.dispatch( MODULES_ADS ).submitChanges();
			expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
		} );

		it( 'should send a POST request when saving changed settings', async () => {
			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body )?.data,
				status: 200,
			} ) );

			registry.dispatch( MODULES_ADS ).setConversionID( '56789' );
			await registry.dispatch( MODULES_ADS ).submitChanges();

			expect( fetchMock ).toHaveFetched( settingsEndpoint, {
				body: {
					data: {
						conversionID: '56789',
					},
				},
			} );
		} );
	} );

	describe( 'validateCanSubmitChanges', () => {
		it( 'should throw if there are no changes to the form', () => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '12345',
			} );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_SETTINGS_NOT_CHANGED
			);
		} );

		it( 'should not throw if there are changes to the form', () => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '12345',
			} );

			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '56789',
			} );

			expect( () =>
				validateCanSubmitChanges( registry.select )
			).not.toThrow( INVARIANT_SETTINGS_NOT_CHANGED );
		} );

		it( 'should throw if the given conversion ID is invalid', () => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '12345',
				paxConversionID: '',
			} );

			registry.dispatch( MODULES_ADS ).setConversionID( 'invalid' );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				'a valid conversionID is required to submit changes'
			);
		} );
	} );
} );
