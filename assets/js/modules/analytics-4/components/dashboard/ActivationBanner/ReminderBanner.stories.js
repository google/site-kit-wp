/**
 * ReminderBanner Component Stories.
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
import ReminderBanner from './ReminderBanner';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';

const Template = () => <ReminderBanner onCTAClick={ () => {} } />;

export const InitialNotice = Template.bind( {} );
InitialNotice.storyName = 'Before 1 June 2023';
InitialNotice.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2023-05-31' );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const LastMonth = Template.bind( {} );
LastMonth.storyName = 'During June 2023';
LastMonth.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2023-06-01' );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const PostCutoff = Template.bind( {} );
PostCutoff.storyName = 'After 30 June 2023';
PostCutoff.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2023-07-01' );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Analytics4/ReminderBanner',
};
