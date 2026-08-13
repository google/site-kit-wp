/**
 * `core/feature-discovery` data store: features tests.
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
import { createTestRegistry } from '@tests/js/utils';
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
		effort: FEATURE_EFFORTS.JUST_A_FEW_CLICKS,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: '1.100.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			moduleSlug: 'analytics-4',
		},
		...overrides,
	};
}

// Builds intentionally invalid settings to exercise the action's validation.
function createInvalidSettings(
	overrides: Record< string, unknown >
): FeatureSettings {
	return { ...createSettings(), ...overrides } as unknown as FeatureSettings;
}

describe( 'core/feature-discovery features', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'registerFeature', () => {
			it( 'should register a feature under its slug', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'test-feature' )
				).toMatchObject( {
					slug: 'test-feature',
					title: 'Test feature',
				} );
			} );

			it( 'should default prerequisiteModules and badges to empty arrays', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'test-feature' )
				).toMatchObject( {
					badges: [],
					prerequisiteModules: [],
				} );
			} );

			it( 'should preserve registration order', () => {
				[ 'first', 'second', 'third' ].forEach( ( slug ) => {
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.registerFeature( slug, createSettings() );
				} );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeatures()
						.map( ( { slug }: { slug: string } ) => slug )
				).toEqual( [ 'first', 'second', 'third' ] );
			} );

			it( 'should allow features to be registered from multiple call sites', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'from-core', createSettings() );
				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'from-module',
					createSettings( {
						goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
					} )
				);

				expect(
					registry.select( CORE_FEATURE_DISCOVERY ).getFeatures()
				).toHaveLength( 2 );
			} );

			it( 'should warn and not overwrite when the slug is already registered', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature(
						'test-feature',
						createSettings( { title: 'Replacement' } )
					);

				expect( console ).toHaveWarnedWith(
					'Could not register feature with slug "test-feature". Feature "test-feature" is already registered.'
				);
				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'test-feature' ).title
				).toBe( 'Test feature' );
			} );

			const invalidCases: [
				string,
				string,
				FeatureSettings | undefined
			][] = [
				[ 'no slug is provided', '', createSettings() ],
				[ 'no settings are provided', 'test-feature', undefined ],
				[
					'no title is provided',
					'test-feature',
					createInvalidSettings( { title: undefined } ),
				],
				[
					'no shortDescription is provided',
					'test-feature',
					createInvalidSettings( { shortDescription: undefined } ),
				],
				[
					'the effort is not a known level',
					'test-feature',
					createInvalidSettings( { effort: 4 } ),
				],
				[
					'goalCategories is empty',
					'test-feature',
					createInvalidSettings( { goalCategories: [] } ),
				],
				[
					'a goal category is unknown',
					'test-feature',
					createInvalidSettings( {
						goalCategories: [ 'not-a-category' ],
					} ),
				],
				[
					'no addedInVersion is provided',
					'test-feature',
					createInvalidSettings( { addedInVersion: undefined } ),
				],
				[
					'no setup descriptor is provided',
					'test-feature',
					createInvalidSettings( { setup: undefined } ),
				],
				[
					'the setup type is unknown',
					'test-feature',
					createInvalidSettings( { setup: { type: 'not-a-type' } } ),
				],
			];

			it.each( invalidCases )(
				'should throw when %s',
				( _, slug, settings ) => {
					expect( () =>
						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.registerFeature( slug, settings )
					).toThrow();
				}
			);
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getFeatures', () => {
			it( 'should return an empty array when nothing is registered', () => {
				expect(
					registry.select( CORE_FEATURE_DISCOVERY ).getFeatures()
				).toEqual( [] );
			} );
		} );

		describe( 'getFeature', () => {
			it( 'should return null for an unregistered slug', () => {
				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'nope' )
				).toBeNull();
			} );

			it( 'should require a slug', () => {
				expect( () =>
					registry.select( CORE_FEATURE_DISCOVERY ).getFeature()
				).toThrow( 'slug is required to get a feature.' );
			} );
		} );
	} );
} );
