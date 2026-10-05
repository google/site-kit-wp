/**
 * FeatureThumbsSurveyTrigger tests.
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
import { VoteDirection } from '@/js/components/surveys/ThumbsSurveyTrigger';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureThumbsSurveyTrigger from './FeatureThumbsSurveyTrigger';

describe( 'FeatureThumbsSurveyTrigger', () => {
	let registry: Registry;
	let setFeatureRelevancyVote: jest.SpyInstance;
	let triggerSurvey: jest.SpyInstance;

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

		triggerSurvey = jest
			.spyOn( registry.dispatch( CORE_USER ), 'triggerSurvey' )
			.mockResolvedValue( {} );
	} );

	it( 'should allow voting while the feature vote is loading', () => {
		jest.spyOn(
			registry.select( CORE_FEATURE_DISCOVERY ),
			'getFeatureRelevancyVote'
		).mockReturnValue( undefined );

		const { getByRole } = render(
			<FeatureThumbsSurveyTrigger slug="first" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', {
				name: 'Yes, this was helpful',
				pressed: false,
			} )
		);

		expect( setFeatureRelevancyVote ).toHaveBeenCalledWith( 'first', 'up' );
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
				<FeatureThumbsSurveyTrigger slug="first" />,
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
		'should save the %s vote and use the feature survey ID',
		( direction ) => {
			const { getByRole } = render(
				<FeatureThumbsSurveyTrigger slug="first" />,
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

			expect( triggerSurvey ).toHaveBeenCalledWith(
				`vote:feature_relevancy_first:${ direction }`
			);
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
				<FeatureThumbsSurveyTrigger slug="first" />,
				{ registry }
			);

			fireEvent.click(
				getByRole( 'button', { name: 'No, this was not helpful' } )
			);

			fireEvent.click( getByRole( 'menuitem', { name: label } ) );

			await waitFor( () =>
				expect( triggerSurvey ).toHaveBeenCalledWith(
					`feedback:feature_relevancy_first:${ reason }`
				)
			);
		}
	);
} );
