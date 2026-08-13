/**
 * `core/feature-discovery` data store: selectors.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, createRegistrySelector } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_CATEGORY_ORDER,
} from './constants';
import type {
	Feature,
	FeatureCategory,
	FeatureCategoryDefinition,
	FeatureDiscoveryState,
} from './types';

export const selectors = {
	/**
	 * Gets every registered feature, in registration order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array.<Object>} Registered features.
	 */
	getFeatures( state: FeatureDiscoveryState ): Feature[] {
		return Object.values( state.features );
	},

	/**
	 * Gets a single registered feature by its slug.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Feature's slug.
	 * @return {(Object|null)} The feature, or `null` if none is registered under `slug`.
	 */
	getFeature( state: FeatureDiscoveryState, slug: string ): Feature | null {
		invariant( slug, 'slug is required to get a feature.' );

		return state.features[ slug ] || null;
	},

	/**
	 * Gets the goal categories, in their fixed, curated order.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Array.<Object>} Categories, each with its `slug` and `title`.
	 */
	getFeatureCategories(): FeatureCategoryDefinition[] {
		const titles = {
			[ FEATURE_CATEGORIES.AUDIENCE ]: __(
				'Get to know your audience',
				'google-site-kit'
			),
			[ FEATURE_CATEGORIES.ENGAGEMENT ]: __(
				'Engage your visitors',
				'google-site-kit'
			),
			[ FEATURE_CATEGORIES.MONETIZATION ]: __(
				'Earn money from your content',
				'google-site-kit'
			),
			[ FEATURE_CATEGORIES.TRAFFIC ]: __(
				'Drive traffic to your site',
				'google-site-kit'
			),
			[ FEATURE_CATEGORIES.PRIVACY ]: __(
				'Manage privacy',
				'google-site-kit'
			),
			[ FEATURE_CATEGORIES.PERFORMANCE ]: __(
				'Improve your site speed and experience',
				'google-site-kit'
			),
			[ FEATURE_CATEGORIES.PRODUCTIVITY ]: __(
				'Collaborate and save time',
				'google-site-kit'
			),
		};

		return FEATURE_CATEGORY_ORDER.map( ( slug ) => ( {
			slug,
			title: titles[ slug ],
		} ) );
	},

	/**
	 * Determines whether every module a feature depends on is connected.
	 *
	 * Always `true` for a feature with no `prerequisiteModules`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Feature's slug.
	 * @return {(boolean|undefined)} Whether the prerequisites are met, or `undefined` if the feature is not registered or module state has not loaded.
	 */
	isFeaturePrerequisiteMet: createRegistrySelector(
		( select: Select ) => ( state: FeatureDiscoveryState, slug: string ) => {
			const feature = select( CORE_FEATURE_DISCOVERY ).getFeature( slug );

			if ( ! feature ) {
				return undefined;
			}

			const { prerequisiteModules = [] } = feature;

			if ( prerequisiteModules.length === 0 ) {
				return true;
			}

			const connectedStates: ( boolean | null | undefined )[] =
				prerequisiteModules.map( ( moduleSlug: string ) =>
					select( CORE_MODULES ).isModuleConnected( moduleSlug )
				);

			if (
				connectedStates.some(
					( isConnected ) => isConnected === undefined
				)
			) {
				return undefined;
			}

			return connectedStates.every(
				( isConnected ) => isConnected === true
			);
		}
	),

	/**
	 * Determines whether a feature is already set up.
	 *
	 * Uses the setup descriptor's `isEnabled` check where it provides one, and
	 * otherwise whether the module the feature sets up is connected.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Feature's slug.
	 * @return {(boolean|undefined)} Whether the feature is set up, or `undefined` if the feature is not registered or the underlying state has not loaded.
	 */
	isFeatureConnected: createRegistrySelector(
		( select: Select ) => ( state: FeatureDiscoveryState, slug: string ) => {
			const feature = select( CORE_FEATURE_DISCOVERY ).getFeature( slug );

			if ( ! feature ) {
				return undefined;
			}

			const { setup } = feature;

			if ( typeof setup?.isEnabled === 'function' ) {
				return setup.isEnabled( select );
			}

			// No completion state to read, as for a feature that is an action
			// rather than a persisted setting.
			if ( ! setup?.moduleSlug ) {
				return false;
			}

			const isConnected = select( CORE_MODULES ).isModuleConnected(
				setup.moduleSlug
			);

			if ( isConnected === undefined ) {
				return undefined;
			}

			// `isModuleConnected()` returns `null` for a module it can't find.
			return isConnected === true;
		}
	),

	/**
	 * Gets the features to show under a goal category.
	 *
	 * Features are listed under their primary goal category, and only while
	 * they are not set up, their prerequisite modules are connected, and their
	 * own `checkRequirements()` passes.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} category Goal category slug.
	 * @return {Array.<Object>} Features to show, in registration order.
	 */
	getFeaturesByGoal: createRegistrySelector(
		( select: Select ) =>
			(
				state: FeatureDiscoveryState,
				category: FeatureCategory
			): Feature[] => {
				invariant(
					category,
					'category is required to get features by goal.'
				);

				const {
					getFeatures,
					isFeatureConnected,
					isFeaturePrerequisiteMet,
				} = select( CORE_FEATURE_DISCOVERY );

				return getFeatures().filter( ( feature: Feature ) => {
					if ( feature.goalCategories?.[ 0 ] !== category ) {
						return false;
					}

					if ( isFeatureConnected( feature.slug ) !== false ) {
						return false;
					}

					if ( isFeaturePrerequisiteMet( feature.slug ) !== true ) {
						return false;
					}

					const { checkRequirements } = feature;

					if (
						typeof checkRequirements === 'function' &&
						! checkRequirements( select )
					) {
						return false;
					}

					return true;
				} );
			}
	),
};

export default {
	selectors,
};
