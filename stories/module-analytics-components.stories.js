/**
 * Analytics Module Component Stories.
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
import DashboardAllTrafficWidget from '../assets/js/modules/analytics/components/dashboard/DashboardAllTrafficWidget';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';
import {
	dashboardAllTrafficArgs,
	dashboardAllTrafficData,
	pageDashboardAllTrafficArgs,
	pageDashboardAllTrafficData,
} from '../assets/js/modules/analytics/datastore/__fixtures__';

function allTrafficWidgetRegistrySetup( url, cb = () => {} ) {
	return ( { dispatch } ) => {
		cb( { dispatch } );

		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: null,
			currentEntityURL: url,
		} );

		dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	};
}

function dashboardAllTrafficRegistrySetup( cb ) {
	return allTrafficWidgetRegistrySetup( null, cb );
}

function pageDashboardAllTrafficRegistrySetup( cb ) {
	return allTrafficWidgetRegistrySetup( pageDashboardAllTrafficArgs.url, cb );
}

storiesOf( 'Analytics Module/Components/Dashboard/All Traffic Widget', module )
	.add( 'Loaded', () => {
		const setupRegistry = dashboardAllTrafficRegistrySetup( ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport(
				dashboardAllTrafficData,
				{ options: dashboardAllTrafficArgs },
			);
		} );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardAllTrafficWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Data Unavailable', () => {
		const setupRegistry = dashboardAllTrafficRegistrySetup( ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport(
				[],
				{ options: dashboardAllTrafficArgs },
			);
		} );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardAllTrafficWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Error', () => {
		const setupRegistry = dashboardAllTrafficRegistrySetup( ( { dispatch } ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ dashboardAllTrafficArgs ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ dashboardAllTrafficArgs ] );
		} );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardAllTrafficWidget />
			</WithTestRegistry>
		);
	} );

storiesOf( 'Analytics Module/Components/Page Dashboard/All Traffic Widget', module )
	.add( 'Loaded', () => {
		const setupRegistry = pageDashboardAllTrafficRegistrySetup( ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport(
				pageDashboardAllTrafficData,
				{ options: pageDashboardAllTrafficArgs },
			);
		} );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardAllTrafficWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Data Unavailable', () => {
		const setupRegistry = pageDashboardAllTrafficRegistrySetup( ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport(
				[],
				{ options: pageDashboardAllTrafficArgs },
			);
		} );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardAllTrafficWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Error', () => {
		const setupRegistry = pageDashboardAllTrafficRegistrySetup( ( { dispatch } ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ pageDashboardAllTrafficArgs ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ pageDashboardAllTrafficArgs ] );
		} );

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardAllTrafficWidget />
			</WithTestRegistry>
		);
	} );
