/**
 * ErrorNotifications Component Stories.
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
import ErrorNotifications from './ErrorNotifications';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { FORM_TEMPORARY_PERSIST_PERMISSION_ERROR } from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';

function Template( { ...args } ) {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<ErrorNotifications { ...args } />
		</ViewContextProvider>
	);
}

export const PluginSetupError = Template.bind( {} );
PluginSetupError.storyName = 'Plugin Setup Error - Redo the plugin setup';
PluginSetupError.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, {
			authenticated: false,
		} );

		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );
	},
};
PluginSetupError.scenario = {
	label: 'Global/ErrorNotifications/PluginSetupError',
};

export const PermissionError = Template.bind( {} );
PermissionError.storyName =
	'Permission Error - No permission is temporarily persisted';
PermissionError.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );
	},
};
PermissionError.scenario = {
	label: 'Global/ErrorNotifications/PluginSetupError',
};

export const AdditionalScopeError = Template.bind( {} );
AdditionalScopeError.storyName = 'Additional Scope Error - Grant Permission';
AdditionalScopeError.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		const permissionsError = {
			status: 403,
			message: 'Additional scope',
			data: {
				scopes: [ 'https://www.googleapis.com/auth/analytics.edit' ],
			},
		};

		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_TEMPORARY_PERSIST_PERMISSION_ERROR, {
				permissionsError,
			} );

		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );
	},
};
AdditionalScopeError.scenario = {
	label: 'Global/ErrorNotifications/AdditionalScopeError',
};

export default {
	title: 'Components/ErrorNotifications',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
