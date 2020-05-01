/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import SettingsModules from '../assets/js/components/settings/settings-modules';
import Layout from '../assets/js/components/layout/layout';
import { googlesitekit as settingsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-settings-googlesitekit.js';
import SettingsAdmin from '../assets/js/components/settings/settings-admin';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Add components to the settings page.
 */
storiesOf( 'Settings', module )
	.add( 'Settings Tabs', () => {
		global.googlesitekit = settingsData;
		global.googlesitekit.modules.adsense.active = false;
		global.googlesitekit.modules.adsense.setupComplete = false;

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
		global.googlesitekit = settingsData;
		global.googlesitekit.modules.adsense.settings.accountID = 'pub-XXXXXXXXXXXXXXXX';
		global.googlesitekit.modules.optimize.active = false;
		global.googlesitekit.modules.optimize.setupComplete = false;
		global.googlesitekit.modules.tagmanager.active = false;
		global.googlesitekit.modules.tagmanager.setupComplete = false;

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
	.add( 'Connect More Services', () => {
		global.googlesitekit = settingsData;
		global.googlesitekit.canAdsRun = true;
		global.googlesitekit.modules.analytics.setupComplete = false;
		global.googlesitekit.modules.adsense.active = false;
		global.googlesitekit.modules.adsense.setupComplete = false;
		global.googlesitekit.modules.optimize.active = false;
		global.googlesitekit.modules.optimize.setupComplete = false;
		global.googlesitekit.modules.tagmanager.active = false;
		global.googlesitekit.modules.tagmanager.setupComplete = false;
		return (
			<SettingsModules activeTab={ 1 } />
		);
	} )
	.add( 'Admin Settings', () => {
		global.googlesitekit = settingsData;
		global.googlesitekit.modules.analytics.setupComplete = false;
		global.googlesitekit.admin.clientID = '123456789-xxx1234ffghrrro6hofusq2b8.apps..com';
		global.googlesitekit.admin.clientSecret = '••••••••••••••••••••••••••••';

		return (
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<SettingsAdmin />
				</div>
			</div>
		);
	} );
