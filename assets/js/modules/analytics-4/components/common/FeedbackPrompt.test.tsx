/**
 * FeedbackPrompt component tests.
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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import * as tracking from '@/js/util/tracking';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeedbackPrompt from './FeedbackPrompt';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'FeedbackPrompt', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should render the "Is this section helpful?" question with the thumbs up and down buttons', () => {
		const { getByText, getByRole } = render(
			<FeedbackPrompt
				voteID="test_vote"
				gaTrackingEventArgs={ {
					category: 'test-feedback-survey',
					label: 'test-label',
				} }
			/>,
			{ registry }
		);

		expect( getByText( 'Is this section helpful?' ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'vote_up', 'Yes, this was helpful', 'up' ],
		[ 'vote_down', 'No, this was not helpful', 'down' ],
	] )(
		'should track `%s` with the provided category and label, and trigger the survey, when "%s" is clicked',
		async ( action, buttonName, direction ) => {
			fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

			const { getByRole } = render(
				<FeedbackPrompt
					voteID="test_vote"
					gaTrackingEventArgs={ {
						category: 'test-feedback-survey',
						label: 'test-label',
					} }
				/>,
				{ registry }
			);

			fireEvent.click( getByRole( 'button', { name: buttonName } ) );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'test-feedback-survey',
				action,
				'test-label'
			);

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: {
							triggerID: `vote:test_vote:${ direction }`,
						},
					},
				} )
			);
		}
	);
} );
