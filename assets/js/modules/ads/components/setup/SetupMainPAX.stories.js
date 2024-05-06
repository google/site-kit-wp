/**
 * SetupMainPAX component stories.
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
 * External dependecies.
 */
import { withQuery } from '@storybook/addon-queryparams';

/**
 * Internal dependencies
 */
import { ADWORDS_SCOPE, MODULES_ADS } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	provideModuleRegistrations,
	provideSiteInfo,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import SetupMainPAX from './SetupMainPAX';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template( { setupRegistry = () => {} } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<SetupMainPAX />
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADS )
			.setSettings( { paxConversionID: 'AW-123456789' } );

		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );
	},
};
Default.scenario = {
	label: 'Modules/Ads/Setup/SetupMainPAX/Default',
};

export const withAdwordsScope = Template.bind( {} );
withAdwordsScope.storyName = 'WithAdWordsScope';
withAdwordsScope.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADS )
			.setSettings( { paxConversionID: 'AW-123456789' } );

		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );

		provideUserAuthentication( registry, {
			grantedScopes: [ ADWORDS_SCOPE ],
		} );
	},
};
withAdwordsScope.scenario = {
	label: 'Modules/Ads/Setup/SetupMainPAX/WithAdWordsScope',
};

export const withAccountCreated = Template.bind( {} );
withAccountCreated.storyName = 'WithAccountCreated';
withAccountCreated.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADS )
			.setSettings( { paxConversionID: 'AW-123456789' } );

		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );

		provideUserAuthentication( registry, {
			grantedScopes: [ ADWORDS_SCOPE ],
		} );

		// Since PAX app can't launch in this context, placeholder is added to
		// mark that PAX app is displayed.
		const checkForPAXSelector = setInterval( () => {
			const paxSelector = document.querySelector(
				'.googlesitekit-pax-embedded-app'
			);

			if ( paxSelector ) {
				paxSelector.innerHTML = 'PAX Embedded App Launcher';
				clearInterval( checkForPAXSelector );
			}
		}, 10 );
	},
};
withAccountCreated.parameters = {
	query: {
		pax: '1',
	},
};
withAccountCreated.scenario = {
	label: 'Modules/Ads/Setup/SetupMainPAX/WithAccountCreated',
};

export default {
	title: 'Modules/Ads/Setup/SetupMainPAX',
	decorators: [
		withQuery,
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'ads',
						active: true,
						connected: true,
					},
				] );

				provideSiteInfo( registry );
				provideModuleRegistrations( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		features: [ 'adsModule', 'adsPax' ],
	},
};
