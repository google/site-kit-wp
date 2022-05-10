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
import Data from 'googlesitekit-data';
import API from 'googlesitekit-api';
import Button from '../components/Button';
import TourTooltips from '../components/TourTooltips';
import ideaHubModuleFeatureTour from './idea-hub-module';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { MODULES_IDEA_HUB } from '../modules/idea-hub/datastore/constants';
import { provideModules } from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../googlesitekit/widgets/util/get-widget-component-props';
import { DashboardIdeasWidget } from '../modules/idea-hub/components/dashboard/';
import {
	newIdeas,
	savedIdeas,
	draftPostIdeas,
} from '../modules/idea-hub/datastore/__fixtures__';
const { useDispatch } = Data;

const mockEndpoints = ( args ) => {
	fetchMock.reset();

	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
		{ body: args?.newIdeas || newIdeas }
	);
	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
		{ body: args?.savedIdeas || savedIdeas }
	);
	fetchMock.get(
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
		{ body: args?.draftPostIdeas || draftPostIdeas }
	);
	fetchMock.post(
		/google-site-kit\/v1\/modules\/idea-hub\/data\/create-idea-draft-post/,
		{ body: {} }
	);
	fetchMock.post(
		/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
		( url, opts ) => {
			const { data } = JSON.parse( opts.body );

			return {
				body: JSON.stringify( data ),
			};
		}
	);
	fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/dismiss-tour/, {
		body: JSON.stringify( [ 'ideaHubModule' ] ),
	} );
};

const WidgetWithComponentProps = withWidgetComponentProps( 'idea-hub' )(
	DashboardIdeasWidget
);

const tourProps = {
	...ideaHubModuleFeatureTour,
	tourID: ideaHubModuleFeatureTour.slug,
};

const TourControls = () => {
	const { receiveGetDismissedTours } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );
	const reset = () => {
		receiveGetDismissedTours( [] );
		setValue( 'ideaHubModule-step', 0 );
	};

	return (
		<div style={ { textAlign: 'right', marginBottom: '10px' } }>
			<Button onClick={ reset }>Reset Tour</Button>
		</div>
	);
};

const Template = ( { ...args } ) => (
	<div>
		<TourControls />
		<WidgetWithComponentProps { ...args } />
		<TourTooltips { ...tourProps } />
	</div>
);

export const DefaultFeatureTour = Template.bind( null );
DefaultFeatureTour.storyName = 'Feature tour';

export default {
	title: 'Modules/Idea Hub',
	parameters: {
		features: [ 'ideaHubModule' ],
	},
	decorators: [
		( Story ) => {
			API.setUsingCache( false );
			mockEndpoints();

			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'idea-hub',
					},
				] );
				registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
				registry
					.dispatch( MODULES_IDEA_HUB )
					.receiveGetSettings( { tosAccepted: true } );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
