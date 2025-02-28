/**
 * AdsModuleSetupCTABanner Component Stories.
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
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import AdsModuleSetupCTABanner from './AdsModuleSetupCTABanner';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps = withNotificationComponentProps(
	'ads-setup-cta'
)( AdsModuleSetupCTABanner );

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

export const WithAdBlockerDetected = Template.bind( {} );
WithAdBlockerDetected.storyName = 'With Ad Blocker Detected';
WithAdBlockerDetected.args = {
	setupRegistry: ( registry ) => {
		provideModuleRegistrations( registry );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
	},
};
WithAdBlockerDetected.scenario = {};

export default {
	title: 'Modules/Ads/Components/Dashboard/AdsModuleSetupCTABanner',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'ads',
						active: false,
					},
				] );

				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getDismissedPrompts', [] );

				args?.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
