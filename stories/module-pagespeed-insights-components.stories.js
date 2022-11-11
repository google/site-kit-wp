/**
 * PageSpeed Insights Module Component Stories.
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
 * Internal dependencies
 */
import DashboardPageSpeedWidget from '../assets/js/modules/pagespeed-insights/components/dashboard/DashboardPageSpeedWidget';
import * as fixtures from '../assets/js/modules/pagespeed-insights/datastore/__fixtures__';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
} from '../assets/js/modules/pagespeed-insights/datastore/constants';
import {
	WithTestRegistry,
	freezeFetch,
	provideSiteInfo,
	provideModules,
} from '../tests/js/utils';
import { getWidgetComponentProps } from '../assets/js/googlesitekit/widgets/util';

const widgetComponentProps = getWidgetComponentProps( 'dashboardPageSpeed' );

storiesOf( 'PageSpeed Insights Module/Components', module )
	.add( 'Dashboard widget', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;
			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedMobile,
				{
					url,
					strategy: STRATEGY_MOBILE,
				}
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_MOBILE ]
			);

			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedDesktop,
				{
					url,
					strategy: STRATEGY_DESKTOP,
				}
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_DESKTOP ]
			);

			provideSiteInfo( registry, {
				referenceSiteURL: url,
			} );
			provideModules( registry, [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (loading)', () => {
		freezeFetch(
			/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/
		);
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;
			// Component will be loading as long as both reports are not present.
			// Omit receiving mobile here to trigger the request only once.
			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedDesktop,
				{
					url,
					strategy: STRATEGY_DESKTOP,
				}
			);
			provideSiteInfo( registry, {
				referenceSiteURL: url,
			} );
			provideModules( registry, [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (No Recommendations)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;
			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedMobileNoStackPacks,
				{
					url,
					strategy: STRATEGY_MOBILE,
				}
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_MOBILE ]
			);

			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedDesktopNoStackPacks,
				{
					url,
					strategy: STRATEGY_DESKTOP,
				}
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_DESKTOP ]
			);

			provideSiteInfo( registry, {
				referenceSiteURL: url,
			} );
			provideModules( registry, [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (Field Data Unavailable)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;
			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedMobileNoFieldData,
				{
					url,
					strategy: STRATEGY_MOBILE,
				}
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_MOBILE ]
			);

			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
				fixtures.pagespeedDesktopNoFieldData,
				{
					url,
					strategy: STRATEGY_DESKTOP,
				}
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_DESKTOP ]
			);

			provideSiteInfo( registry, {
				referenceSiteURL: url,
			} );
			provideModules( registry, [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (Errors for Mobile and Desktop)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;
			const mobileError = {
				code: 'fetching_mobile_data_failed',
				message:
					'Fetching PageSpeed Insights report with strategy mobile failed.',
			};
			const desktopError = {
				code: 'fetching_desktop_data_failed',
				message:
					'Fetching PageSpeed Insights report with strategy desktop failed.',
			};
			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveError(
				mobileError,
				'getReport',
				[ url, STRATEGY_MOBILE ]
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_MOBILE ]
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveError(
				desktopError,
				'getReport',
				[ url, STRATEGY_DESKTOP ]
			);
			dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution(
				'getReport',
				[ url, STRATEGY_DESKTOP ]
			);
			provideSiteInfo( registry, {
				referenceSiteURL: url,
			} );
			provideModules( registry, [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} );
