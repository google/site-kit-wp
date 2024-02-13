/**
 * AdSense Setup UseSnippet Switch Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import SetupUseSnippetSwitch from './SetupUseSnippetSwitch';
import { MODULES_ADSENSE } from '../../datastore/constants';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { ACCOUNT_STATUS_READY, SITE_STATUS_ADDED } from '../../util';

const validSettings = {
	accountID: 'pub-12345678',
	clientID: 'ca-pub-12345678',
	useSnippet: false,
	accountStatus: ACCOUNT_STATUS_READY,
	siteStatus: SITE_STATUS_ADDED,
};

function Template( { setupRegistry } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<SetupUseSnippetSwitch />
		</WithRegistrySetup>
	);
}

export const SameExistingTagAndClientID = Template.bind( {} );
SameExistingTagAndClientID.storyName = 'Same ExistingTag and ClientID';
SameExistingTagAndClientID.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( validSettings );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingTag( 'ca-pub-12345678' );
	},
};

export const DifferentExistingTagAndClientID = Template.bind( {} );
DifferentExistingTagAndClientID.storyName =
	'Different ExistingTag and ClientID';
DifferentExistingTagAndClientID.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			clientID: 'ca-pub-12345679',
		} );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingTag( 'ca-pub-12345678' );
	},
};

export const NoExistingTags = Template.bind( {} );
NoExistingTags.storyName = 'No Existing Tags';
NoExistingTags.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( validSettings );
		registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
	},
};

export default {
	title: 'Modules/AdSense/Components/Setup/SetupUseSnippetSwitch',
	component: SetupUseSnippetSwitch,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideModules( registry, [
				{
					slug: 'adsense',
					active: true,
					connected: true,
				},
			] );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
