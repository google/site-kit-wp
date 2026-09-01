/**
 * `core/feature-discovery` data store: per-user newness.
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
import compareVersions from 'compare-versions';

/**
 * WordPress dependencies
 */
import type { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	Select,
	commonActions,
	createRegistrySelector,
} from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
import { CORE_FEATURE_DISCOVERY } from './constants';
import type { Feature, FeatureDiscoveryState } from './types';
import { getFeatureDismissalKey, getFeatureNewnessKey } from './utils';

function getNewnessFloor( initialVersion: string ) {
	const [ major, minor ] = initialVersion.split( '.' );

	return `${ major }.${ Number( minor ) - 1 }.0`;
}

function hasNewnessState( select: Select ) {
	const { getDismissedItems, getExpirableItems, getInitialSiteKitVersion } =
		select( CORE_USER );

	return (
		getExpirableItems() !== undefined &&
		getDismissedItems() !== undefined &&
		getInitialSiteKitVersion() !== undefined
	);
}

export const actions = {
	/**
	 * Marks features as seen by starting each feature's newness timer.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array.<string>} slugs Feature slugs to mark as seen.
	 * @return {Object} Generator instance.
	 */
	*markFeaturesSeen(
		slugs: string[]
	): Generator< unknown, unknown, WPDataRegistry > {
		const registry = yield commonActions.getRegistry();

		return registry.dispatch( CORE_USER ).setExpirableItemTimers(
			slugs.map( ( slug ) => ( {
				slug: getFeatureNewnessKey( slug ),
				expiresInSeconds: WEEK_IN_SECONDS * 4,
			} ) )
		);
	},
};

export const selectors = {
	/**
	 * Determines whether a feature is new to the current user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Feature slug.
	 * @return {(boolean|undefined)} Whether the feature is new, or `undefined` while user state is loading.
	 */
	isFeatureNew: createRegistrySelector(
		( select: Select ) => ( state: FeatureDiscoveryState, slug: string ) => {
			if ( ! hasNewnessState( select ) ) {
				return undefined;
			}

			const feature = select( CORE_FEATURE_DISCOVERY ).getFeature( slug );
			const initialVersion =
				select( CORE_USER ).getInitialSiteKitVersion();

			if ( ! feature || ! initialVersion ) {
				return false;
			}

			if (
				! compareVersions.compare(
					feature.addedInVersion,
					getNewnessFloor( initialVersion ),
					'>='
				)
			) {
				return false;
			}

			const newnessKey = getFeatureNewnessKey( slug );
			const { hasExpirableItem, isExpirableItemActive } =
				select( CORE_USER );

			return (
				hasExpirableItem( newnessKey ) === false ||
				isExpirableItemActive( newnessKey )
			);
		}
	),

	/**
	 * Determines whether a feature is new and has not been shown yet.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Feature slug.
	 * @return {(boolean|undefined)} Whether the feature is unread, or `undefined` while user state is loading.
	 */
	isFeatureUnread: createRegistrySelector(
		( select: Select ) => ( state: FeatureDiscoveryState, slug: string ) => {
			const isFeatureNew = select( CORE_FEATURE_DISCOVERY ).isFeatureNew(
				slug
			);

			if ( isFeatureNew === undefined ) {
				return undefined;
			}

			return (
				isFeatureNew &&
				select( CORE_USER ).hasExpirableItem(
					getFeatureNewnessKey( slug )
				) === false
			);
		}
	),

	/**
	 * Gets new features that should appear in the What's new list.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(Array.<Object>|undefined)} New available features, or `undefined` while user state is loading.
	 */
	getWhatsNewFeatures: createRegistrySelector(
		( select: Select ) => (): Feature[] | undefined => {
			if ( ! hasNewnessState( select ) ) {
				return undefined;
			}

			const { isFeatureNew, isFeatureUnread } = select(
				CORE_FEATURE_DISCOVERY
			);

			return select( CORE_FEATURE_DISCOVERY )
				.getAvailableFeatures()
				.filter(
					( feature: Feature ) =>
						isFeatureNew( feature.slug ) &&
						! select( CORE_USER ).isItemDismissed(
							getFeatureDismissalKey( feature.slug )
						)
				)
				.sort( ( first: Feature, second: Feature ) => {
					const firstUnread = isFeatureUnread( first.slug );
					const secondUnread = isFeatureUnread( second.slug );

					if ( firstUnread !== secondUnread ) {
						return firstUnread ? -1 : 1;
					}

					if (
						compareVersions.compare(
							first.addedInVersion,
							second.addedInVersion,
							'>'
						)
					) {
						return -1;
					}

					if (
						compareVersions.compare(
							first.addedInVersion,
							second.addedInVersion,
							'<'
						)
					) {
						return 1;
					}

					return 0;
				} );
		}
	),

	/**
	 * Gets the number of unread features in the What's new list.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(number|undefined)} Number of unread features, or `undefined` while user state is loading.
	 */
	getNewFeatureCount: createRegistrySelector(
		( select: Select ) => (): number | undefined => {
			const features = select(
				CORE_FEATURE_DISCOVERY
			).getWhatsNewFeatures();

			if ( features === undefined ) {
				return undefined;
			}

			return features.filter( ( feature: Feature ) =>
				select( CORE_FEATURE_DISCOVERY ).isFeatureUnread( feature.slug )
			).length;
		}
	),
};

export default {
	actions,
	selectors,
};
