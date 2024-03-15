/**
 * AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification component stories.
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '../../modules/analytics-4/utils/data-mock';

import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification from './AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';

const adSenseAccountID = 'pub-1234567890';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'pagePath', 'adSourceName' ],
	metrics: [ { name: 'totalAdRevenue' } ],
	filter: {
		fieldName: 'adSourceName',
		stringFilter: {
			matchType: 'EXACT',
			value: `Google AdSense account (${ adSenseAccountID })`,
		},
	},
	orderby: [ { metric: { metricName: 'totalAdRevenue' }, desc: true } ],
	limit: 1,
};

function Template() {
	return <AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Components/AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification',
};

export default {
	title: 'Components/AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification',
	component: AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification,
	parameters: { features: [ 'ga4AdSenseIntegration' ] },
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
					{
						slug: 'adsense',
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					adSenseLinked: true,
				} );

				registry
					.dispatch( MODULES_ADSENSE )
					.setAccountID( adSenseAccountID );

				provideAnalytics4MockReport( registry, reportOptions );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
