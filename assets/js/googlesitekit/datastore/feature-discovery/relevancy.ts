/**
 * `core/feature-discovery` data store: per-user relevancy votes.
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
import {
	Registry,
	Select,
	commonActions,
	createRegistrySelector,
} from 'googlesitekit-data';
import {
	VOTE_DIRECTION_DOWN,
	VOTE_DIRECTION_UP,
	VoteDirection,
} from '@/js/components/surveys/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { FeatureDiscoveryState } from './types';
import { getFeatureRelevancyVoteSlug } from './utils';

// Serialize dismissed-item updates within each registry, including across panel mounts.
const pendingVotes = new WeakMap< Registry, Promise< unknown > >();

export const actions = {
	/**
	 * Saves a feature relevancy vote for the current user, replacing the opposite vote.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}        slug      Feature slug.
	 * @param {VoteDirection} direction Vote direction.
	 * @return {Object} Generator instance.
	 */
	*setFeatureRelevancyVote(
		slug: string,
		direction: VoteDirection
	): Generator< unknown, unknown, Registry > {
		const registry = yield commonActions.getRegistry();

		const oppositeDirection =
			direction === VOTE_DIRECTION_UP
				? VOTE_DIRECTION_DOWN
				: VOTE_DIRECTION_UP;

		const oppositeVoteSlug = getFeatureRelevancyVoteSlug(
			slug,
			oppositeDirection
		);

		const voteSlug = getFeatureRelevancyVoteSlug( slug, direction );

		const pendingVote = (
			pendingVotes.get( registry ) || Promise.resolve()
		)
			.catch( () => {} )
			.then( async () => {
				// Finish the initial read before writing so it cannot overwrite the saved vote.
				await registry.resolveSelect( CORE_USER ).getDismissedItems();

				const { dismissItem, removeDismissedItems } =
					registry.dispatch( CORE_USER );

				const { error } = await removeDismissedItems(
					oppositeVoteSlug
				);

				if ( error ) {
					return { error };
				}

				return dismissItem( voteSlug );
			} );

		pendingVotes.set( registry, pendingVote );

		return pendingVote;
	},
};

export const selectors = {
	/**
	 * Gets the current user's relevancy vote for a feature.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Feature slug.
	 * @return {(VoteDirection|null|undefined)} The vote, null if not voted, or undefined while loading.
	 */
	getFeatureRelevancyVote: createRegistrySelector(
		( select: Select ) =>
			(
				state: FeatureDiscoveryState,
				slug: string
			): VoteDirection | null | undefined => {
				const { getDismissedItems, isItemDismissed } =
					select( CORE_USER );

				if ( getDismissedItems() === undefined ) {
					return undefined;
				}

				const upvoteSlug = getFeatureRelevancyVoteSlug(
					slug,
					VOTE_DIRECTION_UP
				);

				if ( isItemDismissed( upvoteSlug ) ) {
					return VOTE_DIRECTION_UP;
				}

				const downvoteSlug = getFeatureRelevancyVoteSlug(
					slug,
					VOTE_DIRECTION_DOWN
				);

				if ( isItemDismissed( downvoteSlug ) ) {
					return VOTE_DIRECTION_DOWN;
				}

				return null;
			}
	),
};

export default { actions, selectors };
