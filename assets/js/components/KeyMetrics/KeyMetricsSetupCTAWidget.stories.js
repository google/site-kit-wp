/**
 * KeyMetricsSetupCTAWidget Component Stories.
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
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { getSearchConsoleMockResponse } from '../../modules/search-console/util/data-mock';
import { getAnalytics4MockResponse } from '../../modules/analytics-4/utils/data-mock';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import KeyMetricsSetupCTAWidget from './KeyMetricsSetupCTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsSetupCTA'
)( KeyMetricsSetupCTAWidget );

const Template = () => <WidgetWithComponentProps />;

const searchConsoleReportOptions = {
	dimensions: 'date',
	startDate: '2020-07-14',
	endDate: '2020-09-07',
};

const analytics4ReportOptions = {
	dimensions: [ 'date' ],
	metrics: [ { name: 'totalUsers' } ],
	startDate: '2020-08-11',
	endDate: '2020-09-07',
};

export const Default = Template.bind( {} );
Default.storyName = 'SetupCTAWidget';
Default.scenario = {
	label: 'KeyMetrics/SetupCTAWidget',
	delay: 250,
};
Default.parameters = {
	features: [ 'userInput' ],
};

export default {
	title: 'Key Metrics',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = false;
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				// Provide reports to ensure "gathering data" is false for Analytics 4 and Search Console modules.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport(
						getAnalytics4MockResponse( analytics4ReportOptions ),
						{
							options: analytics4ReportOptions,
						}
					);
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetReport(
						getSearchConsoleMockResponse(
							searchConsoleReportOptions
						),
						{
							options: searchConsoleReportOptions,
						}
					);
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
