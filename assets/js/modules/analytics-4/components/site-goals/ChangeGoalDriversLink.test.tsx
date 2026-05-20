/**
 * Site Goals ChangeGoalDriversLink tests.
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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { SITE_GOALS_SELECTION_PANEL_OPENED_KEY } from '@/js/modules/analytics-4/components/site-goals/constants';
import { fireEvent, render } from '../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../tests/js/utils';
import ChangeGoalDriversLink from './ChangeGoalDriversLink';

describe( 'ChangeGoalDriversLink', () => {
	it( 'opens selection panel when clicked', () => {
		const registry = createTestRegistry();
		registry
			.dispatch( CORE_UI )
			.setValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY, false );

		const { getByRole } = render( <ChangeGoalDriversLink />, { registry } );

		fireEvent.click( getByRole( 'button', { name: 'Select metrics' } ) );

		expect(
			registry
				.select( CORE_UI )
				.getValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );
} );
