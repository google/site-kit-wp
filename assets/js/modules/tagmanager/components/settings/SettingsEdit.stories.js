/**
 * Tag Manager SettingsEdit component stories.
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
import SettingsEdit from './SettingsEdit';
import { Cell, Grid, Row } from '../../../../material-components';
import {
	CONTAINER_CREATE,
	FORM_SETUP,
	MODULES_TAGMANAGER,
} from '../../datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../../../../googlesitekit/datastore/site/constants';

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
									<SettingsEdit { ...args } />
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
NoAccounts.storyName = 'No Accounts (Create an Account)';
NoAccounts.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetSettings( defaultSettings );
	},
};

export const SetupNewContainer = Template.bind( {} );
SetupNewContainer.storyName = 'Set Up New Container';
SetupNewContainer.args = {
	setupRegistry: ( registry ) => {
		const webContainerVersion =
			fixtures.liveContainerVersions.web.gaWithVariable;
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = webContainerVersion.accountId;

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( fixtures.getContainers.web, {
				accountID,
			} );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.setContainerID( CONTAINER_CREATE );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID( '' );
	},
};

export const NonUniqueContainer = Template.bind( {} );
NonUniqueContainer.storyName = 'Non-Unique Container';
NonUniqueContainer.args = {
	setupRegistry: ( registry ) => {
		const webContainerVersion =
			fixtures.liveContainerVersions.web.gaWithVariable;
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = webContainerVersion.accountId;

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( fixtures.getContainers.web, {
				accountID,
			} );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.setContainerID( CONTAINER_CREATE );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID( '' );
		registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
			containerName: fixtures.getContainers.web[ 0 ].name,
		} );
	},
};

export const ExistingTag = Template.bind( {} );
ExistingTag.storyName = 'Existing Tag';
ExistingTag.args = {
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
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetExistingTag( 'GTM-G000GL3' );
	},
};

export const NoModuleAccess = Template.bind( {} );
NoModuleAccess.storyName = 'No Module Access';
NoModuleAccess.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'tagmanager' }
			);

		registry.dispatch( MODULES_TAGMANAGER ).setOwnerID( 2 );

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
	hasModuleAccess: false,
};

export const PrimaryAMP = Template.bind( {} );
PrimaryAMP.storyName = 'Primary AMP';
PrimaryAMP.args = {
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
			.getAMPContainers( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setAMPContainerID( container.publicId );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setInternalAMPContainerID( container.containerId );
	},
	ampMode: AMP_MODE_PRIMARY,
};

export const SecondaryAMP = Template.bind( {} );
SecondaryAMP.storyName = 'Secondary AMP';
SecondaryAMP.args = {
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
		const [ webContainer ] = registry
			.select( MODULES_TAGMANAGER )
			.getWebContainers( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setContainerID( webContainer.publicId );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setInternalContainerID( webContainer.containerId );
		const [ ampContainer ] = registry
			.select( MODULES_TAGMANAGER )
			.getAMPContainers( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setAMPContainerID( ampContainer.publicId );
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setInternalAMPContainerID( ampContainer.containerId );
	},
	ampMode: AMP_MODE_SECONDARY,
};

export const SecondaryAMPSetupNewContainer = Template.bind( {} );
SecondaryAMPSetupNewContainer.storyName =
	'Secondary AMP - Set Up New Container';
SecondaryAMPSetupNewContainer.args = {
	setupRegistry: ( registry ) => {
		const webContainerVersion =
			fixtures.liveContainerVersions.web.gaWithVariable;
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = webContainerVersion.accountId;

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( fixtures.getContainers.all, {
				accountID,
			} );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.setContainerID( CONTAINER_CREATE );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID( '' );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.setAMPContainerID( CONTAINER_CREATE );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalAMPContainerID( '' );
	},
	ampMode: AMP_MODE_SECONDARY,
};

export const SecondaryAMPNonUniqueContainer = Template.bind( {} );
SecondaryAMPNonUniqueContainer.storyName =
	'Secondary AMP - Non-Unique Container';
SecondaryAMPNonUniqueContainer.args = {
	setupRegistry: ( registry ) => {
		const webContainerVersion =
			fixtures.liveContainerVersions.web.gaWithVariable;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( fixtures.getContainers.all, {
				accountID,
			} );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.setContainerID( CONTAINER_CREATE );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID( '' );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.setAMPContainerID( CONTAINER_CREATE );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalAMPContainerID( '' );
		registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
			containerName: fixtures.getContainers.web[ 0 ].name,
			ampContainerName: fixtures.getContainers.amp[ 0 ].name,
		} );
	},
	ampMode: AMP_MODE_SECONDARY,
};

export default {
	title: 'Modules/TagManager/Settings/SettingsEdit',
	component: SettingsEdit,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetSettings( {} );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( 'GTM-G000GL3' );

				// Conditional set AMP mode.
				if ( args?.ampMode ) {
					provideSiteInfo( registry, { ampMode: args.ampMode } );
				}

				provideUserAuthentication( registry );
				registry.dispatch( MODULES_TAGMANAGER ).setOwnerID( 1 );
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
