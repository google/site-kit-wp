/**
 * SetupUsingProxyWithSignIn Component Stories.
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
 * External dependencies
 */
import { withQuery } from '@storybook/addon-queryparams';

/**
 * Internal dependencies
 */
import SetupUsingProxyWithSignIn from '@/js/components/setup/SetupUsingProxyWithSignIn';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
	PERMISSION_READ_SHARED_MODULE_DATA,
	PERMISSION_AUTHENTICATE,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	provideSiteConnection,
	provideUserAuthentication,
	provideModules,
	provideUserCapabilities,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<SetupUsingProxyWithSignIn />
		</ViewContextProvider>
	);
}

export const RefreshedSetupFlow = Template.bind( {} );
RefreshedSetupFlow.storyName = 'Refreshed setup flow';
RefreshedSetupFlow.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
	},
};

export const RefreshedSetupFlowStagingEnvironmentWarning = Template.bind( {} );
RefreshedSetupFlowStagingEnvironmentWarning.storyName =
	'Refreshed setup flow - Staging environment warning';
RefreshedSetupFlowStagingEnvironmentWarning.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
	},
};

export const RefreshedSetupFlowWithDashboardSharing = Template.bind( {} );
RefreshedSetupFlowWithDashboardSharing.storyName =
	'Refreshed setup flow - with Dashboard Sharing enabled and available';
RefreshedSetupFlowWithDashboardSharing.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: true,
			hasMultipleAdmins: true,
		} );

		const commonModuleCapabilities = {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
		};
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: true,
			...commonModuleCapabilities,
		} );

		provideModules( registry, [
			{ slug: MODULE_SLUG_SEARCH_CONSOLE, active: true, connected: true },
		] );
	},
};

export const RefreshedSetupFlowWithDashboardSharingOneAdmin = Template.bind(
	{}
);
RefreshedSetupFlowWithDashboardSharingOneAdmin.storyName =
	'Refreshed setup flow - with Dashboard Sharing enabled and available but there is only one admin';
RefreshedSetupFlowWithDashboardSharingOneAdmin.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: true,
			hasMultipleAdmins: false,
		} );

		const commonModuleCapabilities = {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
		};
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: true,
			...commonModuleCapabilities,
		} );

		provideModules( registry, [
			{ slug: MODULE_SLUG_SEARCH_CONSOLE, active: true, connected: true },
		] );
	},
};

export const RefreshedSetupFlowConnected = Template.bind( {} );
RefreshedSetupFlowConnected.storyName = 'Refreshed setup flow - Connected';
RefreshedSetupFlowConnected.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: true,
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
	},
};

export const RefreshedSetupFlowDisconnectedURLChanged = Template.bind( {} );
RefreshedSetupFlowDisconnectedURLChanged.storyName =
	'Refreshed setup flow - Disconnected - URL changed';
RefreshedSetupFlowDisconnectedURLChanged.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );
		provideUserAuthentication( registry, {
			authenticated: false,
			disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			connectedProxyURL: 'https://example.org',
		} );
	},
};

export const RefreshedSetupFlowRevokedAccess = Template.bind( {} );
RefreshedSetupFlowRevokedAccess.storyName =
	'Refreshed setup flow - Revoked access';
RefreshedSetupFlowRevokedAccess.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry );
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
	},
};
RefreshedSetupFlowRevokedAccess.parameters = {
	query: {
		googlesitekit_context: 'revoked',
	},
};

export const RefreshedSetupFlowResetSuccess = Template.bind( {} );
RefreshedSetupFlowResetSuccess.storyName =
	'Refreshed setup flow - Reset success';
RefreshedSetupFlowResetSuccess.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry );
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
	},
};
RefreshedSetupFlowResetSuccess.parameters = {
	query: {
		googlesitekit_context: '',
		notification: 'reset_success',
	},
};

export const RefreshedSetupFlowWithAnalyticsActive = Template.bind( {} );
RefreshedSetupFlowWithAnalyticsActive.storyName =
	'Refreshed setup flow - with Analytics active';
RefreshedSetupFlowWithAnalyticsActive.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );
	},
};

export default {
	title: 'Setup / Using Proxy With Sign-in and setupFlowRefresh enabled',
	decorators: [
		withQuery,
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				registry
					.dispatch( CORE_USER )
					.receiveGetTracking( { enabled: false } );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		padding: 0,
		query: { googlesitekit_context: '', notification: '' },
		features: [ 'setupFlowRefresh' ],
	},
};
