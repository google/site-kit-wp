/**
 * Feature Discovery "not opened" survey trigger hook tests.
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
import {
	CORE_USER,
	SURVEY_TRIGGER_MAX_TTL,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import {
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
	triggeredIDs,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
	renderHook,
	waitFor,
	waitForTimeouts,
} from '@tests/js/test-utils';
import {
	FDH_NOT_OPENED_SURVEY_TRIGGER_ID,
	FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
} from './constants';
import useFeatureDiscoveryNotOpenedSurveyTrigger from './useFeatureDiscoveryNotOpenedSurveyTrigger';

// A real send takes ~150ms to reach the endpoint, so a negative test must wait
// longer than that or it would pass whatever the hook does.
const SEND_SETTLE_MS = 400;

describe( 'useFeatureDiscoveryNotOpenedSurveyTrigger', () => {
	let registry: Registry;

	function registerFeature( slug: string ) {
		registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature( slug, {
			title: slug,
			shortDescription: 'A test feature.',
			effort: FEATURE_EFFORTS.LOW,
			goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
			addedInVersion: '1.187.0',
			setup: {
				type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
				isEnabled: () => false,
			},
		} );
	}

	function render( { features = [ 'featureDiscoveryHub' ] } = {} ) {
		return renderHook( () => useFeatureDiscoveryNotOpenedSurveyTrigger(), {
			registry,
			features,
		} );
	}

	// Creates a registry with the state every test shares. Each test then adds
	// the remaining state it needs, or leaves it out to keep that value loading.
	function setupRegistry() {
		registry = createTestRegistry() as Registry;

		provideUserAuthentication( registry );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserCapabilities( registry );
		provideModules( registry, withConnected( 'search-console' ) );
	}

	beforeEach( () => {
		setupRegistry();

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.187.0' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		registerFeature( 'feature-one' );
		registerFeature( 'feature-two' );

		fetchMock.get( surveyTimeoutsEndpoint, { status: 200, body: [] } );
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
	} );

	it( 'should send the trigger with the maximum ttl when all conditions are met', async () => {
		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitFor( () =>
			expect( triggeredIDs() ).toEqual( [
				FDH_NOT_OPENED_SURVEY_TRIGGER_ID,
			] )
		);
		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: {
				data: {
					triggerID: FDH_NOT_OPENED_SURVEY_TRIGGER_ID,
					ttl: SURVEY_TRIGGER_MAX_TTL,
				},
			},
		} );
	} );

	it( 'should not send the trigger when the hub was already visited', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
			] );

		const { waitForRegistry } = render();
		await waitForRegistry();
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not send the trigger when the feature flag is disabled', async () => {
		render( { features: [] } );
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not send the trigger when the user is not authenticated', async () => {
		provideUserAuthentication( registry, { authenticated: false } );

		const { waitForRegistry } = render();
		await waitForRegistry();
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not send the trigger when no feature is unread', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.190.0' );

		const { waitForRegistry } = render();
		await waitForRegistry();
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not send the trigger when fewer than two features are available', async () => {
		setupRegistry();
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.187.0' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registerFeature( 'only-feature' );

		const { waitForRegistry } = render();
		await waitForRegistry();
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not send the trigger while the dismissed items are loading', async () => {
		setupRegistry();
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.187.0' );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		registerFeature( 'feature-one' );
		registerFeature( 'feature-two' );
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismissed-items' ),
			{ repeat: 10 }
		);

		render();
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not send the trigger while the newness state is loading', async () => {
		setupRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registerFeature( 'feature-one' );
		registerFeature( 'feature-two' );
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/expirable-items' ),
			{ repeat: 10 }
		);

		render();
		await waitForTimeouts( SEND_SETTLE_MS );

		expect( triggeredIDs() ).toEqual( [] );
	} );
} );
