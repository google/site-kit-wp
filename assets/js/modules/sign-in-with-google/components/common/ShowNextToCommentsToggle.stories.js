/**
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
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import ShowNextToCommentsToggle from './ShowNextToCommentsToggle';

function Template() {
	return <ShowNextToCommentsToggle />;
}

const validSettings = {
	clientID: 'test-client-id.apps.googleusercontent.com',
	text: 'signin_with',
	theme: 'outline',
	shape: 'rectangular',
	oneTapEnabled: false,
	showNextToCommentsEnabled: false,
};

export const Enabled = Template.bind( {} );
Enabled.storyName = 'Enabled';
Enabled.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).receiveGetSettings( {
			...validSettings,
			showNextToCommentsEnabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: true,
			isMultisite: false,
		} );
	},
};

export const Disabled = Template.bind( {} );
Disabled.storyName = 'Disabled';
Disabled.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: true,
			isMultisite: false,
		} );
	},
};

export const RegistrationDisabled = Template.bind( {} );
RegistrationDisabled.storyName = 'Registration Disabled (Single Site)';
RegistrationDisabled.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: false,
			isMultisite: false,
		} );
	},
};

export const RegistrationDisabledMultisite = Template.bind( {} );
RegistrationDisabledMultisite.storyName = 'Registration Disabled (Multisite)';
RegistrationDisabledMultisite.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: false,
			isMultisite: true,
		} );
	},
};

export default {
	title: 'Modules/Sign In With Google/Settings/ShowNextToCommentsToggle',
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
					},
				] );
				provideSiteInfo( registry );

				args?.setupRegistry( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
