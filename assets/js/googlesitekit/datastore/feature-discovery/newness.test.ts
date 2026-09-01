/**
 * `core/feature-discovery` data store: newness tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
} from '@tests/js/utils';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from './constants';
import type { FeatureSettings } from './types';
import { getFeatureDismissalKey, getFeatureNewnessKey } from './utils';

function createSettings(
	overrides: Partial< FeatureSettings > = {}
): FeatureSettings {
	return {
		title: 'Test feature',
		shortDescription: 'A feature used in tests.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: '1.159.0',
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
			isEnabled: () => false,
		},
		...overrides,
	};
}

describe( 'core/feature-discovery newness', () => {
	let registry: WPDataRegistry;

	function registerFeature(
		slug: string,
		overrides: Partial< FeatureSettings > = {}
	) {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( slug, createSettings( overrides ) );
	}

	function provideNewnessState( {
		initialVersion = '1.160.0',
		dismissedItems = [],
		expirableItems = {},
	}: {
		initialVersion?: string;
		dismissedItems?: string[];
		expirableItems?: Record< string, number >;
	} = {} ) {
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( initialVersion );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( dismissedItems );
		registry
			.dispatch( CORE_USER )
			.receiveGetExpirableItems( expirableItems );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [] );
	} );

	describe( 'isFeatureNew', () => {
		it( 'should return undefined while user state is loading', () => {
			freezeFetch(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/expirable-items'
				)
			);
			registerFeature( 'feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureNew( 'feature' )
			).toBeUndefined();
		} );

		it( 'should exclude a feature added before the user floor', () => {
			provideNewnessState();
			registerFeature( 'baseline-feature', {
				addedInVersion: '1.158.0',
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureNew( 'baseline-feature' )
			).toBe( false );
		} );

		it( 'should include a feature added at or after the user floor', () => {
			provideNewnessState();
			registerFeature( 'new-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureNew( 'new-feature' )
			).toBe( true );
		} );

		it( 'should consider a feature without a timer new and unread', () => {
			provideNewnessState();
			registerFeature( 'unread-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureUnread( 'unread-feature' )
			).toBe( true );
		} );

		it( 'should exclude a feature whose timer has lapsed', () => {
			provideNewnessState( {
				expirableItems: {
					[ getFeatureNewnessKey( 'lapsed-feature' ) ]:
						Math.floor( Date.now() / 1000 ) - 1, // eslint-disable-line sitekit/no-direct-date -- Timers are evaluated against the current time.
				},
			} );
			registerFeature( 'lapsed-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureNew( 'lapsed-feature' )
			).toBe( false );
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureUnread( 'lapsed-feature' )
			).toBe( false );
		} );
	} );

	describe( 'getWhatsNewFeatures', () => {
		it( 'should include only available, new, and undismissed features in the required order', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: false, connected: false },
			] );
			provideNewnessState( {
				dismissedItems: [ getFeatureDismissalKey( 'dismissed' ) ],
				expirableItems: {
					[ getFeatureNewnessKey( 'read-newest' ) ]:
						Math.floor( Date.now() / 1000 ) + 100, // eslint-disable-line sitekit/no-direct-date -- Timers are evaluated against the current time.
				},
			} );
			registerFeature( 'read-newest', { addedInVersion: '1.161.0' } );
			registerFeature( 'unread-oldest', { addedInVersion: '1.159.0' } );
			registerFeature( 'unread-newer-first', {
				addedInVersion: '1.160.0',
			} );
			registerFeature( 'unread-newer-second', {
				addedInVersion: '1.160.0',
			} );
			registerFeature( 'dismissed' );
			registerFeature( 'set-up', {
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => true,
				},
			} );
			registerFeature( 'unmet-prerequisite', {
				prerequisiteModules: [ 'analytics-4' ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getWhatsNewFeatures()
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [
				'unread-newer-first',
				'unread-newer-second',
				'unread-oldest',
				'read-newest',
			] );
		} );
	} );

	describe( 'getNewFeatureCount', () => {
		it( 'should count only unread Whats new features', () => {
			provideNewnessState( {
				expirableItems: {
					[ getFeatureNewnessKey( 'read' ) ]:
						Math.floor( Date.now() / 1000 ) + 100, // eslint-disable-line sitekit/no-direct-date -- Timers are evaluated against the current time.
				},
			} );
			registerFeature( 'unread' );
			registerFeature( 'read' );

			expect(
				registry.select( CORE_FEATURE_DISCOVERY ).getNewFeatureCount()
			).toBe( 1 );
		} );
	} );

	describe( 'markFeaturesSeen', () => {
		it( 'should seed timers for several features in one request', async () => {
			const endpoint = new RegExp(
				'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
			);

			fetchMock.postOnce( endpoint, {
				body: {},
				status: 200,
			} );

			await registry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.markFeaturesSeen( [ 'first', 'second' ] );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( fetchMock ).toHaveFetched( endpoint, {
				body: {
					data: [
						{
							expiration: WEEK_IN_SECONDS * 4,
							slug: getFeatureNewnessKey( 'first' ),
						},
						{
							expiration: WEEK_IN_SECONDS * 4,
							slug: getFeatureNewnessKey( 'second' ),
						},
					],
				},
			} );
		} );

		it( 'should leave a seen feature listed but read while its timer is active', () => {
			provideNewnessState( {
				expirableItems: {
					[ getFeatureNewnessKey( 'seen-feature' ) ]:
						Math.floor( Date.now() / 1000 ) + WEEK_IN_SECONDS * 4, // eslint-disable-line sitekit/no-direct-date -- Timers are evaluated against the current time.
				},
			} );
			registerFeature( 'seen-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getWhatsNewFeatures()
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [ 'seen-feature' ] );
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureUnread( 'seen-feature' )
			).toBe( false );
		} );
	} );
} );
