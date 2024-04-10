/**
 * Analytics useMigrateAdsConversionID hook tests.
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

import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_ADS } from '../../ads/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import useMigrateAdsConversionID from './useMigrateAdsConversionID';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../tests/js/utils';
import { renderHook } from '../../../../../tests/js/test-utils';

describe( 'useMigrateAdsConversionID', () => {
	let registry;

	const adsConversionID = 'AW-1234';

	const endpoints = {
		adsSettings: '/google-site-kit/v1/modules/ads/data/settings',
		analyticsSettings:
			'/google-site-kit/v1/modules/analytics-4/data/settings',
		activateModule: '/google-site-kit/v1/core/modules/data/activation',
		authentication: '/google-site-kit/v1/core/user/data/authentication',
		getModules: '/google-site-kit/v1/core/modules/data/list',
	};

	beforeEach( () => {
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { adsConversionID } );
		registry.dispatch( MODULES_ADS ).receiveGetSettings( {} );
	} );

	it( 'should not perform the migration if the Ads module is not available', () => {
		// Only make the Analytics module available.
		registry.dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		renderHook( () => useMigrateAdsConversionID(), {
			registry,
			features: [ 'adsModule' ],
		} );

		expect(
			registry.select( MODULES_ADS ).getConversionID()
		).toBeUndefined();

		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should not perform the migration if the Ads module is already connected', () => {
		// The provideModules utility sets the Ads module as connected by default.
		provideModules( registry );

		// Set the ads conversion ID in the Ads module to something (AW-5678)
		// that is different than what is set in the Analytics module (AW-1234).
		registry
			.dispatch( MODULES_ADS )
			.receiveGetSettings( { conversionID: 'AW-5678' } );

		renderHook( () => useMigrateAdsConversionID(), {
			registry,
			features: [ 'adsModule' ],
		} );

		// Verify that the value has not changed.
		expect( registry.select( MODULES_ADS ).getConversionID() ).toBe(
			'AW-5678'
		);

		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should not perform the migration if the ads conversion ID is already set', () => {
		// Set the ads conversion ID in the Ads module.
		registry
			.dispatch( MODULES_ADS )
			.receiveGetSettings( { conversionID: adsConversionID } );

		provideModules( registry );

		renderHook( () => useMigrateAdsConversionID(), {
			registry,
			features: [ 'adsModule' ],
		} );

		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should not perform the migration if the ads conversion ID is not available in the Analytics module', () => {
		// Remove the ads conversion ID from the Analytics module.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		renderHook( () => useMigrateAdsConversionID(), {
			registry,
			features: [ 'adsModule' ],
		} );

		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should migrate the Ads conversion ID from the Analytics module to the Ads module', async () => {
		// Set the Ads module as disconnected.
		provideModules( registry, [
			{
				slug: 'ads',
				active: true,
				connected: false,
			},
		] );

		const { waitForNextUpdate } = renderHook(
			() => useMigrateAdsConversionID(),
			{
				registry,
				features: [ 'adsModule' ],
			}
		);

		fetchMock.postOnce( new RegExp( endpoints.adsSettings ), {
			body: { conversionID: adsConversionID },
			status: 200,
		} );
		fetchMock.postOnce( new RegExp( endpoints.analyticsSettings ), {
			body: { adsConversionID: '' },
			status: 200,
		} );

		await waitForNextUpdate();

		expect( registry.select( MODULES_ADS ).getConversionID() ).toBe(
			adsConversionID
		);
	} );

	it( 'should activate the ads module during the migration if it is not active', async () => {
		// Set the Ads module as inactive & disconnected.
		provideModules( registry, [
			{
				slug: 'ads',
				active: false,
				connected: false,
			},
		] );

		const { waitForNextUpdate } = renderHook(
			() => useMigrateAdsConversionID(),
			{
				registry,
				features: [ 'adsModule' ],
			}
		);

		fetchMock.postOnce( new RegExp( endpoints.adsSettings ), {
			body: { conversionID: adsConversionID },
			status: 200,
		} );
		fetchMock.postOnce( new RegExp( endpoints.analyticsSettings ), {
			body: { adsConversionID: '' },
			status: 200,
		} );
		fetchMock.postOnce( new RegExp( endpoints.activateModule ), {
			body: { success: true },
			status: 200,
		} );
		fetchMock.getOnce( new RegExp( endpoints.authentication ), {
			body: {},
		} );
		fetchMock.getOnce( new RegExp( endpoints.getModules ), {
			body: [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
				{
					slug: 'ads',
					active: true,
					connected: true,
				},
			],
		} );

		await waitForNextUpdate();

		expect( registry.select( MODULES_ADS ).getConversionID() ).toBe(
			adsConversionID
		);

		expect( registry.select( CORE_MODULES ).isModuleActive( 'ads' ) ).toBe(
			true
		);
	} );

	it( 'should return true if the migration is in progress', async () => {
		// Set the Ads module as disconnected.
		provideModules( registry, [
			{
				slug: 'ads',
				active: true,
				connected: false,
			},
		] );

		const { result, waitForNextUpdate } = renderHook(
			() => useMigrateAdsConversionID(),
			{
				registry,
				features: [ 'adsModule' ],
			}
		);

		// Verify that the hook returns true if the migration is in progress.
		expect( result.current ).toBe( true );

		fetchMock.postOnce( new RegExp( endpoints.adsSettings ), {
			body: { conversionID: adsConversionID },
			status: 200,
		} );
		fetchMock.postOnce( new RegExp( endpoints.analyticsSettings ), {
			body: { adsConversionID: '' },
			status: 200,
		} );

		await waitForNextUpdate();

		// Verify that the hook returns false if the migration not in progress.
		expect( result.current ).toBe( false );

		expect( registry.select( MODULES_ADS ).getConversionID() ).toBe(
			adsConversionID
		);
	} );
} );
