/**
 * Dashboard Details page stories.
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
import { removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { provideSiteInfo, provideUserAuthentication, WithTestRegistry } from '../tests/js/utils';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import DashboardDetailsApp from '../assets/js/components/dashboard-details/DashboardDetailsApp';

storiesOf( 'Dashboard Details', module )
	.add( 'Existing Entity', () => {
		// Ensure legacy widgets are not displayed. The new widgets should not be displayed either,
		// but that is already the case since the Widgets API is behind a feature flag.
		// TODO: Delete this hook removal once legacy widgets are no longer used.
		removeAllFilters( 'googlesitekit.DashboardDetailsModule' );

		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry );
			provideSiteInfo( registry, {
				currentEntityTitle: 'Test Page',
				currentEntityURL: 'https://example.com/test-page',
				currentEntityType: 'post',
				currentEntityID: 5,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardDetailsApp />
			</WithTestRegistry>
		);
	}, {
		padding: 0,
	} )
	.add( 'Not Found Entity', () => {
		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry );
			// By default, the current entity info is all `null` as needed here.
			provideSiteInfo( registry );
			registry.dispatch( CORE_SITE ).receivePermaLinkParam( 'https://example.com/invalid-page' );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardDetailsApp />
			</WithTestRegistry>
		);
	}, {
		padding: 0,
	} )
;
