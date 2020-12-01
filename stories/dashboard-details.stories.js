/**
 * Dashboard Details page stories.
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
import set from 'lodash/set';

/**
 * WordPress dependencies
 */
import { removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { provideSiteInfo, provideUserAuthentication, WithTestRegistry } from '../tests/js/utils';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import DashboardDetailsApp from '../assets/js/components/dashboard-details/dashboard-details-app';
import { enableFeature } from './utils/features';

storiesOf( 'Dashboard Details', module )
	.add( 'Existing Entity', () => {
		// Ensure feature flag for Header component exists.
		enableFeature( 'storeErrorNotifications' );

		// Ensure widget API is disabled and don't display legacy widgets either.
		// TODO: Expand this story to include new widgets once legacy widgets are no longer used.
		enableFeature( 'widgets.pageDashboard' );
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
	} )
;
