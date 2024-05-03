/**
 * AudienceSegmentationErrorWidget tests.
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

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
} from '../../../../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import AudienceSegmentationErrorWidget from './AudienceSegmentationErrorWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../util/errors';

describe( 'AudienceSegmentationErrorWidget', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );
		provideUserInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	const WidgetWithComponentProps = withWidgetComponentProps(
		'audienceSegmentationErrorWidget'
	)( AudienceSegmentationErrorWidget );

	it( 'should render the default error state', async () => {
		await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: '',
				},
			},
			'getReport',
			[
				{
					metrics: [
						{
							name: 'totalUsers',
						},
					],
					dimensions: [
						{
							name: 'date',
						},
					],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const {
			container,
			getByText,
			getByRole,
			queryByText,
			waitForRegistry,
		} = render( <WidgetWithComponentProps errors={ errors } />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText( 'Your visitor groups data loading failed' )
		).toBeInTheDocument();

		expect( getByRole( 'button', { name: /retry/i } ) ).toBeInTheDocument();

		// Verify that it's not an "Insufficient permissions" error.
		expect(
			queryByText( 'Insufficient permissions' )
		).not.toBeInTheDocument();
		expect( queryByText( /request access/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render the insufficient permissions error state', async () => {
		const [ accountID, propertyID, measurementID, webDataStreamID ] = [
			'12345',
			'34567',
			'56789',
			'78901',
		];

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAccountID( accountID );
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyID( propertyID );
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( measurementID );
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setWebDataStreamID( webDataStreamID );
		await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
				},
			},
			'getAccountID'
		);

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const {
			container,
			getByText,
			getByRole,
			queryByText,
			waitForRegistry,
		} = render( <WidgetWithComponentProps errors={ errors } />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Insufficient permissions' ) ).toBeInTheDocument();

		expect(
			getByText( 'Contact your administrator. Trouble getting access?' )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /request access/i } )
		).toBeInTheDocument();

		// Verify that it's not a default error.
		expect(
			queryByText( 'Your visitor groups data loading failed' )
		).not.toBeInTheDocument();
		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );
} );
