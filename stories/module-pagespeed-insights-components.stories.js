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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Layout from '../assets/js/components/layout/layout';
import DashboardPageSpeed from '../assets/js/modules/pagespeed-insights/components/DashboardPageSpeed';
import { STORE_NAME } from '../assets/js/modules/pagespeed-insights/datastore';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import * as fixtures from '../assets/js/modules/pagespeed-insights/datastore/__fixtures__';
import { STRATEGY_MOBILE, STRATEGY_DESKTOP } from '../assets/js/modules/pagespeed-insights/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';
import fetchMock from 'fetch-mock';

function WithNoPermalink( { children } ) {
	useEffect( () => {
		// Backup the permalink.
		const { permaLink } = global._googlesitekitLegacyData;
		// Delete the permaLink from global state when mounting.
		delete global._googlesitekitLegacyData.permaLink;
		// Restore the permalink in global state when unmounting.
		return () => ( global._googlesitekitLegacyData.permaLink = permaLink );
	}, [] );

	return children;
}

storiesOf( 'PageSpeed Insights Module/Components', module )
	// Render these stories without the legacy permalink global which has a different URL than we provide the report for.
	// In the future, this can be removed when the permalink is accessed via the datastore.
	.addDecorator( ( storyFn ) => <WithNoPermalink>{ storyFn() }</WithNoPermalink> )
	.add( 'Dashboard widget', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobile, { url, strategy: STRATEGY_MOBILE } );
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktop, { url, strategy: STRATEGY_DESKTOP } );
			dispatch( CORE_SITE ).receiveSiteInfo( { referenceSiteURL: url } );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Layout>
					<DashboardPageSpeed />
				</Layout>
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (loading)', () => {
		fetchMock.getOnce(
			/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/,
			new Promise( () => {} ) // Never returns a response for perpetual loading.
		);
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			// Component will be loading as long as both reports are not present.
			// Omit receiving mobile here to trigger the request only once.
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktop, { url, strategy: STRATEGY_DESKTOP } );
			dispatch( CORE_SITE ).receiveSiteInfo( { referenceSiteURL: url } );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Layout>
					<DashboardPageSpeed />
				</Layout>
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard widget (Field Data Unavailable)', () => {
		const url = fixtures.pagespeedMobile.loadingExperience.id;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobileNoFieldData, { url, strategy: STRATEGY_MOBILE } );
			dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktopNoFieldData, { url, strategy: STRATEGY_DESKTOP } );
			dispatch( CORE_SITE ).receiveSiteInfo( { referenceSiteURL: url } );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Layout>
					<DashboardPageSpeed />
				</Layout>
			</WithTestRegistry>
		);
	} )
;
