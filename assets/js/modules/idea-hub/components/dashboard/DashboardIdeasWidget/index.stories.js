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
import { STORE_NAME } from '../../../datastore/constants';
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
const bootstrapRegistry = () => {
	const registry = createTestRegistry();
	provideModules( registry, [ {
		slug: 'idea-hub',
		active: true,
		connected: true,
	} ] );

	return registry;
};
const Template = ( { ...args } ) => <DashboardIdeasWidget { ...widgetComponentProps } { ...args } />;

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.decorators = [
	( Story ) => {
		mockEndpoints();

		return <Story />;
	},
];

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const option = {
				offset: 0,
				length: 4,
			};
			registry.dispatch( STORE_NAME ).receiveGetNewIdeas( [], { options: option } );
			registry.dispatch( STORE_NAME ).startResolution( 'getNewIdeas', [ option ] );
		};

		mockEndpoints();
		enabledFeatures.clear();
		enabledFeatures.add( 'ideaHubModule' );

		const registry = bootstrapRegistry();
		return (
			<WithTestRegistry registry={ registry } callback={ setupRegistry }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: offset.',
				data: {},
			};
			const option = {
				offset: 0,
				length: 4,
			};

			registry.dispatch( STORE_NAME ).receiveError( error, 'getNewIdeas', [ option ] );
			registry.dispatch( STORE_NAME ).finishResolution( 'getNewIdeas', [ option ] );
		};

		enabledFeatures.clear();
		enabledFeatures.add( 'ideaHubModule' );
		mockEndpoints();

		const registry = bootstrapRegistry();
		return (
			<WithTestRegistry registry={ registry } callback={ setupRegistry }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export const DataUnavailableNew = Template.bind( {} );
DataUnavailableNew.storyName = 'Data Unavailable: New';
DataUnavailableNew.decorators = [
	( Story ) => {
		mockEndpoints( { newIdeas: [] } );

		return <Story />;
	},
];

export const DataUnavailableSaved = Template.bind( {} );
DataUnavailableSaved.storyName = 'Data Unavailable: Saved';
DataUnavailableSaved.decorators = [
	( Story ) => {
		mockEndpoints( { savedIdeas: [] } );

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
		mockEndpoints( { draftPostIdeas: [] } );

		return <Story />;
	},
];
DataUnavailableDrafts.args = {
	defaultActiveTabIndex: 2,
};

export const DataUnavailableAll = Template.bind( {} );
DataUnavailableAll.storyName = 'Data Unavailable: All';
DataUnavailableAll.decorators = [
	( Story ) => {
		mockEndpoints( {
			draftPostIdeas: [],
			newIdeas: [],
			savedIdeas: [],
		} );

		return <Story />;
	},
];

export default {
	title: 'Modules/Idea Hub/Widgets/DashboardIdeasWidget',
	component: DashboardIdeasWidget,
	decorators: [
		( Story ) => {
			API.setUsingCache( false );

			enabledFeatures.clear();
			enabledFeatures.add( 'ideaHubModule' );

			const registry = bootstrapRegistry();

			return (
				<WithTestRegistry registry={ registry } features={ [ 'ideaHubModule' ] }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
