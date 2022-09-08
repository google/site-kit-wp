/**
 * Is inactive widget utility tests.
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
 * Internal dependencies
 */
import { isInactiveWidgetState } from './is-inactive-widget-state';
import Null from '../../../components/Null';
import ActivateAnalyticsCTA from '../../../components/ActivateAnalyticsCTA';

describe( 'isInactiveWidgetState', () => {
	it( 'returns true for an inactive widget', () => {
		const widgetState = {
			metadata: {},
			Component: Null,
		};

		expect( isInactiveWidgetState( widgetState ) ).toBe( true );
	} );

	it( 'returns false for an active widget', () => {
		const widgetState1 = {
			metadata: {},
			Component: ActivateAnalyticsCTA,
		};

		const widgetState2 = null;

		expect( isInactiveWidgetState( widgetState1 ) ).toBe( false );
		expect( isInactiveWidgetState( widgetState2 ) ).toBe( false );
	} );
} );
