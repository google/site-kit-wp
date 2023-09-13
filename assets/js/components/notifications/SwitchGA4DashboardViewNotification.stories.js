/**
 * SwitchGA4DashboardViewNotification Component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	DASHBOARD_VIEW_UA,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import SwitchGA4DashboardViewNotification from './SwitchGA4DashboardViewNotification';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	WithTestRegistry,
} from '../../../../tests/js/utils';

function Template( { ...args } ) {
	return <SwitchGA4DashboardViewNotification { ...args } />;
}

export const SwitchGA4DashboardViewNotificationDefault = Template.bind( {} );
SwitchGA4DashboardViewNotificationDefault.storyName = 'Default';

export default {
	title: 'Components/SwitchGA4DashboardViewNotification',
	component: SwitchGA4DashboardViewNotification,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideSiteInfo( registry );
			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( MODULES_ANALYTICS ).setSettings( {
				dashboardView: DASHBOARD_VIEW_UA,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( false );
			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
