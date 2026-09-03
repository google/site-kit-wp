/**
 * PDF export constants tests.
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
import { contexts } from '@/js/components/DashboardNavigation/Navigation/hooks/useVisibleSections';
import { DASHBOARD_TYPE_MAIN } from '@/js/hooks/useDashboardType';
import { ORDERED_MAIN_DASHBOARD_CONTEXTS } from './constants';

describe( 'ORDERED_MAIN_DASHBOARD_CONTEXTS', () => {
	it( 'lists the sections in the order the dashboard navigation shows them', () => {
		// The dashboard navigation renders one chip per entry of `contexts`,
		// in the order they are declared, so that order is the one the PDF
		// report follows.
		expect( ORDERED_MAIN_DASHBOARD_CONTEXTS ).toEqual(
			Object.values( contexts[ DASHBOARD_TYPE_MAIN ] )
		);
	} );
} );
