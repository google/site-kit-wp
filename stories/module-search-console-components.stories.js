/**
 * Search Console Module Component Stories.
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
import DashboardClicksWidget from '../assets/js/modules/search-console/components/dashboard/DashboardClicksWidget';
import DashboardImpressionsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardImpressionsWidget';
import { STORE_NAME } from '../assets/js/modules/search-console/datastore/constants';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';
import {
	clicksAndImpressionsWidgetData,
	dashboardClicksWidgetArgs,
	dashboardImpressionsWidgetArgs,
	pageDashboardClicksWidgetArgs,
	pageDashboardImpressionsArgs,
} from '../assets/js/modules/search-console/datastore/__fixtures__';

function registrySetup( url, cb = () => {} ) {
	return ( { dispatch } ) => {
		cb( { dispatch } );

		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: null,
			currentEntityURL: url,
		} );

		dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
		] );
	};
}

function setupStories( name, data, options, Component ) {
	const stories = storiesOf( `Search Console Module/Components/Dashboard/${ name }`, module );

	const variants = {
		Loaded: ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( data, { options } )
		},
		'Data Unavailable': ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( [], { options } );
		},
		Error: ( { dispatch } ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ options ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ options ] );
		},
	};

	Object.keys( variants ).forEach( ( variant ) => {
		stories.add( variant, () => (
			<WithTestRegistry callback={ registrySetup( options.url || null, variants[ variant ] ) }>
				<Component />
			</WithTestRegistry>
		) );
	} );
}

setupStories( 'Clicks Widget', clicksAndImpressionsWidgetData, dashboardClicksWidgetArgs, DashboardClicksWidget );
setupStories( 'Clicks Widget', clicksAndImpressionsWidgetData, pageDashboardClicksWidgetArgs, DashboardClicksWidget );

setupStories( 'Impressions Widget', clicksAndImpressionsWidgetData, dashboardImpressionsWidgetArgs, DashboardImpressionsWidget );
setupStories( 'Impressions Widget', clicksAndImpressionsWidgetData, pageDashboardImpressionsArgs, DashboardImpressionsWidget );
