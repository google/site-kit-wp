/**
 * Tag Manager Module Setup Stories.
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
	WithTestRegistry,
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	provideUserAuthentication,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';
import ModuleSetup from '../assets/js/components/setup/ModuleSetup';
import {
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../assets/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../assets/js/googlesitekit/datastore/forms/constants';
import {
	MODULES_TAGMANAGER,
	ACCOUNT_CREATE,
	CONTAINER_CREATE,
	FORM_SETUP,
} from '../assets/js/modules/tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import * as fixtures from '../assets/js/modules/tagmanager/datastore/__fixtures__';
import * as modulesFixtures from '../assets/js/googlesitekit/modules/datastore/__fixtures__';
import {
	createBuildAndReceivers,
	parseLiveContainerVersionIDs,
} from '../assets/js/modules/tagmanager/datastore/__factories__/utils';

function selectFirstWebContainer( registry, accountID ) {
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
}

function selectFirstAMPContainer( registry, accountID ) {
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
}

function Setup( props ) {
	return (
		<WithTestRegistry { ...props }>
			<ModuleSetup moduleSlug="tagmanager" />
		</WithTestRegistry>
	);
}

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideModules( registry, [
		{
			slug: 'tagmanager',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
	registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	provideUserAuthentication( registry );
	provideSiteInfo( registry, { ampMode: false } );
	const activeModules = modulesFixtures.withActive( 'tagmanager' );
	registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetSettings( { propertyID: '' } );

	return <Story registry={ registry } />;
};

const withRegistryPrimaryAMP = ( Story ) => {
	const registry = createTestRegistry();
	provideModules( registry, [
		{
			slug: 'tagmanager',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
	registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	provideSiteInfo( registry, { ampMode: AMP_MODE_PRIMARY } );
	provideUserAuthentication( registry );
	const activeModules = modulesFixtures.withActive( 'tagmanager' );
	registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetSettings( { propertyID: '' } );

	return <Story registry={ registry } />;
};

const withRegistrySecondaryAMP = ( Story ) => {
	const registry = createTestRegistry();
	provideModules( registry, [
		{
			slug: 'tagmanager',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
	registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	provideSiteInfo( registry, { ampMode: AMP_MODE_SECONDARY } );
	provideUserAuthentication( registry );
	const activeModules = modulesFixtures.withActive( 'tagmanager' );
	registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetSettings( { propertyID: '' } );

	return <Story registry={ registry } />;
};

storiesOf( 'Tag Manager Module/Setup', module )
	.add(
		'Loading',
		( args, { registry } ) => {
			freezeFetch(
				/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/
			);

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Start',
		( args, { registry } ) => {
			registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: fixtures.accounts[ 0 ].accountId,
				} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'No accounts',
		( args, { registry } ) => {
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Set up a new account',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setAccountID( ACCOUNT_CREATE );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Set up a new container',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case

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

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Set up with a non-unique container name',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case

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

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Existing tag',
		( args, { registry } ) => {
			// eslint-disable-next-line sitekit/acronym-case
			const accountID = fixtures.accounts[ 0 ].accountId;
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetExistingTag( 'GTM-S1T3K1T' );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					accountID,
				} );

			registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Container with property ID, Analytics inactive',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( [ webContainerVersion.container ], {
					accountID,
				} );
			parseLiveContainerVersionIDs(
				webContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( webContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstWebContainer( registry, accountID );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	// Multiple property IDs are only possible with secondary AMP.
	.add(
		'Container with property ID, Analytics active, ID match',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( [ webContainerVersion.container ], {
					accountID,
				} );
			parseLiveContainerVersionIDs(
				webContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( webContainerVersion, {
							accountID,
							internalContainerID,
						} );
					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setPropertyID( propertyID );

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstWebContainer( registry, accountID );
			const activeModules = modulesFixtures.withActive(
				'tagmanager',
				'analytics'
			);
			registry
				.dispatch( CORE_MODULES )
				.receiveGetModules( activeModules );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	);

storiesOf( 'Tag Manager Module/Setup/Primary AMP', module )
	.add(
		'Start',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: fixtures.accounts[ 0 ].accountId,
				} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistryPrimaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Selected',
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

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistryPrimaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Container with property ID, Analytics inactive',
		( args, { registry } ) => {
			const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
			const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( [ ampContainerVersion.container ], {
					accountID,
				} );
			parseLiveContainerVersionIDs(
				ampContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( ampContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstAMPContainer( registry, accountID );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistryPrimaryAMP ],
			padding: 0,
		}
	)
	// Multiple property IDs are only possible with secondary AMP.
	.add(
		'Container with property ID, Analytics active, ID match',
		( rargs, { registry } ) => {
			const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
			const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( [ ampContainerVersion.container ], {
					accountID,
				} );
			parseLiveContainerVersionIDs(
				ampContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( ampContainerVersion, {
							accountID,
							internalContainerID,
						} );
					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setPropertyID( propertyID );

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstAMPContainer( registry, accountID );
			const activeModules = modulesFixtures.withActive(
				'tagmanager',
				'analytics'
			);
			registry
				.dispatch( CORE_MODULES )
				.receiveGetModules( activeModules );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistryPrimaryAMP ],
			padding: 0,
		}
	);

storiesOf( 'Tag Manager Module/Setup/Secondary AMP', module )
	.add(
		'Start',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: fixtures.accounts[ 0 ].accountId,
				} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Selected',
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

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Singular property ID, Analytics inactive',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers(
					[
						webContainerVersion.container,
						ampContainerVersion.container,
					],
					{ accountID }
				);
			parseLiveContainerVersionIDs(
				webContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( webContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstWebContainer( registry, accountID );
			parseLiveContainerVersionIDs(
				ampContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( ampContainerVersion, {
							accountID,
							internalContainerID,
						} );
				}
			);
			selectFirstAMPContainer( registry, accountID );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Multiple property IDs, Analytics inactive',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const ampContainerVersion = fixtures.liveContainerVersions.amp.noGA;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers(
					[
						webContainerVersion.container,
						ampContainerVersion.container,
					],
					{ accountID }
				);
			parseLiveContainerVersionIDs(
				webContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( webContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstWebContainer( registry, accountID );
			parseLiveContainerVersionIDs(
				ampContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( ampContainerVersion, {
							accountID,
							internalContainerID,
						} );
				}
			);
			selectFirstAMPContainer( registry, accountID );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Multiple property IDs, Analytics active',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const ampContainerVersion = fixtures.liveContainerVersions.amp.noGA;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers(
					[
						webContainerVersion.container,
						ampContainerVersion.container,
					],
					{ accountID }
				);
			parseLiveContainerVersionIDs(
				webContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( webContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstWebContainer( registry, accountID );
			parseLiveContainerVersionIDs(
				ampContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( ampContainerVersion, {
							accountID,
							internalContainerID,
						} );
				}
			);
			selectFirstAMPContainer( registry, accountID );
			const activeModules = modulesFixtures.withActive(
				'tagmanager',
				'analytics'
			);
			registry
				.dispatch( CORE_MODULES )
				.receiveGetModules( activeModules );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Singular property ID, Analytics active, ID match',
		( args, { registry } ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.gaWithVariable;
			const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
			const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers(
					[
						webContainerVersion.container,
						ampContainerVersion.container,
					],
					{ accountID }
				);
			parseLiveContainerVersionIDs(
				webContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( webContainerVersion, {
							accountID,
							internalContainerID,
						} );
					const propertyID = registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerAnalyticsPropertyID(
							accountID,
							internalContainerID
						);
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setPropertyID( propertyID );

					const { buildAndReceiveWebAndAMP } =
						createBuildAndReceivers( registry );
					buildAndReceiveWebAndAMP( {
						accountID,
						webPropertyID: propertyID,
						ampPropertyID: propertyID,
					} );
				}
			);
			selectFirstWebContainer( registry, accountID );
			parseLiveContainerVersionIDs(
				ampContainerVersion,
				( { internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( ampContainerVersion, {
							accountID,
							internalContainerID,
						} );
				}
			);
			selectFirstAMPContainer( registry, accountID );
			const activeModules = modulesFixtures.withActive(
				'tagmanager',
				'analytics'
			);
			registry
				.dispatch( CORE_MODULES )
				.receiveGetModules( activeModules );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Set up a new container',
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

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	)
	.add(
		'Set up with a non-unique container names',
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

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistrySecondaryAMP ],
			padding: 0,
		}
	);
