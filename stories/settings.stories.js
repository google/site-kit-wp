/**
 * Settings stories.
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
import { storiesOf } from '@storybook/react';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import { Router } from 'react-router-dom';
import { createHashHistory } from 'history';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SettingsModules from '../assets/js/components/settings/SettingsModules';
import Layout from '../assets/js/components/layout/Layout';
import { googlesitekit as settingsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-settings-googlesitekit.js';
import SettingsAdmin from '../assets/js/components/settings/SettingsAdmin';
import { provideModuleRegistrations, provideSiteInfo, WithTestRegistry, untilResolved } from '../tests/js/utils';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { withConnected } from '../assets/js/googlesitekit/modules/datastore/__fixtures__';

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
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_MODULES ).receiveGetModules(
				withConnected(
					'adsense',
					'analytics',
					'pagespeed-insights',
					'search-console'
				)
			);
			provideModuleRegistrations( registry );
		};

		const history = createHashHistory();

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<Router history={ history }>
					<SettingsModules />
				</Router>
			</WithTestRegistry>
		);
	}, {
		options: {
			delay: 100, // Wait for screen to render.
		},
	} )
	.add( 'Connect More Services', () => {
		const setupRegistry = async ( registry ) => {
			registry.dispatch( CORE_MODULES ).receiveGetModules(
				withConnected(
					'adsense',
					'pagespeed-insights',
					'search-console',
				)
			);
			provideModuleRegistrations( registry );
			registry.select( CORE_MODULES ).getModule( 'adsense' );
			await untilResolved( registry, CORE_MODULES ).getModules();
		};

		const history = createHashHistory();
		history.push( '/connect-more-services' );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Router history={ history }>
					<SettingsModules />
				</Router>
			</WithTestRegistry>
		);
	} )
	.add( 'Admin Settings', () => {
		global._googlesitekitLegacyData = settingsData;
		global._googlesitekitLegacyData.modules.analytics.setupComplete = false;
		global._googlesitekitLegacyData.admin.clientID = '123456789-xxx1234ffghrrro6hofusq2b8.apps..com';
		global._googlesitekitLegacyData.admin.clientSecret = '••••••••••••••••••••••••••••';

		const setupRegistry = ( registry ) => {
			provideSiteInfo( registry );

			registry.dispatch( CORE_USER ).receiveGetTracking( {
				enabled: false,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<div className="mdc-layout-grid">
					<SettingsAdmin />
				</div>
			</WithTestRegistry>
		);
	}, {
		padding: 0,
	} );
