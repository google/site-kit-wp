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
import { provideModules } from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../../components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '../../../../../googlesitekit/constants';
import {
	MODULES_IDEA_HUB,
	IDEA_HUB_ACTIVITY_CREATING_DRAFT,
	IDEA_HUB_ACTIVITY_IS_DELETING,
	IDEA_HUB_ACTIVITY_IS_PINNING,
	IDEA_HUB_ACTIVITY_DRAFT_CREATED,
	IDEA_HUB_ACTIVITY_DELETED,
	IDEA_HUB_ACTIVITY_PINNED,
	IDEA_HUB_ACTIVITY_UNPINNED,
} from '../../../datastore/constants';
import {
	newIdeas,
	savedIdeas,
	draftPostIdeas,
} from '../../../datastore/__fixtures__';

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
const Template = ( { viewContext, ...args } ) => (
	<ViewContextProvider value={ viewContext }>
		<DashboardIdeasWidget { ...widgetComponentProps } { ...args } />
	</ViewContextProvider>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_IDEA_HUB ).receiveGetNewIdeas( [], {} );
		registry
			.dispatch( MODULES_IDEA_HUB )
			.startResolution( 'getNewIdeas', [] );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: offset.',
			data: {},
		};

		registry
			.dispatch( MODULES_IDEA_HUB )
			.receiveError( error, 'getNewIdeas', [] );
		registry
			.dispatch( MODULES_IDEA_HUB )
			.finishResolution( 'getNewIdeas', [] );
	},
};

export const StateError = Template.bind( {} );
StateError.storyName = 'StateError';
StateError.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'host_unreachable',
			message: 'You are probably offline.',
			data: {},
		};

		registry
			.dispatch( MODULES_IDEA_HUB )
			.receiveError( error, 'updateIdeaState', [ 'Placeholder Idea' ] );
	},
};

export const DataUnavailableNew = Template.bind( {} );
DataUnavailableNew.storyName = 'Data Unavailable: New';
DataUnavailableNew.args = {
	setupRegistry: () => {
		mockEndpoints( { newIdeas: [] } );
	},
};

export const DataUnavailableSaved = Template.bind( {} );
DataUnavailableSaved.storyName = 'Data Unavailable: Saved';
DataUnavailableSaved.args = {
	defaultActiveTabIndex: 1,
	setupRegistry: () => {
		mockEndpoints( { savedIdeas: [] } );
	},
};

export const DataUnavailableDrafts = Template.bind( {} );
DataUnavailableDrafts.storyName = 'Data Unavailable: Drafts';
DataUnavailableDrafts.args = {
	defaultActiveTabIndex: 2,
	setupRegistry: () => {
		mockEndpoints( { draftPostIdeas: [] } );
	},
};

export const DataUnavailableAll = Template.bind( {} );
DataUnavailableAll.storyName = 'Data Unavailable: All';
DataUnavailableAll.args = {
	setupRegistry: () => {
		mockEndpoints( {
			draftPostIdeas: [],
			newIdeas: [],
			savedIdeas: [],
		} );
	},
};

export const Activity = Template.bind( {} );
Activity.storyName = 'Activity In Progress';
Activity.args = {
	setupRegistry: ( registry ) => {
		const { setActivity } = registry.dispatch( MODULES_IDEA_HUB );

		setActivity(
			'ideas/17450692223393508734',
			IDEA_HUB_ACTIVITY_IS_DELETING
		);
		setActivity(
			'ideas/14025103994557865535',
			IDEA_HUB_ACTIVITY_IS_PINNING
		);
		setActivity(
			'ideas/7612031899179595408',
			IDEA_HUB_ACTIVITY_CREATING_DRAFT
		);
	},
};

export const ActivitiesDone = Template.bind( {} );
ActivitiesDone.storyName = 'Activities Done';
ActivitiesDone.args = {
	setupRegistry: ( registry ) => {
		const { setActivity } = registry.dispatch( MODULES_IDEA_HUB );

		setActivity( 'ideas/17450692223393508734', IDEA_HUB_ACTIVITY_DELETED );
		setActivity( 'ideas/14025103994557865535', IDEA_HUB_ACTIVITY_PINNED );
		setActivity(
			'ideas/7612031899179595408',
			IDEA_HUB_ACTIVITY_DRAFT_CREATED
		);
		setActivity( 'ideas/2285812891948871921', IDEA_HUB_ACTIVITY_UNPINNED );
	},
};

export const ViewOnlyDashboard = Template.bind( {} );
ViewOnlyDashboard.storyName = 'View Only Dashboard';
ViewOnlyDashboard.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export default {
	title: 'Modules/Idea Hub/Widgets/DashboardIdeasWidget',
	component: DashboardIdeasWidget,
	decorators: [
		( Story, { args } ) => {
			API.setUsingCache( false );
			mockEndpoints();

			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'idea-hub',
						active: true,
						connected: true,
					},
				] );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		features: [ 'ideaHubModule' ],
	},
};
