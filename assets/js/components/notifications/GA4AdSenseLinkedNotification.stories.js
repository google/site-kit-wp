/**
 * GA4AdSenseLinkedNotification Component Stories.
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
import { Provider as ViewContextProvider } from '../../components/Root/ViewContextContext';
import GA4AdSenseLinkedNotification from './GA4AdSenseLinkedNotification';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { getDateString } from '../../util';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

// Generate referenced dates.
const today = new Date();

const endDate = new Date( today );
endDate.setDate( endDate.getDate() - 1 );

const startDate = new Date( today );
startDate.setDate( startDate.getDate() - 28 );

const reportOptions = {
	startDate: getDateString( startDate ),
	endDate: getDateString( endDate ),
	dimensions: [ 'pagePath' ],
	metrics: [ { name: 'totalAdRevenue' } ],
	orderby: [
		{
			metric: { metricName: 'totalAdRevenue' },
			desc: true,
		},
	],
	limit: 3,
};

const NotificationWithComponentProps = withNotificationComponentProps(
	'top-earning-pages-success-notification'
)( GA4AdSenseLinkedNotification );

function Template( { viewContext } ) {
	return (
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<NotificationWithComponentProps />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'GA4AdSenseLinkedNotification';
Default.args = {
	setupRegistry: ( registry ) => {
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
		provideUserAuthentication( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rowCount: null,
			},
			{
				options: reportOptions,
			}
		);
	},
};
Default.scenario = {
	label: 'Global/SubtleNotifications/GA4AdSenseLinkedNotification',
};

export default {
	title: 'Components/Notifications/Subtle/GA4AdSenseLinkedNotification',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
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
