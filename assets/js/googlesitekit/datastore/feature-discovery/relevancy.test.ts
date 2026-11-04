/**
 * `core/feature-discovery` data store: relevancy vote tests.
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
import { Registry } from 'googlesitekit-data';
import {
	VOTE_DIRECTION_DOWN,
	VOTE_DIRECTION_UP,
	VoteDirection,
} from '@/js/components/surveys/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createTestRegistry, untilResolved } from '@tests/js/utils';
import { CORE_FEATURE_DISCOVERY } from './constants';

const dismissedItemsEndpoint =
	/^\/google-site-kit\/v1\/core\/user\/data\/dismissed-items/;
const dismissItemEndpoint =
	/^\/google-site-kit\/v1\/core\/user\/data\/dismiss-item\?/;

describe( 'core/feature-discovery relevancy', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	describe( 'getFeatureRelevancyVote', () => {
		it( 'should return undefined while loading and then resolve the saved vote', async () => {
			fetchMock.getOnce( dismissedItemsEndpoint, [
				'feature-discovery-relevancy-feature-up',
			] );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureRelevancyVote( 'feature' )
			).toBeUndefined();

			await untilResolved( registry, CORE_USER ).getDismissedItems();

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureRelevancyVote( 'feature' )
			).toBe( VOTE_DIRECTION_UP );
		} );

		it( 'should return null when only another feature has a saved vote', () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					'feature-discovery-relevancy-another-feature-up',
				] );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureRelevancyVote( 'feature' )
			).toBeNull();
		} );

		it.each< VoteDirection >( [ VOTE_DIRECTION_UP, VOTE_DIRECTION_DOWN ] )(
			'should return the saved %s vote',
			( direction ) => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						`feature-discovery-relevancy-feature-${ direction }`,
					] );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeatureRelevancyVote( 'feature' )
				).toBe( direction );
			}
		);
	} );

	describe( 'setFeatureRelevancyVote', () => {
		let dismissedItems: string[];

		beforeEach( () => {
			dismissedItems = [ 'unrelated-item' ];
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [ ...dismissedItems ] );

			fetchMock.post( dismissedItemsEndpoint, ( _url, { body } ) => {
				const { slugs } = JSON.parse( body as string ).data;
				dismissedItems = dismissedItems.filter(
					( slug ) => ! slugs.includes( slug )
				);
				return { body: [ ...dismissedItems ] };
			} );

			fetchMock.post( dismissItemEndpoint, ( _url, { body } ) => {
				const { slug } = JSON.parse( body as string ).data;
				dismissedItems = [ ...dismissedItems, slug ];
				return { body: [ ...dismissedItems ] };
			} );
		} );

		it.each< VoteDirection >( [ VOTE_DIRECTION_UP, VOTE_DIRECTION_DOWN ] )(
			'should replace the opposite vote with %s and preserve other dismissed items',
			async ( direction ) => {
				const opposite =
					direction === VOTE_DIRECTION_UP
						? VOTE_DIRECTION_DOWN
						: VOTE_DIRECTION_UP;

				dismissedItems.push(
					`feature-discovery-relevancy-feature-${ opposite }`
				);

				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ ...dismissedItems ] );

				await registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.setFeatureRelevancyVote( 'feature', direction );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeatureRelevancyVote( 'feature' )
				).toBe( direction );

				expect( dismissedItems ).toEqual( [
					'unrelated-item',
					`feature-discovery-relevancy-feature-${ direction }`,
				] );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: `feature-discovery-relevancy-feature-${ direction }`,
							expiration: 0,
						},
					},
				} );
			}
		);

		it( 'should wait for the initial dismissed items request before saving a vote', async () => {
			registry = createTestRegistry() as Registry;

			let resolveItems!: ( items: string[] ) => void;

			const response = new Promise< string[] >( ( resolve ) => {
				resolveItems = resolve;
			} );

			fetchMock.getOnce( dismissedItemsEndpoint, response );

			registry
				.select( CORE_FEATURE_DISCOVERY )
				.getFeatureRelevancyVote( 'feature' );

			const pendingVote = registry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.setFeatureRelevancyVote( 'feature', VOTE_DIRECTION_DOWN );

			await Promise.resolve();

			expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
			expect( fetchMock ).not.toHaveFetched( dismissedItemsEndpoint, {
				method: 'POST',
			} );

			resolveItems( [ 'feature-discovery-relevancy-feature-up' ] );

			await pendingVote;

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureRelevancyVote( 'feature' )
			).toBe( VOTE_DIRECTION_DOWN );
		} );

		it( 'should save rapid votes in order and retain votes for other features', async () => {
			const { setFeatureRelevancyVote } = registry.dispatch(
				CORE_FEATURE_DISCOVERY
			);

			await Promise.all( [
				setFeatureRelevancyVote( 'feature', VOTE_DIRECTION_UP ),
				setFeatureRelevancyVote( 'another-feature', VOTE_DIRECTION_UP ),
				setFeatureRelevancyVote( 'feature', VOTE_DIRECTION_DOWN ),
			] );

			expect( dismissedItems ).toEqual( [
				'unrelated-item',
				'feature-discovery-relevancy-another-feature-up',
				'feature-discovery-relevancy-feature-down',
			] );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureRelevancyVote( 'feature' )
			).toBe( VOTE_DIRECTION_DOWN );
		} );

		it( 'should return a removal error without adding a conflicting vote and allow a subsequent vote', async () => {
			const error = {
				code: 'test_error',
				message: 'Unable to remove vote.',
			};

			jest.spyOn(
				registry.dispatch( CORE_USER ),
				'removeDismissedItems'
			).mockResolvedValueOnce( { error } );

			expect(
				await registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.setFeatureRelevancyVote( 'feature', VOTE_DIRECTION_UP )
			).toEqual( { error } );

			expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );

			await registry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.setFeatureRelevancyVote( 'feature', VOTE_DIRECTION_DOWN );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureRelevancyVote( 'feature' )
			).toBe( VOTE_DIRECTION_DOWN );
		} );
	} );
} );
