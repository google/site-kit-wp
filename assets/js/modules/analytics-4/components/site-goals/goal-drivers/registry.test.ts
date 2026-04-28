/**
 * Goal driver registry tests.
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
import { GOAL_DRIVER_IDS } from './constants';
import { resolveGoalDriverIDs } from './registry';

describe( 'resolveGoalDriverIDs', () => {
	it( 'returns defaults sorted by order when no IDs are provided', () => {
		expect( resolveGoalDriverIDs() ).toEqual( [
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
			GOAL_DRIVER_IDS.TOP_PAGES,
			GOAL_DRIVER_IDS.VISITOR_TYPE,
		] );
	} );

	it( 'returns selected IDs preserving selected order', () => {
		expect(
			resolveGoalDriverIDs( [
				GOAL_DRIVER_IDS.VISITOR_TYPE,
				GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
			] )
		).toEqual( [
			GOAL_DRIVER_IDS.VISITOR_TYPE,
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
		] );
	} );

	it( 'filters unknown IDs safely', () => {
		expect(
			resolveGoalDriverIDs( [
				'unsupportedGoalDriver',
				GOAL_DRIVER_IDS.TOP_PAGES,
				'anotherUnsupportedGoalDriver',
			] )
		).toEqual( [ GOAL_DRIVER_IDS.TOP_PAGES ] );
	} );
} );
