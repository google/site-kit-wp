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
import { createReducer } from 'googlesitekit-data';
import {
	FEATURE_CATEGORY_ORDER,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from './constants';
import type {
	Feature,
	FeatureCategorySlug,
	FeatureDiscoveryState,
	FeatureSettings,
} from './types';

const REGISTER_FEATURE = 'REGISTER_FEATURE' as const;

type Action = {
	type: typeof REGISTER_FEATURE;
	payload: { slug: string; settings: Omit< Feature, 'slug' > };
};

export const initialState: FeatureDiscoveryState = {
	features: {},
};

const effortLevels = Object.values( FEATURE_EFFORTS );
const setupTypes = Object.values( FEATURE_SETUP_TYPES );

export const actions = {
	/**
	 * Registers a feature in the catalog with a given slug and settings.
	 *
	 * @since 1.186.0
	 *
	 * @param {string}         slug                           Feature's slug.
	 * @param {Object}         settings                       Feature's settings.
	 * @param {string}         settings.title                 Feature's card title.
	 * @param {string}         settings.shortDescription      Feature's card description.
	 * @param {number}         settings.effort                Effort level: `1`, `2` or `3`.
	 * @param {Array.<string>} settings.goalCategories        Goal categories the feature belongs to, in order. The first is its primary category.
	 * @param {string}         settings.addedInVersion        Site Kit version the feature was released in.
	 * @param {Object}         settings.setup                 Setup descriptor driving the feature's CTA and activation.
	 * @param {Array.<string>} [settings.prerequisiteModules] Optional. Modules the feature depends on but does not itself set up. Default is: `[]`.
	 * @param {Function}       [settings.checkRequirements]   Optional. Hides the feature when it returns false. Default is visible.
	 * @param {Object}         [settings.detail]              Optional. Detail panel content.
	 * @param {Array.<string>} [settings.badges]              Optional. Static badges. Default is: `[]`.
	 * @param {Object}         [settings.successNotice]       Optional. Copy for the notice shown once the feature is set up.
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
