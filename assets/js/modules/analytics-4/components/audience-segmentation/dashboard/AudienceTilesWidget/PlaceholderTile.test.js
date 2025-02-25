/**
 * PlaceholderTile component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';
import PlaceholderTile from './PlaceholderTile';

describe( 'PlaceholderTile', () => {
	let registry;

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceTiles'
	)( PlaceholderTile );

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: availableAudiences.reduce( ( acc, { name } ) => {
					acc[ name ] = 20201220;
					return acc;
				}, {} ),
				customDimension: {},
				property: {},
			} );
	} );

	describe( 'when there are configurable non default audiences available', () => {
		beforeEach( () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				availableAudiences,
			} );
		} );

		it( 'should render correctly', () => {
			const { container, getByText } = render(
				<WidgetWithComponentProps />,
				{
					registry,
				}
			);

			expect(
				getByText( 'Compare your group to other groups' )
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should show a button that opens the Selection Panel to select another group', () => {
			const { getByRole } = render( <WidgetWithComponentProps />, {
				registry,
			} );

			const button = getByRole( 'button', { name: /Select/ } );

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBeUndefined();

			fireEvent.click( button );

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );
	} );

	it( 'should render correctly when there are no configurable non default audiences available', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableAudiences: availableAudiences.filter(
				( { audienceType } ) => audienceType === 'DEFAULT_AUDIENCE'
			),
		} );

		const { container, getByText } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( getByText( 'Create more visitor groups' ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
