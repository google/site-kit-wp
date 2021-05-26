/**
 * Idea Hub notice component stories.
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
import WPDashboardIdeaHub from './WPDashboardIdeaHub';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideModules, provideSiteInfo } from '../../../../tests/js/utils';
import { savedIdeas } from '../../modules/idea-hub/datastore/__fixtures__';

const mockEndpoints = () => {
	fetchMock.reset();
	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
		{ body: savedIdeas }
	);
};

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WPDashboardIdeaHub { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Idea Hub notice';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry );
		provideModules( registry, [ {
			active: true,
			connected: true,
			slug: 'idea-hub',
		} ] );
	},
};
Ready.parameters = {
	features: [ 'ideaHubModule' ],
};

export default {
	title: 'Views/WPDashboardApp',
	decorators: [
		( Story ) => {
			mockEndpoints();
			return <Story />;
		},
	],
};
