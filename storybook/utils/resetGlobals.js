/**
 * Reset global variables for stories.
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
import { cloneDeep } from 'lodash';

/**
 * Internal dependencies
 */
import dashboardData from '../__fixtures__/_googlesitekitLegacyData';

export const resetGlobals = () => {
	global._googlesitekitLegacyData = cloneDeep( dashboardData );
	global._googlesitekitBaseData = {
		homeURL: 'http://example.com/',
		referenceSiteURL: 'http://example.com/',
		adminURL: 'http://example.com/wp-admin/',
		assetsURL:
			'http://example.com/wp-content/plugins/google-site-kit/dist/assets/',
		blogPrefix: 'wp_',
		ampMode: false,
		isNetworkMode: false,
		activeModules: [],
		isOwner: true,
		splashURL:
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash',
		proxySetupURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_proxy_setup&nonce=abc123',
		proxyPermissionsURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_proxy_permissions&nonce=abc123',
		userRoles: [ 'administrator' ],
		isAuthenticated: false,
	};
	global._googlesitekitEntityData = {
		currentEntityURL: null,
		currentEntityType: null,
		currentEntityTitle: null,
		currentEntityID: null,
	};
	global._googlesitekitUserData = {
		user: {
			id: 1,
			name: 'Wapuu WordPress',
			email: 'wapuu.wordpress@gmail.com',
			picture:
				'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
		},
		connectURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_connect&nonce=abc123',
		initialVersion: '',
		verified: true,
		isUserInputCompleted: true,
	};
	global._googlesitekitTrackingData = {
		referenceSiteURL: 'http://example.com/',
		userIDHash: 'storybook',
		activeModules: [],
		trackingEnabled: false,
		trackingID: 'UA-000000000-1',
		userRoles: [ 'administrator' ],
		isAuthenticated: false,
	};
};
