/**
 * `core/feature-discovery` data store: features.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { Registry, commonActions, createReducer } from 'googlesitekit-data';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import {
	getCurrentFeatureDiscoveryTabPath,
	setPendingSetup,
} from '@/js/googlesitekit/feature-discovery/pending-setup';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORY_ORDER,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from './constants';
import type {
	Feature,
	FeatureCategorySlug,
	FeatureDiscoveryState,
	FeatureSettings,
	PendingSetup,
} from './types';

const REGISTER_FEATURE = 'REGISTER_FEATURE' as const;
const RECEIVE_PENDING_SETUP = 'RECEIVE_PENDING_SETUP' as const;

type Action =
	| {
			type: typeof REGISTER_FEATURE;
			payload: { slug: string; settings: Omit< Feature, 'slug' > };
	  }
	| {
			type: typeof RECEIVE_PENDING_SETUP;
			payload: { pendingSetup: PendingSetup | null };
	  };

export const initialState: FeatureDiscoveryState = {
	features: {},
	pendingSetup: null,
};

const effortLevels = Object.values( FEATURE_EFFORTS );
const setupTypes = Object.values( FEATURE_SETUP_TYPES );

type SetupFeatureResult = { error?: unknown };

export const actions = {
	/**
	 * Registers a feature in the catalog with a given slug and settings.
	 *
	 * @since 1.186.0
	 *
	 * @param {string}         slug                               Feature's slug.
	 * @param {Object}         settings                           Feature's settings.
	 * @param {string}         settings.title                     Feature's card title.
	 * @param {string}         settings.shortDescription          Feature's card description.
	 * @param {number}         settings.effort                    Effort level: `1`, `2` or `3`.
	 * @param {string}         [settings.moduleSlug]              Optional. Module whose service identity is shown on the feature card.
	 * @param {Array.<string>} settings.goalCategories            Goal categories the feature belongs to, in order. The first is its primary category.
	 * @param {string}         settings.addedInVersion            Site Kit version the feature was released in.
	 * @param {Object}         settings.setup                     Setup descriptor driving the feature's CTA and activation.
	 * @param {Function}       [settings.setup.isInProgress]      Optional. Returns whether setup has started but not completed.
	 * @param {Function}       [settings.setup.getResumeURL]      Optional. Returns a URL to resume an unfinished setup.
	 * @param {string}         [settings.setup.resumeCTALabel]    Optional. Label for the detail panel CTA while setup is in progress.
	 * @param {Array.<string>} [settings.prerequisiteModules]     Optional. Modules the feature depends on but does not itself set up. Default is: `[]`.
	 * @param {Function}       [settings.checkRequirements]       Optional. Hides the feature when it returns false. Default is visible.
	 * @param {Object}         [settings.detail]                  Optional. Detail panel content.
	 * @param {Array.<string>} [settings.badges]                  Optional. Static badges. Default is: `[]`.
	 * @param {Object}         [settings.successNotice]           Optional. Copy for the notice shown once the feature is set up.
	 * @param {Object}         [settings.incompleteSetupReminder] Optional. Copy for incomplete setup reminder surfaces.
	 * @return {Object} Redux-style action.
	 */
	registerFeature( slug: string, settings: FeatureSettings ) {
		invariant( slug, 'slug is required to register a feature.' );
		invariant(
			isPlainObject( settings ),
			'settings are required to register a feature.'
		);

		const {
			title,
			shortDescription,
			effort,
			goalCategories,
			addedInVersion,
			setup,
			prerequisiteModules = [],
			badges = [],
		} = settings;

		invariant( title, 'title is required to register a feature.' );
		invariant(
			shortDescription,
			'shortDescription is required to register a feature.'
		);
		invariant(
			effortLevels.includes( effort ),
			`Feature effort should be one of: ${ effortLevels.join(
				', '
			) }, but "${ effort }" was provided.`
		);
		invariant(
			Array.isArray( goalCategories ) && goalCategories.length > 0,
			'goalCategories is required to register a feature.'
		);
		goalCategories.forEach( ( category: FeatureCategorySlug ) => {
			invariant(
				FEATURE_CATEGORY_ORDER.includes( category ),
				`Feature goal category should be one of: ${ FEATURE_CATEGORY_ORDER.join(
					', '
				) }, but "${ category }" was provided.`
			);
		} );
		invariant(
			addedInVersion,
			'addedInVersion is required to register a feature.'
		);
		invariant(
			isPlainObject( setup ),
			'setup is required to register a feature.'
		);
		invariant(
			setupTypes.includes( setup.type ),
			`Feature setup type should be one of: ${ setupTypes.join(
				', '
			) }, but "${ setup.type }" was provided.`
		);
		invariant(
			Array.isArray( prerequisiteModules ),
			'prerequisiteModules must be an array.'
		);
		invariant( Array.isArray( badges ), 'badges must be an array.' );

		return {
			payload: {
				slug,
				settings: { ...settings, prerequisiteModules, badges },
			},
			type: REGISTER_FEATURE,
		};
	},

	/**
	 * Starts the setup for the feature registered under a given slug.
	 *
	 * For `setup-flow` features that activate a module, this activates the
	 * module, records that the user left the hub to set it up, and takes them
	 * into the module's setup. Where the module has no setup screen, it is
	 * simply activated and the user stays on the hub.
	 *
	 * @since 1.189.0
	 * @since n.e.x.t Implemented the `setup-flow` setup type.
	 *
	 * @param {string} slug Feature's slug.
	 * @return {Object} Empty object, or an object with an `error` if the module could not be activated.
	 */
	setupFeature: createValidatedAction(
		( slug: string ) => {
			invariant( slug, 'slug is required to set up a feature.' );
		},
		function* (
			slug: string
		): Generator< unknown, SetupFeatureResult, unknown > {
			const registry = ( yield commonActions.getRegistry() ) as Registry;

			const feature = registry
				.select( CORE_FEATURE_DISCOVERY )
				.getFeature( slug );

			if ( feature?.setup.type !== FEATURE_SETUP_TYPES.SETUP_FLOW ) {
				return {};
			}

			const { moduleSlug } = feature.setup;

			if ( ! moduleSlug ) {
				return {};
			}

			const { response, error } = ( yield commonActions.await(
				registry.dispatch( CORE_MODULES ).activateModule( moduleSlug )
			) ) as {
				response?: { moduleReauthURL: string };
				error?: unknown;
			};

			if ( error ) {
				return { error };
			}

			// Modules with no setup screen, such as PageSpeed Insights, are
			// connected as soon as they are activated, so the user stays on
			// the hub.
			if (
				! registry.select( CORE_MODULES ).getModule( moduleSlug )
					?.SetupComponent
			) {
				return {};
			}

			// The record must be written before navigating so that it survives
			// the OAuth round trip.
			yield commonActions.await(
				setPendingSetup( slug, getCurrentFeatureDiscoveryTabPath() )
			);

			yield commonActions.await(
				registry
					.dispatch( CORE_LOCATION )
					.navigateTo( response?.moduleReauthURL as string )
			);

			return {};
		}
	),

	/**
	 * Stores the setup the user left the hub to complete, as consumed from
	 * the cache when the hub mounted.
	 *
	 * @since n.e.x.t
	 *
	 * @param {(Object|null)} pendingSetup             The pending setup, or `null` if there is none.
	 * @param {string}        pendingSetup.featureSlug Slug of the feature being set up.
	 * @param {string}        pendingSetup.returnTab   Path of the tab the user set out from.
	 * @return {Object} Redux-style action.
	 */
	receivePendingSetup( pendingSetup: PendingSetup | null ) {
		invariant(
			pendingSetup === null || isPlainObject( pendingSetup ),
			'pendingSetup must be an object or null.'
		);

		return {
			payload: { pendingSetup },
			type: RECEIVE_PENDING_SETUP,
		};
	},
};

export const reducer = createReducer(
	( state: FeatureDiscoveryState, { type, payload }: Action ) => {
		switch ( type ) {
			case REGISTER_FEATURE: {
				const { slug, settings } = payload;

				if ( state.features[ slug ] !== undefined ) {
					global.console.warn(
						`Could not register feature with slug "${ slug }". Feature "${ slug }" is already registered.`
					);

					return state;
				}

				state.features[ slug ] = { ...settings, slug };

				return state;
			}

			case RECEIVE_PENDING_SETUP: {
				state.pendingSetup = payload.pendingSetup;

				return state;
			}

			default:
				return state;
		}
	}
);

export default {
	initialState,
	actions,
	reducer,
};
