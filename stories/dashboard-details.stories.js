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

/**
 * Internal dependencies
 */
import { provideSiteInfo, provideUserAuthentication, WithTestRegistry } from '../tests/js/utils';
import DashboardDetailsApp from '../assets/js/components/dashboard-details/dashboard-details-app';
import DashboardDetailsEntityNotFoundView from '../assets/js/components/dashboard-details/DashboardDetailsEntityNotFoundView';

storiesOf( 'Dashboard Details', module )
	.add( 'Existing Entity', () => {
		global.featureFlags = {
			widgets: {
				pageDashboard: {
					enabled: false,
				},
			},
		};

		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry );
			provideSiteInfo( registry, {
				currentEntityTitle: 'Test Page',
				currentEntityURL: 'https://example.com/test-page',
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<DashboardDetailsApp />
			</WithTestRegistry>
		);
	} )
	.add( 'Not Found Entity', () => (
		<DashboardDetailsEntityNotFoundView permalink="https://example.com/test-page" />
	) )
;
