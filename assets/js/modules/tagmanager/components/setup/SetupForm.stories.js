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

function Template() {
	return <ModuleSetup moduleSlug="tagmanager" />;
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

export const Start = Template.bind( null );
Start.storyName = 'Start';
Start.decorators = [
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

export const NoAccounts = Template.bind( null );
NoAccounts.storyName = 'No accounts (Create account)';
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
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const ExistingTag = Template.bind( null );
ExistingTag.storyName = 'Existing tag';
ExistingTag.decorators = [
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
