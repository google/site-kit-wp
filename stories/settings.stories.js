/**
 * Settings stories.
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
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { WithTestRegistry } from '../tests/js/utils';
import SettingsModules from '../assets/js/components/settings/settings-modules';
import Layout from '../assets/js/components/layout/layout';
import SettingsAdmin from '../assets/js/components/settings/settings-admin';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import defaultModules from '../assets/js/googlesitekit/modules/datastore/fixtures.json';
import { SettingsMain } from '../assets/js/modules/analytics/components/settings';

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
			const connectedModules = [ 'search-console', 'adsense', 'analytics', 'pagespeed-insights' ];
			const modules = defaultModules.map( ( module ) => {
				const connected = connectedModules.includes( module.slug );
				return {
					...module,
					active: connected,
					connected,
				};
			} );
			registry.dispatch( CORE_MODULES ).receiveGetModules( modules );
			registry.dispatch( CORE_MODULES ).registerModule( 'analytics', { settingsComponent: SettingsMain } );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SettingsModules activeTab={ 0 } />
			</WithTestRegistry>
		);
	} )
	.add( 'Connect More Services', () => {
		const setupRegistry = ( registry ) => {
			const activeModules = [ 'search-console', 'analytics', 'pagespeed-insights' ];
			const connectedModules = [ 'search-console', 'pagespeed-insights' ];
			const modules = defaultModules.map( ( module ) => {
				return {
					...module,
					active: activeModules.includes( module.slug ),
					connected: connectedModules.includes( module.slug ),
				};
			} );
			registry.dispatch( CORE_MODULES ).receiveGetModules( modules );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SettingsModules activeTab={ 1 } />
			</WithTestRegistry>
		);
	} )
	.add( 'Admin Settings', () => {
		return (
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<SettingsAdmin />
				</div>
			</div>
		);
	} )
;
