/**
 * GatheringDataNotification Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { provideModules } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import GatheringDataNotification from './GatheringDataNotification';

const NotificationWithComponentProps = withNotificationComponentProps(
	'gathering-data-notification'
)( GatheringDataNotification );

function Template( { setupRegistry } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<NotificationWithComponentProps />
		</WithRegistrySetup>
	);
}

export const AnalyticsGatheringData = Template.bind( {} );
AnalyticsGatheringData.storyName = 'Analytics Gathering Data';
AnalyticsGatheringData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
	},
};

export const SearchConsoleGatheringData = Template.bind( {} );
SearchConsoleGatheringData.storyName = 'Search Console Gathering Data';
SearchConsoleGatheringData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	},
};

export const SearchConsoleAndAnalyticsGatheringData = Template.bind( {} );
SearchConsoleAndAnalyticsGatheringData.storyName =
	'Search Console And Analytics Gathering Data';
SearchConsoleAndAnalyticsGatheringData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( true );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
	},
};

export default {
	title: 'Components/Notifications/Banners/GatheringDataNotification',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'search-console',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
