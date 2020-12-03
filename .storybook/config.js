/**
 * Storybook config.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import cloneDeep from 'lodash/cloneDeep';
import { addDecorator, configure } from '@storybook/react';

/**
 * Internal dependencies
 */
import '../assets/sass/wpdashboard.scss';
import '../assets/sass/adminbar.scss';
import '../assets/sass/admin.scss';
import './assets/sass/wp-admin.scss';
import { bootstrapFetchMocks } from './fetch-mocks';
import { disableFeature } from '../stories/utils/features';
// TODO: Remove when legacy data API is removed.
import { googlesitekit as dashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-dashboard-googlesitekit';

bootstrapFetchMocks();

const resetFeatures = () => {
	disableFeature( 'widgets.dashboard' );
	disableFeature( 'widgets.pageDashboard' );
	disableFeature( 'userInput' );
	disableFeature( 'storeErrorNotifications' );
	disableFeature( 'serviceSetupV2' );
};
const resetGlobals = () => {
	global._googlesitekitLegacyData = cloneDeep( dashboardData );
	global._googlesitekitLegacyData.admin.assetsRoot = '';
	global._googlesitekitLegacyData.isStorybook = true;
	global._googlesitekitBaseData = {
		homeURL: 'http://example.com/',
		referenceSiteURL: 'http://example.com/',
		userIDHash: 'storybook',
		adminURL: 'http://example.com/wp-admin/',
		assetsURL: 'http://example.com/wp-content/plugins/google-site-kit/dist/assets/',
		blogPrefix: 'wp_',
		ampMode: false,
		isNetworkMode: false,
		isFirstAdmin: true,
		isOwner: true,
		splashURL: 'http://example.com/wp-admin/admin.php?page=googlesitekit-splash',
		proxySetupURL: 'https://sitekit.withgoogle.com/site-management/setup/?scope=openid%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fsiteverification%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fwebmasters%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.manage.users%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.edit&supports=credentials_retrieval%20short_verification_token%20file_verification&nonce=&site_id=storybooksiteid.apps.sitekit.withgoogle.com',
		proxyPermissionsURL: 'https://sitekit.withgoogle.com/site-management/permissions/?token=storybooktoken&site_id=storybooksiteid.apps.sitekit.withgoogle.com',
		trackingEnabled: false,
		trackingID: 'UA-000000000-1',
	};
	global._googlesitekitEntityData = {
		currentEntityURL: null,
		currentEntityType: null,
		currentEntityTitle: null,
		currentEntityID: null,
	};
};
resetGlobals();

addDecorator( ( story ) => {
	resetGlobals();
	resetFeatures();
	return story();
} );

// Global Decorator.
addDecorator( ( story ) => (
	<div className="googlesitekit-plugin-preview">
		<div className="googlesitekit-plugin">{ story() }</div>
	</div>
) );

const req = require.context( '../stories', true, /\.stories\.js$/ );

function loadStories() {
	req.keys().forEach( ( filename ) => req( filename ) );
}

configure( loadStories, module );

// TODO Would be nice if this wrote to a file. This logs our Storybook data to the browser console. Currently it gets put in .storybook/storybook-data and used in tests/backstop/scenarios.js.
// eslint-disable-next-line no-console
console.log( '__STORYBOOK_CLIENT_API__.raw()', global.__STORYBOOK_CLIENT_API__.raw() );
