/**
 * Legacy global data fixture.
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

export default {
	admin: {
		siteURL: 'https://example.com',
		resetSession: null,
		newSitePosts: false,
		connectURL:
			'https://example.com/wp-admin/index.php?action=googlesitekit_connect&nonce=a1b2c3d4',
		disconnectURL:
			'https://example.com/wp-admin/index.php?action=googlesitekit_disconnect&nonce=a1b2c3d4',
	},
	setup: {
		isSiteKitConnected: true,
		isResettable: true,
		isAuthenticated: true,
		requiredScopes: [
			'openid',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/siteverification',
			'https://www.googleapis.com/auth/webmasters',
		],
		grantedScopes: [
			'https://www.googleapis.com/auth/siteverification',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/webmasters',
			'openid',
			'https://www.googleapis.com/auth/userinfo.email',
		],
		unsatisfiedScopes: [],
		needReauthenticate: false,
		isVerified: true,
		hasSearchConsoleProperty: true,
	},
};
