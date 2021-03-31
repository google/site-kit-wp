/**
 * Utility function setupAdsense.
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
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultSettings = {
	ownerID: 1,
	accountID: 'pub-123456789',
	clientID: 'ca-pub-123456789',
	accountStatus: 'approved',
	siteStatus: 'added',
	accountSetupComplete: true,
	siteSetupComplete: true,
	useSnippet: true,
};

/**
 * Activates the AdSense module and complete the setup process.
 *
 * @since 1.21.0
 *
 * @param {Object} [settingsOverrides] Optional. Settings to override the defaults.
 */
export async function setupAdSense( settingsOverrides = {} ) {
	const settings = {
		...defaultSettings,
		...settingsOverrides,
	};
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/core/modules/data/activation',
		data: {
			data: { slug: 'adsense', active: true },
		},
	} );
	// Set placeholder connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/adsense/data/settings',
		data: {
			data: settings,
		},
	} );
}
