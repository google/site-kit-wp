/**
 * Tag Manager Module Settings Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import {
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../assets/js/googlesitekit/datastore/site/constants';
import * as fixtures from '../assets/js/modules/tagmanager/datastore/__fixtures__';
import {
	MODULES_TAGMANAGER,
	ACCOUNT_CREATE,
	CONTAINER_CREATE,
	FORM_SETUP,
} from '../assets/js/modules/tagmanager/datastore/constants';
import { CORE_FORMS } from '../assets/js/googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	provideModules,
	provideModuleRegistrations,
	freezeFetch,
} from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

const Settings = createLegacySettingsWrapper( 'tagmanager' );

const defaultSettings = {
	accountID: '',
	containerID: '',
	internalContainerID: '',
	ampContainerID: '',
	internalAMPContainerID: '',
	useSnippet: true,
	ownerID: 0,
};

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	provideUserAuthentication( registry );
	provideModules( registry, [
		{
			slug: 'tagmanager',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
};

const withRegistryPrimaryAMP = ( Story ) => {
	const registry = createTestRegistry();
	registry
		.dispatch( MODULES_TAGMANAGER )
		.receiveGetSettings( defaultSettings );
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	provideSiteInfo( registry, { ampMode: AMP_MODE_PRIMARY } );
	provideUserAuthentication( registry );
	provideModules( registry, [
		{
			slug: 'tagmanager',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
};

const withRegistrySecondaryAMP = ( Story ) => {
	const registry = createTestRegistry();
	registry
		.dispatch( MODULES_TAGMANAGER )
		.receiveGetSettings( defaultSettings );
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	provideSiteInfo( registry, { ampMode: AMP_MODE_SECONDARY } );
	provideUserAuthentication( registry );
	provideModules( registry, [
		{
			slug: 'tagmanager',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
};

storiesOf( 'Legacy/Tag Manager Module/Settings', module )
	.add(
		'View, closed',
		( args, { registry } ) => {
			return (
				<Settings registry={ registry } route="/connected-services/" />
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with all settings',
		( args, { registry } ) => {
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {
				...defaultSettings,
				accountID: '123456789',
				containerID: 'GTM-S1T3K1T',
				internalContainerID: '54321',
				useSnippet: true,
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with all settings, with existing tag',
		( args, { registry } ) => {
			const accountID = '123456789';
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {
				...defaultSettings,
				accountID,
				containerID: 'GTM-S1T3K1T',
				internalContainerID: '54321',
				useSnippet: true,
			} );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetExistingTag( 'GTM-G000GL3' );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, Loading',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetSettings( defaultSettings );
			freezeFetch(
				/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/
			);

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with all settings',
		( args, { registry } ) => {
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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with no accounts',
		( args, { registry } ) => {
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetSettings( defaultSettings );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with "Set up a new account"',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setAccountID( ACCOUNT_CREATE );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetSettings( defaultSettings );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with "Set up a new container"',
		( args, { registry } ) => {
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
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalContainerID( '' );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with a non-unique new container',
		( args, { registry } ) => {
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
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalContainerID( '' );
			registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
				containerName: fixtures.getContainers.web[ 0 ].name,
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with all settings, with existing tag',
		( args, { registry } ) => {
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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, with all settings, w/o module access',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_MODULES )
				.receiveCheckModuleAccess(
					{ access: false },
					{ slug: 'tagmanager' }
				);

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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	);

storiesOf( 'Tag Manager Module/Settings/Primary AMP', module )
	.add(
		'Edit, with all settings',
		( args, { registry } ) => {
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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistryPrimaryAMP ],
		}
	)
	.add(
		'Edit, with all settings, w/o module access',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_MODULES )
				.receiveCheckModuleAccess(
					{ access: false },
					{ slug: 'tagmanager' }
				);

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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistryPrimaryAMP ],
		}
	);

storiesOf( 'Tag Manager Module/Settings/Secondary AMP', module )
	.add(
		'Edit, with all settings',
		( args, { registry } ) => {
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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
		}
	)
	.add(
		'Edit, with "Set up a new container"',
		( args, { registry } ) => {
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
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalContainerID( '' );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setAMPContainerID( CONTAINER_CREATE );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalAMPContainerID( '' );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
		}
	)
	.add(
		'Edit, with a non-unique new containers',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case

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
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalContainerID( '' );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setAMPContainerID( CONTAINER_CREATE );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalAMPContainerID( '' );
			registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
				containerName: fixtures.getContainers.web[ 0 ].name,
				ampContainerName: fixtures.getContainers.amp[ 0 ].name,
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
		}
	)
	.add(
		'Edit, with all settings, w/o module access',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_MODULES )
				.receiveCheckModuleAccess(
					{ access: false },
					{ slug: 'tagmanager' }
				);

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

			return (
				<Settings
					registry={ registry }
					route="/connected-services/tagmanager/edit"
				/>
			);
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
		}
	);
