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
 * Internal dependencies
 */
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import CurrentSurvey from './CurrentSurvey';

export const CurrentSurveyStory = () => <CurrentSurvey />;
CurrentSurveyStory.storyName = 'CurrentSurvey';

export default {
	title: 'Components/Surveys',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( { usingProxy: true } );

				// @TOO: populate user data store with survey data
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
