/**
 * AudienceSegmentationSetupCTABanner Component Stories.
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
} from '../../../../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../../constants';
import { getAnalytics4MockResponse } from '../../../utils/data-mock';
import AudienceSegmentationSetupCTABanner, {
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
} from './AudienceSegmentationSetupCTABanner';
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';
import { CORE_NOTIFICATIONS } from '../../../../../googlesitekit/notifications/datastore/constants';
import { ANALYTICS_4_NOTIFICATIONS } from '../../..';

const NotificationWithComponentProps = withNotificationComponentProps(
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
)( AudienceSegmentationSetupCTABanner );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	},
};
Default.scenario = {};

export const DismissedOnce = Template.bind( {} );
DismissedOnce.storyName = 'Dismissed Once';
DismissedOnce.args = {
	setupRegistry: ( registry ) => {
		const notification =
			ANALYTICS_4_NOTIFICATIONS[
				AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
			];

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
				notification
			);

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
				expires: 1000,
				count: 1,
			},
		} );
	},
};
DismissedOnce.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationSetupCTATile',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = false;

				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
				] );
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						audienceSegmentationSetupCompletedBy: null,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsDataAvailableOnLoad( true );

				const referenceDate = '2024-05-10';
				const startDate = '2024-02-09'; // 91 days before `referenceDate`.

				registry
					.dispatch( CORE_USER )
					.setReferenceDate( referenceDate );

				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: null,
					isAudienceSegmentationWidgetHidden: false,
				} );

				const options = {
					metrics: [ { name: 'totalUsers' } ],
					startDate,
					endDate: referenceDate,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( getAnalytics4MockResponse( options ), {
						options,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ options ] );

				args?.setupRegistry( registry );

				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getDismissedPrompts', [] );
			};

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div style={ { flex: 1 } }>
						<WithRegistrySetup func={ setupRegistry }>
							<Story />
						</WithRegistrySetup>
					</div>
				</div>
			);
		},
	],
};
