/**
 * TopAuthorsGoalDriver component stories.
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
import { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import TopAuthorsGoalDriver from './TopAuthorsGoalDriver';
import { GoalDriverComponentProps } from './types';

interface TopAuthorsGoalDriverStoryProps extends GoalDriverComponentProps {
	setupRegistry?: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => Promise< void > | void;
}

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles/TopAuthors',
	component: TopAuthorsGoalDriver,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: TopAuthorsGoalDriverStoryProps }
		) => {
			const wrappedStory = (
				<div className="googlesitekit-widget">
					<div className="googlesitekit-widget__body">
						<StoryComponent />
					</div>
				</div>
			);

			if ( ! args.setupRegistry ) {
				return wrappedStory;
			}

			return (
				<WithRegistrySetup func={ args.setupRegistry }>
					{ wrappedStory }
				</WithRegistrySetup>
			);
		},
	],
};

function setupAnalytics4(
	registry: Parameters< typeof provideModules >[ 0 ],
	availableCustomDimensions: string[] = [ 'googlesitekit_post_author' ]
) {
	provideUserAuthentication( registry );
	provideUserCapabilities( registry );
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );

	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
		propertyID: '12345',
		availableCustomDimensions,
	} );
}

function Template( props: TopAuthorsGoalDriverStoryProps ) {
	return <TopAuthorsGoalDriver { ...props } />;
}

export const Ready = Template.bind(
	{}
) as Story< TopAuthorsGoalDriverStoryProps >;
Ready.args = {
	goalType: 'ecommerce',
	title: 'Top authors driving sales',
	rows: [
		{ label: 'AuthorName1', value: '30.5%' },
		{ label: 'AuthorName2', value: '24.7%' },
		{ label: 'AuthorName3', value: '16.2%' },
	],
	loading: false,
	limit: 3,
};
Ready.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< TopAuthorsGoalDriverStoryProps >;
Loading.args = {
	...Ready.args,
	rows: [],
	loading: true,
};

export const MissingCustomDimensions = Template.bind(
	{}
) as Story< TopAuthorsGoalDriverStoryProps >;
MissingCustomDimensions.storyName = 'Missing custom dimensions';
MissingCustomDimensions.args = {
	goalType: 'ecommerce',
	title: 'Top authors driving sales',
	rows: [],
	loading: false,
	limit: 3,
	setupRegistry: ( registry ) => {
		setupAnalytics4( registry, [] );
	},
};
