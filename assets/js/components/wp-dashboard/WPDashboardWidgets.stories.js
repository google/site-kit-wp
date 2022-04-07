/**
 * WP Dashboard Widgets Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import WPDashboardWidgets from './WPDashboardWidgets';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideModules,
	provideSiteInfo,
	provideModuleRegistrations,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { provideSearchConsoleMockReport } from '../../modules/search-console/util/data-mock';
import { provideAnalyticsMockReport } from '../../modules/analytics/util/data-mock';

const searchConsoleArgs = {
	startDate: '2021-08-18',
	endDate: '2021-10-12',
	dimensions: 'date',
};

const analyticsArgs = [
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
			'ga:bounceRate',
		],
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		dimensions: 'ga:date',
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
			'ga:bounceRate',
		],
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:channelGrouping' ],
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:date' ],
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	},
	{
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:users',
			},
		],
		startDate: '2021-09-15',
		endDate: '2021-10-12',
	},
];

const Template = ( { setupRegistry } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<div id="google_dashboard_widget" style={ { maxWidth: '600px' } }>
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<WPDashboardWidgets />
				</div>
			</div>
		</div>
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		for ( const options of analyticsArgs ) {
			provideAnalyticsMockReport( registry, options );
		}

		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};

export const ReadyWithActivateModuleCTA = Template.bind( {} );
ReadyWithActivateModuleCTA.storyName = 'Ready with Activate Module CTA';
ReadyWithActivateModuleCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: false,
				connected: false,
				slug: 'analytics',
			},
		] );

		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};

export const ReadyWithActivateAnalyticsCTA = Template.bind( {} );
ReadyWithActivateAnalyticsCTA.storyName = 'Ready with Activate Analytics CTA';
ReadyWithActivateAnalyticsCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: false,
				connected: false,
				slug: 'analytics',
			},
		] );

		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};
ReadyWithActivateAnalyticsCTA.parameters = {
	features: [ 'zeroDataStates' ],
};
ReadyWithActivateAnalyticsCTA.scenario = {
	label:
		'Views/WPDashboardApp/WPDashboardWidgets/ReadyWithActivateAnalyticsCTA',
	delay: 3000,
};

export const ReadyWithCompleteAnalyticsActivationCTA = Template.bind( {} );
ReadyWithCompleteAnalyticsActivationCTA.storyName =
	'Ready with Complete Analytics Activation CTA';
ReadyWithCompleteAnalyticsActivationCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: false,
				slug: 'analytics',
			},
		] );
		provideModuleRegistrations( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};
ReadyWithCompleteAnalyticsActivationCTA.parameters = {
	features: [ 'zeroDataStates' ],
};
ReadyWithCompleteAnalyticsActivationCTA.scenario = {
	label:
		'Views/WPDashboardApp/WPDashboardWidgets/ReadyWithCompleteAnalyticsActivationCTA',
	delay: 3000,
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardWidgets',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				registry.dispatch( CORE_USER ).setReferenceDate( '2021-10-13' );
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					needsReauthentication: false,
				} );

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
