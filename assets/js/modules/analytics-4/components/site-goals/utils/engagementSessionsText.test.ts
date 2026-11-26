/**
 * Site Goals engagement sessions caption tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Internal dependencies
 */
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { getEngagementSessionsSubtitle } from './engagementSessionsText';

describe( 'getEngagementSessionsSubtitle', () => {
	it( 'should show the total sessions without a breakdown', () => {
		expect( getEngagementSessionsSubtitle( 1250 ) ).toBe(
			'of 1,250 total sessions'
		);
	} );

	it( 'should name the plugin sessions on an ecommerce plugin breakdown', () => {
		expect(
			getEngagementSessionsSubtitle( 29, GOAL_TYPES.ECOMMERCE )
		).toBe( 'of 29 sessions with this plugin' );
	} );

	it( 'should name the form sessions on a form breakdown', () => {
		expect( getEngagementSessionsSubtitle( 29, GOAL_TYPES.LEAD ) ).toBe(
			'of 29 sessions with this form'
		);
	} );
} );
