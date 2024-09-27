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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import SettingsModules from '../assets/js/components/settings/SettingsModules';
import Layout from '../assets/js/components/layout/Layout';
import SettingsAdmin from '../assets/js/components/settings/SettingsAdmin';
import { Grid } from '../assets/js/material-components';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	WithTestRegistry,
	untilResolved,
} from '../tests/js/utils';
import settingsData from '../.storybook/__fixtures__/_googlesitekitLegacyData';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../tests/js/WithRegistrySetup';

/**
 * Add components to the settings page.
 */
storiesOf( 'Settings', module )
	.add(
		'Settings Tabs',
		() => {
			return (
				<Layout>
					<TabBar activeIndex={ 0 } handleActiveIndexUpdate={ null }>
						<Tab>
							<span className="mdc-tab__text-label">
								{ __(
									'Connected Services',
									'google-site-kit'
								) }
							</span>
						</Tab>
						<Tab>
							<span className="mdc-tab__text-label">
								{ __(
									'Connect More Services',
									'google-site-kit'
								) }
							</span>
						</Tab>
						<Tab>
							<span className="mdc-tab__text-label">
								{ __( 'Admin Settings', 'google-site-kit' ) }
							</span>
						</Tab>
					</TabBar>
				</Layout>
			);
		},
		{
			options: {
				delay: 3000, // Wait for tabs to animate.
			},
		}
	)
	.add(
		'Connected Services',
		() => {
			const setupRegistry = ( registry ) => {
				provideModules(
					registry,
					[
						'ads',
						'adsense',
						'analytics-4',
						'pagespeed-insights',
						'search-console',
						'sign-in-with-google',
					].map( ( slug ) => ( {
						slug,
						active: true,
						connected: true,
					} ) )
				);
				provideModuleRegistrations( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<SettingsModules />
				</WithRegistrySetup>
			);
		},
		{
			options: {
				delay: 100, // Wait for screen to render.
			},
			route: '/connected-services',
		}
	)
	.add(
		'Connect More Services',
		() => {
			const setupRegistry = async ( registry ) => {
				provideModules(
					registry,
					[
						'ads',
						'adsense',
						'pagespeed-insights',
						'search-console',
					].map( ( slug ) => ( {
						slug,
						active: true,
						connected: true,
					} ) )
				);
				provideModuleRegistrations( registry );
				registry.select( CORE_MODULES ).getModule( 'adsense' );
				await untilResolved( registry, CORE_MODULES ).getModules();
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<SettingsModules />
				</WithRegistrySetup>
			);
		},
		{
			route: '/connect-more-services',
		}
	)
	.add(
		'Admin Settings',
		() => {
			global._googlesitekitLegacyData = settingsData;

			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideModules( registry, [
					{ slug: 'ads', active: true, connected: true },
				] );

				registry
					.dispatch( CORE_USER )
					.receiveGetTracking( { enabled: false } );
				registry
					.dispatch( CORE_SITE )
					.receiveGetAdminBarSettings( { enabled: true } );
				registry
					.dispatch( CORE_SITE )
					.receiveGetConsentModeSettings( { enabled: false } );
				registry.dispatch( CORE_SITE ).receiveGetConsentAPIInfo( {
					hasConsentAPI: false,
					wpConsentPlugin: {
						installed: false,
						activateURL:
							'http://example.com/wp-admin/plugins.php?action=activate&plugin=some-plugin',
						installURL:
							'http://example.com/wp-admin/update.php?action=install-plugin&plugin=some-plugin',
					},
				} );
			};

			return (
				<WithTestRegistry callback={ setupRegistry }>
					<Grid>
						<SettingsAdmin />
					</Grid>
				</WithTestRegistry>
			);
		},
		{
			padding: 0,
		}
	);
