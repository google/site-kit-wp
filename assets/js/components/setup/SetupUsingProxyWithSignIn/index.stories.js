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
import SetupUsingProxyWithSignIn from '../SetupUsingProxyWithSignIn';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
	PERMISSION_READ_SHARED_MODULE_DATA,
	PERMISSION_AUTHENTICATE,
} from '../../../googlesitekit/datastore/user/constants';
import {
	provideSiteConnection,
	provideUserAuthentication,
	provideModules,
	provideUserCapabilities,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { getMetaCapabilityPropertyName } from '../../../googlesitekit/datastore/util/permissions';
import { Provider as ViewContextProvider } from '../../Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../googlesitekit/constants';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<SetupUsingProxyWithSignIn />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	},
};

export const DefaultWithStagingEnvironmentWarning = Template.bind( {} );
DefaultWithStagingEnvironmentWarning.storyName =
	'Default - Staging environment warning';
DefaultWithStagingEnvironmentWarning.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	},
};

export const DefaultWithDashboardSharing = Template.bind( {} );
DefaultWithDashboardSharing.storyName =
	'Default - with Dashboard Sharing enabled and available';
DefaultWithDashboardSharing.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: true,
			hasMultipleAdmins: true,
		} );

		const commonModuleCapabilities = {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				'search-console'
			) ]: true,
		};
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: true,
			...commonModuleCapabilities,
		} );

		provideModules( registry, [
			{ slug: 'search-console', active: true, connected: true },
		] );
	},
};

export const DefaultWithDashboardSharingOneAdmin = Template.bind( {} );
DefaultWithDashboardSharingOneAdmin.storyName =
	'Default - with Dashboard Sharing enabled and available but there is only one admin';
DefaultWithDashboardSharingOneAdmin.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: true,
			hasMultipleAdmins: false,
		} );

		const commonModuleCapabilities = {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				'search-console'
			) ]: true,
		};
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: true,
			...commonModuleCapabilities,
		} );

		provideModules( registry, [
			{ slug: 'search-console', active: true, connected: true },
		] );
	},
};

export const Connected = Template.bind( {} );
Connected.storyName = 'Connected';
Connected.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: true,
		} );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	},
};

export const DisconnectedURLChanged = Template.bind( {} );
DisconnectedURLChanged.storyName = 'Disconnected - URL changed';
DisconnectedURLChanged.args = {
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

export const RevokedAccess = Template.bind( {} );
RevokedAccess.storyName = 'Revoked access';
RevokedAccess.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry );
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	},
};
RevokedAccess.parameters = {
	query: {
		googlesitekit_context: 'revoked',
	},
};

export const ResetSuccess = Template.bind( {} );
ResetSuccess.storyName = 'Reset success';
ResetSuccess.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry );
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: false,
		} );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	},
};
ResetSuccess.parameters = {
	query: {
		googlesitekit_context: '',
		notification: 'reset_success',
	},
};

export default {
	title: 'Setup / Using Proxy With Sign-in',
	decorators: [
		withQuery,
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
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
	parameters: {
		padding: 0,
		query: { googlesitekit_context: '', notification: '' },
	},
};
