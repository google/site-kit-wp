/**
 * Idea Hub feature tour stories.
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
import { provideModules } from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { getWidgetComponentProps } from '../googlesitekit/widgets/util/get-widget-component-props';
import { DashboardIdeasWidget } from '../modules/idea-hub/components/dashboard/';
import {
	newIdeas,
	savedIdeas,
	draftPostIdeas,
} from '../modules/idea-hub/datastore/__fixtures__';

const widgetComponentProps = getWidgetComponentProps( 'ideaHubIdeas' );
const mockEndpoints = ( args ) => {
	fetchMock.reset();

	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
		{ body: args?.newIdeas || newIdeas, status: 200 }
	);
	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
		{ body: args?.savedIdeas || savedIdeas, status: 200 }
	);
	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
		{ body: args?.draftPostIdeas || draftPostIdeas, status: 200 }
	);
	fetchMock.post(
		/google-site-kit\/v1\/modules\/idea-hub\/data\/create-idea-draft-post/,
		{ body: {}, status: 200 }
	);
	fetchMock.post(
		/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
		( url, opts ) => {
			const { data } = JSON.parse( opts.body );

			return {
				status: 200,
				body: JSON.stringify( data ),
			};
		}
	);
};

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<DashboardIdeasWidget { ...widgetComponentProps } { ...args } />
	</WithRegistrySetup>
);

export const DefaultFeatureTour = Template.bind( null );
DefaultFeatureTour.storyName = 'Default';
DefaultFeatureTour.decorators = [
	( Story ) => {
		mockEndpoints();
		return <Story />;
	},
];
DefaultFeatureTour.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [ {
			active: true,
			connected: true,
			slug: 'idea-hub',
		} ] );
	},
};

export default {
	title: 'Modules/Idea Hub/Feature tour',
	parameters: {
		features: [ 'ideaHubModule' ],
	},
};
