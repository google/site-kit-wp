/**
 * EnhancedMeasurementActivationBanner > SuccessBanner Component Stories.
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
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';
import SuccessBanner from './SuccessBanner';

const NotificationWithComponentProps = withNotificationComponentProps(
	'enhanced-measurement-notification'
)( SuccessBanner );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Modules/Analytics4/EnhancedMeasurementActivationBanner/SuccessBanner',
};
