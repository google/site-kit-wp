/**
 * ConversionReportingNotificationCTAWidget Component Stories.
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
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import ConversionReportingNotificationCTAWidget from './ConversionReportingNotificationCTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsSetupCTA'
)( ConversionReportingNotificationCTAWidget );

function Template() {
	return (
		<div className="googlesitekit-widget-area--mainDashboardKeyMetricsPrimary">
			<div className="googlesitekit-widget-area-widgets">
				<div className="googlesitekit-widget--keyMetricsEventDetectionCalloutNotification">
					<WidgetWithComponentProps />
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'ConversionReportingNotificationCTAWidget';
Default.parameters = {
	features: [ 'conversionReporting' ],
};
Default.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
};

export default {
	title: 'Key Metrics/ConversionReportingNotificationCTAWidget',
	decorators: [
		( Story, { parameters } ) => {
			const setupRegistry = async ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideUserAuthentication( registry );

				const data = {
					newEvents: [ 'contact' ],
					lostEvents: [],
					newBadgeEvents: [],
				};

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveModuleData( data );
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ 'contact' ] );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: {
						values: [ 'publish_blog' ],
						scope: 'site',
						answeredBy: 1,
					},
					includeConversionEvents: {
						values: [],
						scope: 'site',
					},
				} );

				registry
					.dispatch( CORE_USER )
					.receiveGetConversionReportingSettings( {
						newEventsCalloutDismissedAt: 0,
						lostEventsCalloutDismissedAt: 0,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setNewConversionEventsLastUpdateAt( 1734531413 );
			};

			return (
				<WithRegistrySetup
					func={ setupRegistry }
					features={ parameters.features || [] }
				>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
