/**
 * DashboardViewIndicator Component Stories.
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
import DashboardViewIndicator from './DashboardViewIndicator';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	WithTestRegistry,
} from '../../../tests/js/utils';
import {
	DASHBOARD_VIEW_GA4,
	DASHBOARD_VIEW_UA,
	MODULES_ANALYTICS,
} from '../modules/analytics/datastore/constants';

const Template = ( { ...args } ) => <DashboardViewIndicator { ...args } />;

export const DashboardViewIndicatorUAView = Template.bind( {} );
DashboardViewIndicatorUAView.storyName = 'Universal Analytics View';
DashboardViewIndicatorUAView.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {
			dashboardView: DASHBOARD_VIEW_UA,
		} );
	},
};
DashboardViewIndicatorUAView.scenario = {
	label: 'Components/DashboardViewIndicator/DashboardViewIndicatorUAView',
};

export const DashboardViewIndicatorGA4View = Template.bind( {} );
DashboardViewIndicatorGA4View.storyName = 'Google Analytics 4 View';
DashboardViewIndicatorGA4View.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {
			dashboardView: DASHBOARD_VIEW_GA4,
		} );
	},
};
DashboardViewIndicatorGA4View.scenario = {
	label: 'Components/DashboardViewIndicator/DashboardViewIndicatorGA4View',
};

export default {
	title: 'Components/DashboardViewIndicator',
	component: DashboardViewIndicator,
	decorators: [
		( Story, { args } ) => {
			const registry = createTestRegistry();
			provideSiteInfo( registry );
			provideModules( registry, [
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			args.setupRegistry?.( registry );

			return (
				<WithTestRegistry
					registry={ registry }
					features={ [ 'ga4Reporting' ] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
	parameters: { features: [ 'ga4Reporting' ] },
};
