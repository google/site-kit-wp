/**
 * Sign in with Google SettingsForm component stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import SettingsForm from './SettingsForm';

function Template() {
	return (
		<div className="googlesitekit-plugin googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--sign-in-with-google">
				<div className="googlesitekit-setup-module googlesitekit-setup-module--sign-in-with-google">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsForm />
								</Cell>
							</Row>
						</Grid>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/SignInWithGoogle/Settings/SettingsForm/Default',
};

export const NewUserAccountsEnabled = Template.bind( null );
NewUserAccountsEnabled.storyName = 'New Accounts Enabled';
NewUserAccountsEnabled.args = {
	anyoneCanRegister: true,
};
NewUserAccountsEnabled.scenario = {
	label: 'Modules/SignInWithGoogle/Settings/SettingsForm/NewUserAccountsEnabled',
};

Default.decorators = [
	( Story, { args } ) => {
		const setupRegistry = ( registry ) => {
			const { anyoneCanRegister = false } = args;
			provideSiteInfo( registry, { anyoneCanRegister } );

			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetSettings( {
					clientID:
						'example-client-id-123123123.apps.usercontent.com',
					text: 'continue_with',
					theme: 'outline',
					shape: 'rectangular',
					OneTapEnabled: true,
				} );

			// Story-specific setup.
			if ( args.setupRegistry ) {
				args.setupRegistry( registry );
			}
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const InvalidClientID = Template.bind( null );
InvalidClientID.storyName = 'Invalid Client ID';
InvalidClientID.scenario = {
	label: 'Modules/Sign in with Google/Settings/SettingsForm/Invalid Client ID',
};
InvalidClientID.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideSiteInfo( registry, { anyoneCanRegister: true } );

			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetSettings( {
					clientID: 'example-invalid-id-DF)@*.apps.usercontent.com',
					text: 'Continue with Google',
					theme: 'light',
					shape: 'rectangular',
					OneTapEnabled: true,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/SignInWithGoogle/Settings/SettingsEdit',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry, { anyoneCanRegister: true } );
				provideModules( registry, [
					{
						slug: 'sign-in-with-google',
						active: true,
						connected: true,
					},
				] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};

export const Empty = Template.bind( null );
Empty.storyName = 'Empty';
Empty.scenario = {
	label: 'Modules/SignInWithGoogle/Settings/SettingsForm/Empty',
};
