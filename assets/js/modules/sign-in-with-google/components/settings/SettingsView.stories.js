/**
 * Sign in with Google `SettingsView` component stories.
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

import { Cell, Grid, Row } from '../../../../material-components';
import { provideSiteInfo } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import SettingsView from './SettingsView';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';

function Template() {
	return (
		<div className="googlesitekit-plugin googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--sign-in-with-google">
				<div className="googlesitekit-setup-module googlesitekit-setup-module--sign-in-with-google">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsView />
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

export const NewUserAccountsDisabled = Template.bind( null );
NewUserAccountsDisabled.storyName = 'New Accounts Disabled';
NewUserAccountsDisabled.args = {
	anyoneCanRegister: false,
};

export const NewUserAccountsEnabled = Template.bind( null );
NewUserAccountsEnabled.storyName = 'New Accounts Enabled';
NewUserAccountsEnabled.args = {
	anyoneCanRegister: true,
};

export default {
	title: 'Modules/SignInWithGoogle/Settings/SettingsView',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				const { anyoneCanRegister = false } = args;
				provideSiteInfo( registry, { anyoneCanRegister } );

				registry
					.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
					.receiveGetSettings( {
						clientID:
							'example-client-id-123123123.apps.googleusercontent.com',
						text: 'continue_with',
						theme: 'outline',
						shape: 'rectangular',
						oneTapEnabled: false,
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
	],
};
