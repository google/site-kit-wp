/**
 * Ads WooCommerceRedirectModal component stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ADS, PLUGINS } from '@/js/modules/ads/datastore/constants';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import WooCommerceRedirectModal from './WooCommerceRedirectModal';

function Template() {
	return (
		<WooCommerceRedirectModal
			onClose={ () => {} }
			onContinueWithSiteKit={ () => {} }
			dialogActive
		/>
	);
}

export const GoogleForWooCommerceInactive = Template.bind( {} );
GoogleForWooCommerceInactive.storyName = 'GoogleForWooCommerceInactive';
GoogleForWooCommerceInactive.args = {
	plugins: {
		[ PLUGINS.WOOCOMMERCE ]: {
			active: true,
		},
		[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
			active: false,
			adsConnected: false,
		},
	},
};
GoogleForWooCommerceInactive.scenario = {};

export const GoogleForWooCommerceActive = Template.bind( {} );
GoogleForWooCommerceActive.storyName = 'GoogleForWooCommerceActive';
GoogleForWooCommerceActive.args = {
	plugins: {
		[ PLUGINS.WOOCOMMERCE ]: {
			active: true,
		},
		[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
			active: true,
			adsConnected: false,
		},
	},
};
GoogleForWooCommerceActive.scenario = {};

export const AdsAccountConnected = Template.bind( {} );
AdsAccountConnected.storyName = 'AdsAccountConnected';
AdsAccountConnected.args = {
	plugins: {
		[ PLUGINS.WOOCOMMERCE ]: {
			active: true,
		},
		[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
			active: true,
			adsConnected: true,
		},
	},
};
AdsAccountConnected.scenario = {};

export default {
	title: 'Modules/Ads/WooCommerceRedirectModal',
	component: WooCommerceRedirectModal,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideSiteInfo( registry );
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
				registry.dispatch( MODULES_ADS ).receiveModuleData( {
					plugins: args.plugins,
				} );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
