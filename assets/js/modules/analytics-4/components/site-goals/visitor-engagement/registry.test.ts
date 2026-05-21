/**
 * Site Goals Visitor Engagement registry tests.
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
import {
	resolveVisitorEngagementEventIDs,
	VISITOR_ENGAGEMENT_EVENT_IDS,
} from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';

describe( 'Visitor Engagement registry', () => {
	describe( 'resolveVisitorEngagementEventIDs', () => {
		it( 'returns default-enabled events when no selection is provided', () => {
			expect( resolveVisitorEngagementEventIDs() ).toEqual( [
				VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART,
			] );
		} );

		it( 'filters unknown event IDs', () => {
			expect(
				resolveVisitorEngagementEventIDs( [
					'unknown_event',
					VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART,
				] )
			).toEqual( [ VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART ] );
		} );

		it( 'orders events according to the registry', () => {
			expect(
				resolveVisitorEngagementEventIDs( [
					VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART,
				] )
			).toEqual( [ VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART ] );
		} );

		it( 'returns no events for lead generation in this iteration', () => {
			expect(
				resolveVisitorEngagementEventIDs( undefined, GOAL_TYPES.LEAD )
			).toEqual( [] );
		} );
	} );
} );
