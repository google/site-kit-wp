/**
 * NewVisitorsWidget Component Stories.
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
import { provideModules } from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import NewVisitorsWidget from './NewVisitorsWidget';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { provideAnalytics4MockReport } from '../../utils/data-mock';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

const reportOptions = {
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'newVsReturning' ],
	metrics: [
		{
			name: 'activeUsers',
		},
	],
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'kmAnalyticsNewVisitors'
)( NewVisitorsWidget );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Ready.scenario = {
	label: 'Components/KeyMetrics/Widgets/NewVisitorsWidget',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
	},
};

export default {
	title: 'Components/KeyMetrics/WidgetTiles/NewVisitors',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = false;
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

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
