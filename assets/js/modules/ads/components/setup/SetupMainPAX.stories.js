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
 * Internal dependencies
 */
import { ADWORDS_SCOPE, MODULES_ADS } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	provideModuleRegistrations,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import SetupMainPAX from './SetupMainPAX';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { Cell, Grid, Row } from '../../../../material-components';

function Template() {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<SetupMainPAX />
						</Cell>
					</Row>
				</Grid>
			</section>
		</div>
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

		provideUserAuthentication( registry, {
			grantedScopes: [ ADWORDS_SCOPE ],
		} );
	},
};
Default.scenario = {};

export const WithoutAdWordsScope = Template.bind( {} );
WithoutAdWordsScope.storyName = 'WithoutAdWordsScope';
WithoutAdWordsScope.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADS )
			.setSettings( { paxConversionID: 'AW-123456789' } );

		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );
	},
};
WithoutAdWordsScope.scenario = {};

export const WithGoogleForWooCommerceConflict = Template.bind( {} );
WithGoogleForWooCommerceConflict.storyName = 'WithGoogleForWooCommerceConflict';
WithGoogleForWooCommerceConflict.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADS ).setSettings( {
			conversionID: 'AW-123456789',
		} );

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				'google-listings-and-ads': { conversionID: 'AW-123456789' },
			},
		} );

		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );

		provideUserAuthentication( registry, {
			grantedScopes: [ ADWORDS_SCOPE ],
		} );
	},
};
WithGoogleForWooCommerceConflict.scenario = {};

export default {
	title: 'Modules/Ads/Setup/SetupMainPAX',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				args.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
