/**
 * PageSpeed Insights Module Component Stories.
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
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import DashboardPageSpeedWidget from '../assets/js/modules/pagespeed-insights/components/dashboard/DashboardPageSpeedWidget';
import { STORE_NAME } from '../assets/js/modules/pagespeed-insights/datastore';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../assets/js/googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import * as fixtures from '../assets/js/modules/pagespeed-insights/datastore/__fixtures__';
import { STRATEGY_MOBILE, STRATEGY_DESKTOP } from '../assets/js/modules/pagespeed-insights/datastore/constants';
import { WithTestRegistry, freezeFetch } from '../tests/js/utils';

storiesOf( 'PageSpeed Insights Module/Components', module )
	.add( 'Dashboard widget', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobile, { url, strategy: STRATEGY_MOBILE } );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_MOBILE ] );

			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktop, { url, strategy: STRATEGY_DESKTOP } );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_DESKTOP ] );

			dispatch( CORE_SITE ).receiveSiteInfo( {
				referenceSiteURL: url,
				currentEntityURL: null,
			} );
			dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (loading)', () => {
		freezeFetch( /^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/ );
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			// Component will be loading as long as both reports are not present.
			// Omit receiving mobile here to trigger the request only once.
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktop, { url, strategy: STRATEGY_DESKTOP } );
			dispatch( CORE_SITE ).receiveSiteInfo( {
				referenceSiteURL: url,
				currentEntityURL: null,
			} );
			dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (Field Data Unavailable)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobileNoFieldData, { url, strategy: STRATEGY_MOBILE } );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_MOBILE ] );

			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktopNoFieldData, { url, strategy: STRATEGY_DESKTOP } );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_DESKTOP ] );

			dispatch( CORE_SITE ).receiveSiteInfo( {
				referenceSiteURL: url,
				currentEntityURL: null,
			} );
			dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (Errors for Mobile and Desktop)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			const mobileError = {
				code: 'fetching_mobile_data_failed',
				message: 'Fetching PageSpeed Insights report with strategy mobile failed.',
			};
			const desktopError = {
				code: 'fetching_desktop_data_failed',
				message: 'Fetching PageSpeed Insights report with strategy desktop failed.',
			};
			dispatch( STORE_NAME ).receiveError( mobileError, 'getReport', [ url, STRATEGY_MOBILE ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_MOBILE ] );
			dispatch( STORE_NAME ).receiveError( desktopError, 'getReport', [ url, STRATEGY_DESKTOP ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_DESKTOP ] );
			dispatch( CORE_SITE ).receiveSiteInfo( {
				referenceSiteURL: url,
				currentEntityURL: null,
			} );
			dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'pagespeed-insights',
					active: true,
					connected: true,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (CTA)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				referenceSiteURL: url,
				currentEntityURL: null,
			} );
			dispatch( CORE_USER ).receiveCapabilities( {
				[ PERMISSION_MANAGE_OPTIONS ]: true,
			} );
			dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'pagespeed-insights',
					active: false,
					connected: false,
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardPageSpeedWidget />
			</WithTestRegistry>
		);
	} )
;
