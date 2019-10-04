/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import SettingsModules from 'GoogleComponents/settings/settings-modules';
import Layout from 'GoogleComponents/layout/layout';
/**
 * Internal dependencies
 */
import { googlesitekit as settingsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-settings-googlesitekit.js';
import { fillFilterWithComponent } from 'GoogleUtil';
import AnalyticsSetup from 'GoogleModules/analytics/setup';
import SearchConsoleSettingStatus from 'GoogleModules/search-console/settings/search-console-settings-status';
import SettingsAdmin from '../assets/js/components/settings/settings-admin';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const setupSettings = () => {
	window.googlesitekit.modules.analytics[ 'accounts-properties-profiles' ] = {
		accounts: [
			{
				created: '2011-03-25T21:41:26.980Z',
				id: '12345678',
				kind: 'analytics#account',
				name: '10up',
				selfLink: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678',
				starred: null,
				updated: '2015-08-10T19:09:14.708Z',
				permissions: {
					effective: [],
				},
				childLink: {
					href: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678/webproperties',
					type: 'analytics#webproperties',
				},
			},
			{
				created: '2018-09-17T18:32:09.258Z',
				id: '125893658',
				kind: 'analytics#account',
				name: 'Test',
				selfLink: 'https://www.googleapis.com/analytics/v3/management/accounts/125893658',
				starred: null,
				updated: '2018-09-17T18:32:09.258Z',
				permissions: {
					effective: [
						'COLLABORATE',
						'EDIT',
						'MANAGE_USERS',
						'READ_AND_ANALYZE',
					],
				},
				childLink: {
					href: 'https://www.googleapis.com/analytics/v3/management/accounts/125893658/webproperties',
					type: 'analytics#webproperties',
				},
			},
			{
				id: '-1',
				name: 'Setup a New Account',
			},
		],
		properties: [
			{
				accountId: '12345678',
				created: '2016-12-06T14:48:54.188Z',
				dataRetentionResetOnNewActivity: true,
				dataRetentionTtl: 'MONTHS_26',
				defaultProfileId: '12345678',
				id: 'UA-12345678-3',
				industryVertical: 'INTERNET_AND_TELECOM',
				internalWebPropertyId: '12345678',
				kind: 'analytics#webproperty',
				level: 'STANDARD',
				name: 'testwebsite.com',
				profileCount: 1,
				selfLink: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678/webproperties/UA-12345678-3',
				starred: null,
				updated: '2016-12-06T14:53:41.965Z',
				websiteUrl: 'https://www.testwebsite.com',
				permissions: {
					effective: [
						'READ_AND_ANALYZE',
					],
				},
				parentLink: {
					href: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678',
					type: 'analytics#account',
				},
				childLink: {
					href: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678/webproperties/UA-12345678-3/profiles',
					type: 'analytics#profiles',
				},
			},
			{
				id: 0,
				name: 'Setup a New Property',
			},
		],
		profiles: [
			{
				accountId: '12345678',
				botFilteringEnabled: false,
				created: '2016-12-06T14:48:54.188Z',
				currency: 'USD',
				defaultPage: null,
				eCommerceTracking: false,
				enhancedECommerceTracking: null,
				excludeQueryParameters: null,
				id: '12345678',
				internalWebPropertyId: '12345678',
				kind: 'analytics#profile',
				name: 'All Web Site Data',
				selfLink: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678/webproperties/UA-12345678-3/profiles/12345678',
				siteSearchCategoryParameters: null,
				siteSearchQueryParameters: 's',
				starred: null,
				stripSiteSearchCategoryParameters: null,
				stripSiteSearchQueryParameters: false,
				timezone: 'America/Los_Angeles',
				type: 'WEB',
				updated: '2019-01-25T20:15:27.426Z',
				webPropertyId: 'UA-12345678-3',
				websiteUrl: 'https://www.testwebsite.com',
				permissions: {
					effective: [
						'READ_AND_ANALYZE',
					],
				},
				parentLink: {
					href: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678/webproperties/UA-12345678-3',
					type: 'analytics#webproperty',
				},
				childLink: {
					href: 'https://www.googleapis.com/analytics/v3/management/accounts/12345678/webproperties/UA-12345678-3/profiles/12345678/goals',
					type: 'analytics#goals',
				},
			},
			{
				id: 0,
				name: 'Setup a New Profile',
			},
		],
	};
};

/**
 * Add components to the settings page.
 */
storiesOf( 'Settings', module )
	.add( 'Settings Tabs', () => {
		return (
			<Layout>
				<TabBar
					activeIndex={ 0 }
					handleActiveIndexUpdate={ null }
				>
					<Tab>
						<span className="mdc-tab__text-label">{ __( 'Connected Services', 'google-site-kit' ) }</span>
					</Tab>
					<Tab>
						<span className="mdc-tab__text-label">{ __( 'Connect More Services', 'google-site-kit' ) }</span>
					</Tab>
					<Tab>
						<span className="mdc-tab__text-label">{ __( 'Admin Settings', 'google-site-kit' ) }</span>
					</Tab>
				</TabBar>
			</Layout>
		);
	}, {
		options: {
			delay: 3000, // Wait for tabs to animate.
		},
	} )
	.add( 'Connected Services', () => {
		window.googlesitekit = settingsData;
		window.googlesitekit.setupComplete = true;
		googlesitekit.modules.analytics.setupComplete = true;
		googlesitekit.modules[ 'search-console' ].setupComplete = true;
		// Load the datacache with data.
		setTimeout( () => {
			setupSettings();
			wp.hooks.addFilter( 'googlesitekit.ModuleSettingsDetails-analytics',
				'googlesitekit.AnalyticsModuleSettingsDetails',
				fillFilterWithComponent( AnalyticsSetup, {
					onSettingsPage: true,
				} ) );
			wp.hooks.addFilter( 'googlesitekit.ModuleSettingsDetails-search-console',
				'googlesitekit.SearchConsoleModuleSettingsDetails',
				fillFilterWithComponent( SearchConsoleSettingStatus, {
					onSettingsPage: true,
				} ) );
		}, 2500 );

		return (
			<div className="mdc-layout-grid__inner">
				<SettingsModules activeTab={ 0 } />
			</div>
		);
	}, {
		options: {
			delay: 100, // Wait for screen to render.
		},
	} )
	.add( 'VRT: Editing Settings Module', () => {
		window.googlesitekit = settingsData;
		window.googlesitekit.setupComplete = true;
		googlesitekit.modules.analytics.setupComplete = true;
		// Load the datacache with data.
		setTimeout( () => {
			setupSettings();
			wp.hooks.addFilter( 'googlesitekit.ModuleSettingsDetails-analytics',
				'googlesitekit.AnalyticsModuleSettingsDetails',
				fillFilterWithComponent( AnalyticsSetup, {
					onSettingsPage: true,
				} ) );
			wp.hooks.addFilter( 'googlesitekit.ModuleSettingsDetails-search-console',
				'googlesitekit.SearchConsoleModuleSettingsDetails',
				fillFilterWithComponent( SearchConsoleSettingStatus, {
					onSettingsPage: true,
				} ) );
		}, 2500 );

		return (
			<div className="mdc-layout-grid__inner">
				<SettingsModules activeTab={ 0 } />
			</div>
		);
	}, {
		options: {
			delay: 2000, // Sometimes the click doesn't work, waiting for everything to load.
			clickSelectors: [ '#googlesitekit-settings-module__header--analytics', '.googlesitekit-settings-module__edit-button' ],
			hoverSelector: '.googlesitekit-settings-module__title', // Move mouse off "Learn more" link.
			postInteractionWait: 3000, // Wait for overlay and selects to animate.
			onReadyScript: 'mouse.js',
		},
	} )
	.add( 'Connect More Services', () => {
		window.googlesitekit = settingsData;
		window.googlesitekit.modules.analytics.setupComplete = false;
		return (
			<SettingsModules activeTab={ 1 } />
		);
	} )
	.add( 'Admin Settings', () => {
		window.googlesitekit = settingsData;
		window.googlesitekit.modules.analytics.setupComplete = false;
		window.googlesitekit.admin.clientID = '26521001426-xxx1234ffghrrro6hofusq2b8.apps..com';
		window.googlesitekit.admin.clientSecret = '••••••••••••••••••••••••••••';
		window.googlesitekit.admin.apikey = 'AIzaSyAi7c63e21001ESQsrtIfdIY3IcyQVyiw4o';

		return (
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<SettingsAdmin />
				</div>
			</div>
		);
	} );
