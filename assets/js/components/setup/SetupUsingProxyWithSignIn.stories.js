/**
 * SetupUsingProxyWithSignIn Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import SetupUsingProxyWithSignIn from './SetupUsingProxyWithSignIn';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
	PERMISSION_VIEW_SHARED_DASHBOARD,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '../../googlesitekit/datastore/user/constants';
import {
	provideSiteConnection,
	provideUserAuthentication,
	provideModules,
	provideUserCapabilities,
} from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { getMetaCapabilityPropertyName } from '../../googlesitekit/datastore/util/permissions';

const Template = () => <SetupUsingProxyWithSignIn />;

export const Start = Template.bind( {} );
Start.storyName = 'Start';

export const StartWithError = Template.bind( {} );
StartWithError.storyName = 'Start – with error';
StartWithError.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			connected: false,
			hasConnectedAdmins: false,
		} );
	},
};

export const StartUserInput = Template.bind( {} );
StartUserInput.storyName = 'Start [User Input]';
StartUserInput.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	},
};
StartUserInput.parameters = {
	features: [ 'userInput' ],
};

export const StartUserInputError = Template.bind( {} );
StartUserInputError.storyName = 'Start – with error [User Input]';
StartUserInputError.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			connected: false,
			hasConnectedAdmins: false,
		} );
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	},
};
StartUserInputError.parameters = {
	features: [ 'userInput' ],
};

export const DisconnectedURLMismatch = Template.bind( {} );
DisconnectedURLMismatch.storyName = 'Disconnected - URL Mismatch';
DisconnectedURLMismatch.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, {
			authenticated: false,
			disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
		} );
	},
};

export const DisconnectedURLMismatchUserInput = Template.bind( {} );
DisconnectedURLMismatchUserInput.storyName =
	'Disconnected - URL Mismatch [User Input]';
DisconnectedURLMismatchUserInput.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, {
			authenticated: false,
			disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
		} );
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	},
};
DisconnectedURLMismatchUserInput.parameters = {
	features: [ 'userInput' ],
};

export const AnalyticsActive = Template.bind( {} );
AnalyticsActive.storyName = 'Start - with Analytics Active';
AnalyticsActive.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	},
};

export const AnalyticsInactive = Template.bind( {} );
AnalyticsInactive.storyName = 'Start - with Analytics Inactive';

export const SharedDashboardAdminCanView = Template.bind( {} );
SharedDashboardAdminCanView.storyName =
	'Start - with Dashboard Sharing enabled and available';
SharedDashboardAdminCanView.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: true,
			hasMultipleAdmins: true,
		} );

		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );

		provideUserCapabilities( registry, {
			[ PERMISSION_VIEW_SHARED_DASHBOARD ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				'analytics'
			) ]: true,
		} );
	},
};

export const SharedDashboardSingleAdminCanView = Template.bind( {} );
SharedDashboardSingleAdminCanView.storyName =
	'Start - with Dashboard Sharing enabled and available but there is only one admin';
SharedDashboardSingleAdminCanView.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: true,
			hasMultipleAdmins: false,
		} );

		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );

		provideUserCapabilities( registry, {
			[ PERMISSION_VIEW_SHARED_DASHBOARD ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				'analytics'
			) ]: true,
		} );
	},
};

export default {
	title: 'Setup / Using Proxy With Sign-in',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteConnection( registry, {
					hasConnectedAdmins: false,
				} );

				registry
					.dispatch( CORE_USER )
					.receiveGetTracking( { enabled: false } );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
