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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import ReminderBanner from './ReminderBanner';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserInfo,
} from '../../../../../../../tests/js/utils';

function Template() {
	return <ReminderBanner onSubmitSuccess={ () => {} } />;
}

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

export const InitialNoticeWithoutAccess = Template.bind( {} );
InitialNoticeWithoutAccess.storyName = 'Before 1 June 2023 - Without Access';
InitialNoticeWithoutAccess.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2023-05-31' );
			provideUserInfo( registry, { id: 2 } );
			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/modules/data/check-access'
				),
				{ body: { access: false } }
			);
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
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetSettings( { ownerID: 1 } );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
