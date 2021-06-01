/**
 * CurrentSurvey Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import CurrentSurvey from './CurrentSurvey';
const { useDispatch } = Data;

const Template = ( args ) => <CurrentSurvey { ...args } />;

export const CurrentSurveyStory = Template.bind( {} );
CurrentSurveyStory.storyName = 'CurrentSurvey';

export default {
	title: 'Components/Surveys',
	decorators: [
		( Story ) => {
			const survey = {
				survey_payload: 'foo',
				session: 'bar',
			};
			fetchMock.reset();
			fetchMock.post(
				/^\/google-site-kit\/v1\/core\/user\/data\/survey-trigger/,
				{ body: survey, status: 200 }
			);

			const { triggerSurvey } = useDispatch( CORE_USER );
			const setupRegistry = async ( registry ) => {
				await API.invalidateCache();
				registry.dispatch( CORE_SITE ).receiveSiteInfo( { usingProxy: true } );

				await triggerSurvey( 'test-survey', { ttl: 1 } );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
