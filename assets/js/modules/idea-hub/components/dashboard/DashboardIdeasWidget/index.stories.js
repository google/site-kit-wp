/**
 * DashboardIdeasWidget Component Stories.
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
import DashboardIdeasWidget from './index';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util/';
import { createTestRegistry, WithTestRegistry, provideModules } from '../../../../../../../tests/js/utils';
import { enabledFeatures } from '../../../../../features';
import * as fixtures from '../../../datastore/__fixtures__';

const widgetComponentProps = getWidgetComponentProps( 'ideaHubIdeas' );
const Template = ( { ...args } ) => <DashboardIdeasWidget { ...widgetComponentProps } { ...args } />;

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.decorators = [
	( Story ) => {
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
			{ body: fixtures.newIdeas, status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
			{ body: fixtures.savedIdeas, status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
			{ body: fixtures.draftPostIdeas, status: 200 }
		);

		return <Story />;
	},
];

export const DataUnavailableNew = Template.bind( {} );
DataUnavailableNew.storyName = 'Data Unavailable: New';
DataUnavailableNew.decorators = [
	( Story ) => {
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
			{ body: [], status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
			{ body: fixtures.savedIdeas, status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
			{ body: fixtures.draftPostIdeas, status: 200 }
		);

		return <Story />;
	},
];

export const DataUnavailableSaved = Template.bind( {} );
DataUnavailableSaved.storyName = 'Data Unavailable: Saved';
DataUnavailableSaved.decorators = [
	( Story ) => {
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
			{ body: fixtures.newIdeas, status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
			{ body: [], status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
			{ body: fixtures.draftPostIdeas, status: 200 }
		);

		return <Story />;
	},
];
DataUnavailableSaved.args = {
	defaultActiveTabIndex: 1,
};

export const DataUnavailableDrafts = Template.bind( {} );
DataUnavailableDrafts.storyName = 'Data Unavailable: Drafts';
DataUnavailableDrafts.decorators = [
	( Story ) => {
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
			{ body: fixtures.newIdeas, status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
			{ body: fixtures.savedIdeas, status: 200 }
		);
		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
			{ body: [], status: 200 }
		);

		return <Story />;
	},
];
DataUnavailableDrafts.args = {
	defaultActiveTabIndex: 2,
};

export default {
	title: 'Modules/Idea Hub/Widgets/DashboardIdeasWidget',
	component: DashboardIdeasWidget,
	decorators: [
		( Story ) => {
			API.setUsingCache( false );
			fetchMock.reset();

			enabledFeatures.clear();
			enabledFeatures.add( 'ideaHubModule' );

			const registry = createTestRegistry();
			provideModules( registry, [ {
				slug: 'idea-hub',
				active: true,
				connected: true,
			} ] );

			return (
				<WithTestRegistry registry={ registry } features={ [ 'ideaHubModule' ] }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
