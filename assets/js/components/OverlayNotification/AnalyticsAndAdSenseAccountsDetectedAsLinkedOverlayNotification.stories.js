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
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification, {
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
} from './AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps = withNotificationComponentProps(
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
)( AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName =
	'AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
Default.scenario = {};

export default {
	title: 'Components/AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification',
};
