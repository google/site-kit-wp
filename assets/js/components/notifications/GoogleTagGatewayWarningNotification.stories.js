/**
 * GoogleTagGatewayWarningNotification Component Stories.
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
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import GoogleTagGatewayWarningNotification from './GoogleTagGatewayWarningNotification';
import { GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID } from '../../googlesitekit/notifications/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID
)( GoogleTagGatewayWarningNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind();
Default.storyName = 'GoogleTagGatewayWarningNotification';
Default.scenario = {};

export default {
	title: 'Modules/GoogleTagGateway/Dashboard/GoogleTagGatewayWarningNotification',
};
