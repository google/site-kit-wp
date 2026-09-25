/**
 * Feature count cache and menu badge hook tests.
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
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { getFeatureNewnessKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { setFeatureCountCache } from '@/js/util/features-badge';
import {
	act,
	cleanup,
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideUserCapabilities,
	provideUserInfo,
	renderHook,
} from '@tests/js/test-utils';
import useFeatureCountCache from './useFeatureCountCache';

jest.mock( '@/js/util/features-badge', () => ( {
	setFeatureCountCache: jest.fn(),
} ) );

describe( 'useFeatureCountCache', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideUserInfo( registry );
		provideUserCapabilities( registry );

		provideModules( registry, withConnected( 'search-console' ) );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.187.0' );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', {
				title: 'Test feature',
				shortDescription: 'A test feature.',
				effort: FEATURE_EFFORTS.LOW,
				goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
				addedInVersion: '1.187.0',
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => false,
				},
			} );
	} );

	afterEach( async () => {
		await cleanup();
		jest.clearAllMocks();
	} );

	it( 'should cache the available count and connected module slugs', () => {
		renderHook( useFeatureCountCache, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( setFeatureCountCache ).toHaveBeenLastCalledWith( {
			connectedModules: [ 'search-console' ],
			count: 1,
			pluginVersion: global.GOOGLESITEKIT_VERSION,
			userID: 1,
		} );
	} );

	it( 'should write zero when features become seen', async () => {
		renderHook( useFeatureCountCache, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		await act( async () => {
			await registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				[ getFeatureNewnessKey( 'test-feature' ) ]:
					Math.floor( Date.now() / 1000 ) + 1000,
			} );
		} );

		expect( setFeatureCountCache ).toHaveBeenLastCalledWith(
			expect.objectContaining( { count: 0 } )
		);
	} );

	it( 'should update the fingerprint when connections or the user change', async () => {
		renderHook( useFeatureCountCache, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		await act( async () => {
			await provideModules( registry, withConnected( 'adsense' ) );

			provideUserInfo( registry, { id: 2 } );
		} );

		expect( setFeatureCountCache ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				connectedModules: [ 'adsense' ],
				userID: 2,
			} )
		);
	} );

	it( 'should wait for module data to become available', async () => {
		registry = createTestRegistry() as Registry;

		provideUserInfo( registry );
		provideUserCapabilities( registry );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.187.0' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		freezeFetch( new RegExp( 'core/modules/data/list' ) );

		renderHook( useFeatureCountCache, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( setFeatureCountCache ).not.toHaveBeenCalled();

		await act( async () => {
			await provideModules( registry, withConnected( 'search-console' ) );
		} );

		expect( setFeatureCountCache ).toHaveBeenCalledTimes( 1 );
		expect( setFeatureCountCache ).toHaveBeenLastCalledWith( {
			connectedModules: [ 'search-console' ],
			count: 0,
			pluginVersion: global.GOOGLESITEKIT_VERSION,
			userID: 1,
		} );
	} );

	it( 'should wait for feature newness data to become available', async () => {
		registry = createTestRegistry() as Registry;

		provideUserInfo( registry );
		provideUserCapabilities( registry );

		provideModules( registry, withConnected() );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.187.0' );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		freezeFetch( /core\/user\/data\/expirable-items/ );

		renderHook( useFeatureCountCache, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( setFeatureCountCache ).not.toHaveBeenCalled();

		await act( async () => {
			await registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		} );

		expect( setFeatureCountCache ).toHaveBeenCalledTimes( 1 );
		expect( setFeatureCountCache ).toHaveBeenLastCalledWith( {
			connectedModules: [],
			count: 0,
			pluginVersion: global.GOOGLESITEKIT_VERSION,
			userID: 1,
		} );
	} );

	it( 'should do nothing with the feature flag disabled', () => {
		renderHook( useFeatureCountCache, { registry } );

		expect( setFeatureCountCache ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing for users who cannot manage options', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		renderHook( useFeatureCountCache, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( setFeatureCountCache ).not.toHaveBeenCalled();
	} );
} );
