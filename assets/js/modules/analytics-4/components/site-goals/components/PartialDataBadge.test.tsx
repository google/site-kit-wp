/**
 * Site Goals PartialDataBadge tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import PartialDataBadge from './PartialDataBadge';

describe( 'PartialDataBadge', () => {
	const SLUG = 'googlesitekit_event_provider';

	function setupRegistry( availabilityDate: number ) {
		const registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			resourceAvailabilityDates: {
				customDimension: { [ SLUG ]: availabilityDate },
			},
		} );
		return registry;
	}

	it( 'renders the partial data label with an info tooltip when partial', () => {
		// An availability date after the reference range → partial data state.
		const registry = setupRegistry( 20260519 );

		const { container, getByText } = render(
			<PartialDataBadge customDimensionSlug={ SLUG } />,
			{ registry }
		);

		expect( getByText( 'Partial data' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-info-tooltip' )
		).toBeInTheDocument();
	} );

	it( 'renders nothing when the dimension is not in partial data state', () => {
		// An availability date before the reference range → full data state.
		const registry = setupRegistry( 20200101 );

		const { container, queryByText } = render(
			<PartialDataBadge customDimensionSlug={ SLUG } />,
			{ registry }
		);

		expect( queryByText( 'Partial data' ) ).not.toBeInTheDocument();
		expect( container ).toBeEmptyDOMElement();
	} );
} );
