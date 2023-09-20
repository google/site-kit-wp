/**
 * SetupEnhancedMeasurementSwitch tests.
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

/**
 * Internal dependencies
 */
import {
	act,
	createTestRegistry,
	render,
} from '../../../../../../tests/js/test-utils';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import SetupEnhancedMeasurementSwitch from './SetupEnhancedMeasurementSwitch';

describe( 'SetupEnhancedMeasurementSwitch', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
			accountID: '1000',
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '2000',
			webDataStreamID: '3000',
		} );
	} );

	it( 'should render correctly, with the switch defaulting to the on position', () => {
		const { container, getByLabelText } = render(
			<SetupEnhancedMeasurementSwitch />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).toBeChecked();
	} );

	it( 'should toggle the switch on click', () => {
		const { getByLabelText } = render( <SetupEnhancedMeasurementSwitch />, {
			registry,
		} );

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).toBeChecked();

		switchControl.click();

		expect( switchControl ).not.toBeChecked();
	} );

	describe.each( [
		[
			'accountID is changed',
			() => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					accountID: '1001',
				} );
			},
		],
		[
			'propertyID is changed',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: '2001',
				} );
			},
		],
		[
			'webDataStreamID is changed',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					webDataStreamID: '3001',
				} );
			},
		],
	] )( 'when the %s', ( _, changeSetting ) => {
		it( 'should revert the switch from off to on', () => {
			const { getByLabelText } = render(
				<SetupEnhancedMeasurementSwitch />,
				{
					registry,
				}
			);

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			switchControl.click();

			expect( switchControl ).not.toBeChecked();

			act( changeSetting );

			expect( switchControl ).toBeChecked();
		} );

		it( 'should not toggle the switch from on to off', () => {
			const { getByLabelText } = render(
				<SetupEnhancedMeasurementSwitch />,
				{
					registry,
				}
			);

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			expect( switchControl ).toBeChecked();

			act( changeSetting );

			expect( switchControl ).toBeChecked();
		} );
	} );
} );
