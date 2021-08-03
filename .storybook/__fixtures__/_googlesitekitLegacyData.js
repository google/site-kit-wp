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
	modules: {
		'site-verification': {
			slug: 'site-verification',
			name: 'Site Verification',
			description:
				'Google Site Verification allows you to manage ownership of your site.',
			sort: 0,
			homepage: 'https://www.google.com/webmasters/verification/home',
			required: [],
			autoActivate: true,
			internal: true,
			screenID: false,
			settings: false,
			active: true,
			setupComplete: true,
			dependencies: [],
			dependants: [],
			owner: null,
		},
		'search-console': {
			slug: 'search-console',
			name: 'Search Console',
			description:
				'Google Search Console and helps you understand how Google views your site and optimize its performance in search results.',
			sort: 1,
			homepage: 'https://search.google.com/search-console',
			required: [],
			autoActivate: true,
			internal: false,
			screenID: 'googlesitekit-module-search-console',
			settings: {
				propertyID: 'https://example.com/',
				ownerID: 1,
			},
			active: true,
			setupComplete: true,
			dependencies: [],
			dependants: [],
			owner: {
				id: 1,
				login: 'admin',
			},
		},
		adsense: {
			slug: 'adsense',
			name: 'AdSense',
			description:
				'Earn money by placing ads on your website. It’s free and easy.',
			sort: 2,
			homepage:
				'https://www.google.com/adsense/start?source=site-kit&url=https://example.com',
			required: [],
			autoActivate: false,
			internal: false,
			screenID: 'googlesitekit-module-adsense',
			settings: {
				ownerID: 0,
				accountID: '',
				clientID: '',
				accountStatus: '',
				siteStatus: '',
				accountSetupComplete: false,
				siteSetupComplete: false,
				useSnippet: true,
				webStoriesAdUnit: '',
			},
			active: false,
			setupComplete: false,
			dependencies: [],
			dependants: [],
			owner: null,
		},
		analytics: {
			slug: 'analytics',
			name: 'Analytics',
			description:
				'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.',
			sort: 3,
			homepage: 'https://analytics.google.com/analytics/web',
			required: [],
			autoActivate: false,
			internal: false,
			screenID: 'googlesitekit-module-analytics',
			settings: {
				ownerID: 0,
				accountID: '',
				adsenseLinked: false,
				adsConversionID: '',
				anonymizeIP: true,
				internalWebPropertyID: '',
				profileID: '',
				propertyID: '',
				trackingDisabled: [ 'loggedinUsers' ],
				useSnippet: true,
				canUseSnippet: true,
			},
			active: false,
			setupComplete: false,
			dependencies: [],
			dependants: [ 'optimize' ],
			owner: null,
		},
		'pagespeed-insights': {
			slug: 'pagespeed-insights',
			name: 'PageSpeed Insights',
			description:
				'Google PageSpeed Insights gives you metrics about performance, accessibility, SEO and PWA',
			sort: 4,
			homepage: 'https://developers.google.com/speed/pagespeed/insights/',
			required: [],
			autoActivate: false,
			internal: false,
			screenID: false,
			settings: false,
			active: false,
			setupComplete: false,
			dependencies: [],
			dependants: [],
			owner: null,
		},
		optimize: {
			slug: 'optimize',
			name: 'Optimize',
			description:
				'Create free A/B tests that help you drive metric-based design solutions to your site',
			sort: 5,
			homepage: 'https://optimize.google.com/optimize/home/',
			required: [ 'analytics' ],
			autoActivate: false,
			internal: false,
			screenID: false,
			settings: {
				ownerID: 0,
				ampExperimentJSON: '',
				optimizeID: '',
			},
			active: false,
			setupComplete: false,
			dependencies: [ 'analytics' ],
			dependants: [],
			owner: null,
		},
		tagmanager: {
			slug: 'tagmanager',
			name: 'Tag Manager',
			description:
				'Tag Manager creates an easy to manage way to create tags on your site without updating code',
			sort: 6,
			homepage: 'https://tagmanager.google.com/',
			required: [],
			autoActivate: false,
			internal: false,
			screenID: false,
			settings: {
				ownerID: 0,
				accountID: '',
				ampContainerID: '',
				containerID: '',
				internalContainerID: '',
				internalAMPContainerID: '',
				useSnippet: true,
				gaPropertyID: '',
			},
			active: false,
			setupComplete: false,
			dependencies: [],
			dependants: [],
			owner: null,
		},
	},
	locale: 'en_US',
	permissions: {
		canAuthenticate: true,
		canSetup: true,
		canViewPostsInsights: true,
		canViewDashboard: true,
		canViewModuleDetails: true,
		canManageOptions: true,
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
		showModuleSetupWizard: null,
		moduleToSetup: '',
	},
	editmodule: null,
};
