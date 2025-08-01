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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	provideNotifications,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import { surveyTriggerEndpoint } from '../../../../../tests/js/mock-survey-endpoints';
import { INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { GTG_SETUP_CTA_BANNER_NOTIFICATION } from '../../../googlesitekit/notifications/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ADS } from './constants';
import { validateCanSubmitChanges } from './settings';

describe( 'modules/ads settings', () => {
	let registry;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'submitChanges', () => {
		const settingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/ads/data/settings'
		);
		const gtgSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/site/data/gtg-settings'
		);
		const dismissItemEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);

		const error = {
			code: 'internal_error',
			message: 'Something wrong happened.',
			data: { status: 500 },
		};

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
				body: JSON.parse( opts.body ).data,
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

		it( 'should send a POST request to the GTG settings endpoint when the toggle state is changed', async () => {
			provideUserAuthentication( registry );

			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			fetchMock.postOnce( surveyTriggerEndpoint, {
				status: 200,
				body: {},
			} );

			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					GTG_SETUP_CTA_BANNER_NOTIFICATION,
				] );

			provideNotifications( registry );

			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body )?.data,
				status: 200,
			} ) );

			fetchMock.postOnce( gtgSettingsEndpoint, ( url, opts ) => {
				const {
					data: {
						settings: { isEnabled },
					},
				} = JSON.parse( opts.body );

				return {
					body: {
						isEnabled, // Return the `isEnabled` value passed to the API.
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				};
			} );

			registry.dispatch( CORE_SITE ).setGoogleTagGatewayEnabled( true );
			await registry.dispatch( MODULES_ADS ).submitChanges();

			expect( fetchMock ).toHaveFetched( gtgSettingsEndpoint, {
				body: {
					data: {
						settings: { isEnabled: true },
					},
				},
			} );
		} );

		it( 'should handle an error when sending a POST request to the GTG settings endpoint', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body ).data,
				status: 200,
			} ) );

			fetchMock.postOnce( gtgSettingsEndpoint, {
				body: error,
				status: 500,
			} );

			registry.dispatch( CORE_SITE ).setGoogleTagGatewayEnabled( true );
			const { error: submitChangesError } = await registry
				.dispatch( MODULES_ADS )
				.submitChanges();

			expect( submitChangesError ).toEqual( error );

			expect( console ).toHaveErrored();
		} );

		it( 'should not send a POST request to the GTG settings endpoint when the toggle state is not changed', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body )?.data,
				status: 200,
			} ) );

			await registry.dispatch( MODULES_ADS ).submitChanges();

			expect( fetchMock ).not.toHaveFetched( gtgSettingsEndpoint );
		} );

		it( 'should dismiss the GTG setup CTA banner when the GTG `isEnabled` setting is changed to `true`', async () => {
			provideUserAuthentication( registry );

			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			fetchMock.postOnce( surveyTriggerEndpoint, {
				status: 200,
				body: {},
			} );

			provideNotifications( registry );

			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body ).data,
				status: 200,
			} ) );

			fetchMock.postOnce( gtgSettingsEndpoint, ( url, opts ) => {
				const {
					data: {
						settings: { isEnabled },
					},
				} = JSON.parse( opts.body );

				return {
					body: {
						isEnabled, // Return the `isEnabled` value passed to the API.
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				};
			} );

			fetchMock.postOnce( dismissItemEndpoint, {
				body: [ GTG_SETUP_CTA_BANNER_NOTIFICATION ],
				status: 200,
			} );

			registry.dispatch( CORE_SITE ).setGoogleTagGatewayEnabled( true );
			await registry.dispatch( MODULES_ADS ).submitChanges();

			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: GTG_SETUP_CTA_BANNER_NOTIFICATION,
						expiration: 0,
					},
				},
			} );
		} );

		it( 'should handle an error when dismissing the GTG setup CTA banner', async () => {
			provideUserAuthentication( registry );

			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			fetchMock.postOnce( surveyTriggerEndpoint, {
				status: 200,
				body: {},
			} );

			provideNotifications( registry );

			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body ).data,
				status: 200,
			} ) );

			fetchMock.postOnce( gtgSettingsEndpoint, ( url, opts ) => {
				const {
					data: {
						settings: { isEnabled },
					},
				} = JSON.parse( opts.body );

				return {
					body: {
						isEnabled, // Return the `isEnabled` value passed to the API.
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				};
			} );

			fetchMock.postOnce( dismissItemEndpoint, {
				body: error,
				status: 500,
			} );

			registry.dispatch( CORE_SITE ).setGoogleTagGatewayEnabled( true );
			const { error: submitChangesError } = await registry
				.dispatch( MODULES_ADS )
				.submitChanges();

			expect( submitChangesError ).toEqual( error );
			expect( console ).toHaveErrored();
		} );

		it( 'should not dismiss the GTG setup CTA banner when the GTG `isEnabled` setting is changed to `false`', async () => {
			provideNotifications( registry );

			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			fetchMock.postOnce( settingsEndpoint, ( url, opts ) => ( {
				body: JSON.parse( opts.body ).data,
				status: 200,
			} ) );

			fetchMock.postOnce( gtgSettingsEndpoint, ( url, opts ) => {
				const {
					data: {
						settings: { isEnabled },
					},
				} = JSON.parse( opts.body );

				return {
					body: {
						isEnabled, // Return the `isEnabled` value passed to the API.
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				};
			} );

			registry.dispatch( CORE_SITE ).setGoogleTagGatewayEnabled( false );
			await registry.dispatch( MODULES_ADS ).submitChanges();

			expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
			expect( fetchMock ).toHaveFetchedTimes( 2 );
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

	describe( 'rollbackChanges', () => {
		it( 'should rollback to the original settings', () => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '12345',
			} );

			registry.dispatch( MODULES_ADS ).setConversionID( '56789' );

			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			registry.dispatch( CORE_SITE ).setGoogleTagGatewayEnabled( true );

			registry.dispatch( MODULES_ADS ).rollbackChanges();

			expect( registry.select( MODULES_ADS ).getConversionID() ).toBe(
				'12345'
			);

			expect(
				registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
			).toBe( false );
		} );
	} );
} );
