/**
 * Tag Manager SettingsForm component stories.
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

/**
 * Internal dependencies
 */
import * as fixtures from '../../datastore/__fixtures__';
import SettingsForm from './SettingsForm';
import { Cell, Grid, Row } from '../../../../material-components';
import { ACCOUNT_CREATE, MODULES_TAGMANAGER } from '../../datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

const defaultSettings = {
	accountID: '',
	containerID: '',
	internalContainerID: '',
	ampContainerID: '',
	internalAMPContainerID: '',
	useSnippet: true,
	ownerID: 0,
};

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--tagmanager">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsForm { ...args } />
								</Cell>
							</Row>
						</Grid>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = fixtures.accounts[ 0 ].accountId;
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( fixtures.getContainers.all, {
				accountID,
			} );
		const [ container ] = registry
			.select( MODULES_TAGMANAGER )
			.getWebContainers( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setContainerID( container.publicId );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setInternalContainerID( container.containerId );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetSettings( defaultSettings );
	},
};

export const NoAccounts = Template.bind( {} );
NoAccounts.storyName = 'No Accounts';
NoAccounts.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetSettings( defaultSettings );
	},
};

export const SetupNewAccount = Template.bind( {} );
SetupNewAccount.storyName = 'Set Up New Account';
SetupNewAccount.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( ACCOUNT_CREATE );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetSettings( defaultSettings );
	},
};

export default {
	title: 'Modules/TagManager/Components/Settings/SettingsForm',
	component: SettingsForm,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetSettings( {} );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( null );
				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: 'tagmanager',
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
