/**
 * Ads EnhancedConversionsNotification component stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import EnhancedConversionsNotification, {
	ENHANCED_CONVERSIONS_NOTIFICATION_ADS,
} from './EnhancedConversionsNotification';

const NotificationWithComponentProps = withNotificationComponentProps(
	ENHANCED_CONVERSIONS_NOTIFICATION_ADS
)( EnhancedConversionsNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Ads = Template.bind( {} );
Ads.storyName = 'Ads';

export default {
	title: 'Components/Notifications/Subtle/EnhancedConversionsNotification',
	component: EnhancedConversionsNotification,
};
