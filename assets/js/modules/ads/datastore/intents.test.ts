/**
 * `modules/ads` data store: intents tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	ADS_CONVERSION_TRACKING_INTENT_SLUG,
	MODULE_SLUG_ADS,
} from '@/js/modules/ads/constants';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import { MODULES_ADS } from './constants';

describe( 'modules/ads intents', () => {
	const activationEndpoint = new RegExp(
		'^/google-site-kit/v1/core/modules/data/activation'
	);
	const authenticationEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/authentication'
	);
	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/ads/data/settings'
	);
	const completeIntentEndpoint = new RegExp(
		'^/google-site-kit/v1/core/intents/data/complete-intent'
	);

	const intentCode = 'abc123';
	const tagID = 'AW-763597978';
	const returnURL =
		'https://ads.google.com/aw/conversions/sitekit?intent_code=abc123';

	const settings = {
		conversionID: '',
		ownerID: 0,
		paxConversionID: '',
		customerID: '',
		extCustomerID: '',
		formattedExtCustomerID: '',
		userID: '',
		accountOverviewURL: '',
	};

	const error = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ADS, active: false, connected: false },
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( MODULES_ADS ).receiveGetSettings( settings );
	} );

	function provideActiveAdsModule() {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ADS, active: true, connected: true },
		] );
	}

	describe( 'completeConversionTrackingIntent', () => {
		it( 'should activate the Ads module, save the tag as the conversion ID, complete the intent, and return the URL to return to Google Ads', async () => {
			fetchMock.postOnce( activationEndpoint, {
				body: { success: true },
			} );
			fetchMock.getOnce( authenticationEndpoint, {
				body: { needsReauthentication: false },
			} );
			fetchMock.postOnce( settingsEndpoint, {
				body: { ...settings, conversionID: tagID },
			} );
			fetchMock.postOnce( completeIntentEndpoint, {
				body: { return_url: returnURL },
			} );

			const result = await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( fetchMock ).toHaveFetched( activationEndpoint, {
				body: { data: { slug: MODULE_SLUG_ADS, active: true } },
			} );
			expect( fetchMock ).toHaveFetched( settingsEndpoint, {
				body: { data: { ...settings, conversionID: tagID } },
			} );
			expect( fetchMock ).toHaveFetched( completeIntentEndpoint, {
				body: {
					data: {
						slug: ADS_CONVERSION_TRACKING_INTENT_SLUG,
						intent_code: intentCode,
					},
				},
			} );
			expect( result ).toEqual( { returnURL } );
		} );

		it( 'should not activate the Ads module when it is already active', async () => {
			provideActiveAdsModule();

			fetchMock.postOnce( settingsEndpoint, {
				body: { ...settings, conversionID: tagID },
			} );
			fetchMock.postOnce( completeIntentEndpoint, {
				body: { return_url: returnURL },
			} );

			const result = await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( fetchMock ).not.toHaveFetched( activationEndpoint );
			expect( result ).toEqual( { returnURL } );
		} );

		it( 'should not save the tag again when it is called again after completing the intent failed', async () => {
			provideActiveAdsModule();

			fetchMock.postOnce( settingsEndpoint, {
				body: { ...settings, conversionID: tagID },
			} );
			fetchMock.postOnce( completeIntentEndpoint, {
				body: error,
				status: 500,
			} );
			fetchMock.postOnce( completeIntentEndpoint, {
				body: { return_url: returnURL },
			} );

			await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( console ).toHaveErrored();

			const result = await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( fetchMock ).toHaveFetchedTimes( 1, settingsEndpoint );
			expect( fetchMock ).toHaveFetchedTimes( 2, completeIntentEndpoint );
			expect( result ).toEqual( { returnURL } );
		} );

		it( 'should return the error, and neither save the tag nor complete the intent, when activating the Ads module fails', async () => {
			fetchMock.postOnce( activationEndpoint, {
				body: error,
				status: 500,
			} );

			const result = await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( console ).toHaveErrored();
			expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
			expect( fetchMock ).not.toHaveFetched( completeIntentEndpoint );
			expect( result ).toEqual( { error } );
		} );

		it( 'should return the error, and not complete the intent, when saving the tag fails', async () => {
			provideActiveAdsModule();

			fetchMock.postOnce( settingsEndpoint, {
				body: error,
				status: 500,
			} );

			const result = await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( console ).toHaveErrored();
			expect( fetchMock ).not.toHaveFetched( completeIntentEndpoint );
			expect( result ).toEqual( { error } );
		} );

		it( 'should return the error when completing the intent fails', async () => {
			provideActiveAdsModule();

			fetchMock.postOnce( settingsEndpoint, {
				body: { ...settings, conversionID: tagID },
			} );
			fetchMock.postOnce( completeIntentEndpoint, {
				body: error,
				status: 500,
			} );

			const result = await registry
				.dispatch( MODULES_ADS )
				.completeConversionTrackingIntent( intentCode, tagID );

			expect( console ).toHaveErrored();
			expect( result ).toEqual( { error } );
		} );

		it( 'should throw an error when the intent code is missing', () => {
			expect( () =>
				registry
					.dispatch( MODULES_ADS )
					.completeConversionTrackingIntent( undefined, tagID )
			).toThrow( 'intentCode is required.' );
		} );

		it.each( [
			[ 'missing', undefined ],
			[ 'not a conversion ID', 'GT-763597978' ],
		] )(
			'should throw an error when the tag ID is %s',
			( _, invalidTagID ) => {
				expect( () =>
					registry
						.dispatch( MODULES_ADS )
						.completeConversionTrackingIntent(
							intentCode,
							invalidTagID
						)
				).toThrow( 'a valid tagID is required.' );
			}
		);
	} );
} );
