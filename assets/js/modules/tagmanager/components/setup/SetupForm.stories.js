/**
 * SetupForm component stories.
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
import {
	provideModuleRegistrations,
	provideUserAuthentication,
	provideSiteInfo,
	freezeFetch,
} from '../../../../../../tests/js/utils';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	CONTAINER_CREATE,
	FORM_SETUP,
	MODULES_TAGMANAGER,
} from '../../datastore/constants';
import * as fixtures from '../../../../modules/tagmanager/datastore/__fixtures__';
import {
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../../../../googlesitekit/datastore/site/constants';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';

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

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<ModuleSetup moduleSlug="tagmanager" />
		</ViewContextProvider>
	);
}

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.decorators = [
	( Story ) => {
		const setupRegistry = () => {
			freezeFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/tagmanager/data/accounts'
				)
			);
		};
		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: fixtures.accounts[ 0 ].accountId,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithPrimaryAMP = Template.bind( null );
WithPrimaryAMP.storyName = 'With Primary AMP';
WithPrimaryAMP.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideSiteInfo( registry, { ampMode: AMP_MODE_PRIMARY } );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: fixtures.accounts[ 0 ].accountId,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithSecondaryAMP = Template.bind( null );
WithSecondaryAMP.storyName = 'With Secondary AMP';
WithSecondaryAMP.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideSiteInfo( registry, { ampMode: AMP_MODE_SECONDARY } );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: fixtures.accounts[ 0 ].accountId,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const NoAccounts = Template.bind( null );
NoAccounts.storyName = 'Create account (no accounts)';
NoAccounts.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const CreateNonUniqueContainer = Template.bind( null );
CreateNonUniqueContainer.storyName = 'Create non-unique container';
CreateNonUniqueContainer.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.googleTag;
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
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const ExistingTagOnSite = Template.bind( null );
ExistingTagOnSite.storyName = 'Existing tag on site';
ExistingTagOnSite.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
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
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const ExistingGoogleTagInContainer = Template.bind( null );
ExistingGoogleTagInContainer.storyName = 'Existing Google tag in GTM Container';
ExistingGoogleTagInContainer.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const webContainerVersion =
				fixtures.liveContainerVersions.web.googleTag;
			const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
			const internalContainerID = webContainerVersion.containerId; // eslint-disable-line sitekit/acronym-case
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( [ webContainerVersion.container ], {
					accountID,
				} );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetLiveContainerVersion( webContainerVersion, {
					accountID,
					internalContainerID,
				} );

			registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
			selectFirstWebContainer( registry, accountID );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/TagManager/Setup/SetupForm',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry, { ampMode: false } );
				provideUserAuthentication( registry );
				provideModuleRegistrations( registry );

				registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( null );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
