/**
 * `core/feature-discovery` data store: selectors tests.
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

function createSettings(
	overrides: Partial< FeatureSettings > = {}
): FeatureSettings {
	return {
		title: 'Test feature',
		shortDescription: 'A feature used in tests.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: '1.100.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			moduleSlug: 'analytics-4',
		},
		...overrides,
	};
}

describe( 'core/feature-discovery selectors', () => {
	let registry: WPDataRegistry;

	function registerFeature(
		slug: string,
		overrides: Partial< FeatureSettings > = {}
	) {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( slug, createSettings( overrides ) );
	}

	function freezeModules() {
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'getFeatureCategories', () => {
		it( 'should return the categories in their fixed, curated order', () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureCategories()
					.map( ( { title }: { title: string } ) => title )
			).toEqual( [
				'Get to know your audience',
				'Engage your visitors',
				'Earn money from your content',
				'Drive traffic to your site',
				'Manage privacy',
				'Improve your site speed and experience',
				'Collaborate and save time',
			] );
		} );

		it( 'should return each category with its slug', () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureCategories()
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [
				FEATURE_CATEGORIES.AUDIENCE,
				FEATURE_CATEGORIES.ENGAGEMENT,
				FEATURE_CATEGORIES.MONETIZATION,
				FEATURE_CATEGORIES.TRAFFIC,
				FEATURE_CATEGORIES.PRIVACY,
				FEATURE_CATEGORIES.PERFORMANCE,
				FEATURE_CATEGORIES.PRODUCTIVITY,
			] );
		} );
	} );

	describe( 'isFeaturePrerequisiteMet', () => {
		it( 'should return undefined for an unregistered feature', () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'nope' )
			).toBeUndefined();
		} );

		it( 'should return true when the feature has no prerequisite modules', () => {
			registerFeature( 'no-prerequisites' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'no-prerequisites' )
			).toBe( true );
		} );

		it( 'should return undefined while module state is loading', () => {
			freezeModules();
			registerFeature( 'needs-analytics', {
				prerequisiteModules: [ 'analytics-4' ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'needs-analytics' )
			).toBeUndefined();
		} );

		it( 'should return true when its single prerequisite module is connected', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: true, connected: true },
			] );
			registerFeature( 'needs-analytics', {
				prerequisiteModules: [ 'analytics-4' ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'needs-analytics' )
			).toBe( true );
		} );

		it( 'should return false when its single prerequisite module is not connected', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: false, connected: false },
			] );
			registerFeature( 'needs-analytics', {
				prerequisiteModules: [ 'analytics-4' ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'needs-analytics' )
			).toBe( false );
		} );

		it( 'should require every prerequisite module to be connected', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: true, connected: true },
				{ slug: 'adsense', active: false, connected: false },
			] );
			registerFeature( 'needs-both', {
				prerequisiteModules: [ 'analytics-4', 'adsense' ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'needs-both' )
			).toBe( false );
		} );

		it( 'should return true when all of several prerequisite modules are connected', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: true, connected: true },
				{ slug: 'adsense', active: true, connected: true },
			] );
			registerFeature( 'needs-both', {
				prerequisiteModules: [ 'analytics-4', 'adsense' ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeaturePrerequisiteMet( 'needs-both' )
			).toBe( true );
		} );
	} );

	describe( 'isFeatureConnected', () => {
		it( 'should return undefined for an unregistered feature', () => {
			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'nope' )
			).toBeUndefined();
		} );

		it( 'should use the setup descriptor isEnabled check when provided', () => {
			const isEnabled = jest.fn().mockReturnValue( true );

			provideModules( registry, [
				{ slug: 'analytics-4', active: false, connected: false },
			] );
			registerFeature( 'has-predicate', {
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled,
				},
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'has-predicate' )
			).toBe( true );
			expect( isEnabled ).toHaveBeenCalled();
		} );

		it( 'should prefer isEnabled over the module connection state', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: true, connected: true },
			] );
			registerFeature( 'connected-module-incomplete-feature', {
				setup: {
					type: FEATURE_SETUP_TYPES.SETUP_FLOW,
					moduleSlug: 'analytics-4',
					isEnabled: () => false,
				},
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'connected-module-incomplete-feature' )
			).toBe( false );
		} );

		it( 'should fall back to the module connection state', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: true, connected: true },
			] );
			registerFeature( 'module-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'module-feature' )
			).toBe( true );
		} );

		it( 'should return false when the module it sets up is not connected', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: false, connected: false },
			] );
			registerFeature( 'module-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'module-feature' )
			).toBe( false );
		} );

		it( 'should return undefined while module state is loading', () => {
			freezeModules();
			registerFeature( 'module-feature' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'module-feature' )
			).toBeUndefined();
		} );

		it( 'should return false when the feature has no completion state to read', () => {
			registerFeature( 'no-completion-state', {
				setup: { type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL },
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.isFeatureConnected( 'no-completion-state' )
			).toBe( false );
		} );
	} );

	describe( 'getAvailableFeatures', () => {
		beforeEach( () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: false, connected: false },
				{ slug: 'search-console', active: true, connected: true },
			] );
		} );

		it( 'should return features from every category, in registration order', () => {
			registerFeature( 'audience-one' );
			registerFeature( 'monetization-one', {
				goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getAvailableFeatures()
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [ 'audience-one', 'monetization-one' ] );
		} );

		it( 'should exclude features that are already set up', () => {
			registerFeature( 'already-set-up', {
				setup: {
					type: FEATURE_SETUP_TYPES.SETUP_FLOW,
					moduleSlug: 'search-console',
				},
			} );

			expect(
				registry.select( CORE_FEATURE_DISCOVERY ).getAvailableFeatures()
			).toEqual( [] );
		} );

		it( 'should exclude features whose prerequisite modules are not connected', () => {
			registerFeature( 'needs-analytics', {
				prerequisiteModules: [ 'analytics-4' ],
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => false,
				},
			} );

			expect(
				registry.select( CORE_FEATURE_DISCOVERY ).getAvailableFeatures()
			).toEqual( [] );
		} );

		it( 'should exclude features hidden by their own checkRequirements', () => {
			registerFeature( 'hidden', { checkRequirements: () => false } );

			expect(
				registry.select( CORE_FEATURE_DISCOVERY ).getAvailableFeatures()
			).toEqual( [] );
		} );
	} );

	describe( 'getFeaturesByGoal', () => {
		beforeEach( () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: false, connected: false },
			] );
		} );

		it( 'should require a category', () => {
			expect( () =>
				registry.select( CORE_FEATURE_DISCOVERY ).getFeaturesByGoal()
			).toThrow( 'category is required to get features by goal.' );
		} );

		it( 'should return features whose primary category matches, in registration order', () => {
			registerFeature( 'audience-one' );
			registerFeature( 'monetization-one', {
				goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
			} );
			registerFeature( 'audience-two' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [ 'audience-one', 'audience-two' ] );
		} );

		it( 'should not match on a secondary category', () => {
			registerFeature( 'secondary-audience', {
				goalCategories: [
					FEATURE_CATEGORIES.MONETIZATION,
					FEATURE_CATEGORIES.AUDIENCE,
				],
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
			).toEqual( [] );
		} );

		it( 'should exclude features that are already set up', () => {
			registerFeature( 'already-set-up', {
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => true,
				},
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
			).toEqual( [] );
		} );

		it( 'should exclude features whose prerequisite modules are not connected', () => {
			registerFeature( 'needs-analytics', {
				prerequisiteModules: [ 'analytics-4' ],
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => false,
				},
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
			).toEqual( [] );
		} );

		it( 'should include features whose prerequisite modules are connected', () => {
			provideModules( registry, [
				{ slug: 'analytics-4', active: true, connected: true },
			] );
			registerFeature( 'needs-analytics', {
				prerequisiteModules: [ 'analytics-4' ],
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => false,
				},
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [ 'needs-analytics' ] );
		} );

		it( 'should exclude features hidden by their own checkRequirements', () => {
			registerFeature( 'hidden', {
				checkRequirements: () => false,
			} );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
			).toEqual( [] );
		} );

		it( 'should include features whose checkRequirements passes', () => {
			const checkRequirements = jest.fn().mockReturnValue( true );

			registerFeature( 'visible', { checkRequirements } );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [ 'visible' ] );
			expect( checkRequirements ).toHaveBeenCalled();
		} );

		it( 'should treat a feature with no checkRequirements as visible', () => {
			registerFeature( 'default-visible' );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
					.map( ( { slug }: { slug: string } ) => slug )
			).toEqual( [ 'default-visible' ] );
		} );

		it( 'should exclude features while their eligibility is still loading', () => {
			const loadingRegistry = createTestRegistry();

			freezeModules();

			loadingRegistry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.registerFeature( 'module-feature', createSettings() );

			expect(
				loadingRegistry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeaturesByGoal( FEATURE_CATEGORIES.AUDIENCE )
			).toEqual( [] );
		} );
	} );
} );
