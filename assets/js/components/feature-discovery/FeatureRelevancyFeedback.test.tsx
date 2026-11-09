/**
 * FeatureRelevancyFeedback tests.
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
import { VoteDirection } from '@/js/components/feedback/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureRelevancyFeedback from './FeatureRelevancyFeedback';

describe( 'FeatureRelevancyFeedback', () => {
	let registry: Registry;
	let setFeatureRelevancyVote: jest.SpyInstance;
	let sendFeedback: jest.SpyInstance;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		jest.spyOn(
			registry.select( CORE_FEATURE_DISCOVERY ),
			'getFeatureRelevancyVote'
		).mockReturnValue( null );

		setFeatureRelevancyVote = jest
			.spyOn(
				registry.dispatch( CORE_FEATURE_DISCOVERY ),
				'setFeatureRelevancyVote'
			)
			.mockResolvedValue( {} );

		sendFeedback = jest
			.spyOn( registry.dispatch( CORE_USER ), 'sendFeedback' )
			.mockResolvedValue( {} );
	} );

	it( 'should immediately select a vote while the feature vote is loading', () => {
		jest.spyOn(
			registry.select( CORE_FEATURE_DISCOVERY ),
			'getFeatureRelevancyVote'
		).mockReturnValue( undefined );

		const { getByRole } = render(
			<FeatureRelevancyFeedback slug="first" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', {
				name: 'Yes, this was helpful',
				pressed: false,
			} )
		);

		expect( setFeatureRelevancyVote ).toHaveBeenCalledWith( 'first', 'up' );

		expect(
			getByRole( 'button', {
				name: 'Yes, this was helpful',
				pressed: true,
			} )
		).toBeInTheDocument();
	} );

	it.each< VoteDirection >( [ 'up', 'down' ] )(
		'should use the feature’s saved %s vote',
		( direction ) => {
			const getFeatureRelevancyVote = jest
				.spyOn(
					registry.select( CORE_FEATURE_DISCOVERY ),
					'getFeatureRelevancyVote'
				)
				.mockReturnValue( direction );

			const { getByRole } = render(
				<FeatureRelevancyFeedback slug="first" />,
				{ registry }
			);

			expect( getFeatureRelevancyVote ).toHaveBeenCalledWith( 'first' );

			expect(
				getByRole( 'button', {
					name:
						direction === 'up'
							? 'Yes, this was helpful'
							: 'No, this was not helpful',
					pressed: true,
				} )
			).toBeInTheDocument();
		}
	);

	it.each< VoteDirection >( [ 'up', 'down' ] )(
		'should save the %s vote and send the feature’s feedback group',
		( direction ) => {
			const { getByRole } = render(
				<FeatureRelevancyFeedback slug="first" />,
				{ registry }
			);

			fireEvent.click(
				getByRole( 'button', {
					name:
						direction === 'up'
							? 'Yes, this was helpful'
							: 'No, this was not helpful',
				} )
			);

			expect( setFeatureRelevancyVote ).toHaveBeenCalledWith(
				'first',
				direction
			);

			expect( sendFeedback ).toHaveBeenCalledWith( {
				namespace: 'feature_hub',
				group: 'feature_relevancy_first',
				key: 'vote',
				value: direction,
			} );
		}
	);

	it.each( [
		[ 'It’s not relevant to my site goals', 'not_relevant' ],
		[ 'I’m already using another tool', 'already_using' ],
		[ 'Setup seems complex', 'too_complicated' ],
		[ 'Something else', 'something_else' ],
	] )(
		'should send the feature feedback for "%s"',
		async ( label, reason ) => {
			const { getByRole } = render(
				<FeatureRelevancyFeedback slug="first" />,
				{ registry }
			);

			fireEvent.click(
				getByRole( 'button', { name: 'No, this was not helpful' } )
			);

			fireEvent.click( getByRole( 'menuitem', { name: label } ) );

			await waitFor( () =>
				expect( sendFeedback ).toHaveBeenCalledWith( {
					namespace: 'feature_hub',
					group: 'feature_relevancy_first',
					key: 'vote_reason',
					value: reason,
				} )
			);
		}
	);
} );
