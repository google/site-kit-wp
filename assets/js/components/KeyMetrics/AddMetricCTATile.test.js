/**
 * Key Metrics AddMetricCTATile component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../tests/js/test-utils';
import { getWidgetComponentProps } from '../../googlesitekit/widgets/util';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import AddMetricCTATile from './AddMetricCTATile';

describe( 'AddMetricCTATile', () => {
	let registry;

	const { Widget } = getWidgetComponentProps( 'keyMetricsSetupCTA' );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should render an action to add a metric', () => {
		const { queryByRole } = render(
			<AddMetricCTATile Widget={ Widget } />,
			{ registry }
		);

		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Add a metric' );
	} );

	it( 'should set UI store key correctly when action is clicked', () => {
		registry
			.dispatch( CORE_UI )
			.setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );

		const { getByRole } = render( <AddMetricCTATile Widget={ Widget } />, {
			registry,
		} );

		const button = getByRole( 'button', { name: /add a metric/i } );

		fireEvent.click( button );

		expect(
			registry
				.select( CORE_UI )
				.getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );
} );
