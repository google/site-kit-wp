/**
 * PropertyOrWebDataStreamNotAvailableError component tests.
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
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import * as fixtures from '../../../analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import PropertyOrWebDataStreamNotAvailableError from './PropertyOrWebDataStreamNotAvailableError';

const accountID = fixtures.properties[ 0 ]._accountID;
const propertyID = fixtures.properties[ 0 ]._id;
const measurementID =
	fixtures.webDataStreamsBatchSetup[ 1000 ][ 0 ].webStreamData.measurementId; // eslint-disable-line sitekit/acronym-case

const provideGA4PropertyAndWebDataStream = ( registry ) => {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetProperties( fixtures.properties, {
			accountID,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetWebDataStreamsBatch( fixtures.webDataStreamsBatchSetup, {
			propertyIDs: Object.keys( fixtures.webDataStreamsBatchSetup ),
		} );
};

describe( 'PropertyOrWebDataStreamNotAvailableError', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );

		registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( measurementID );
	} );

	it( 'should not render when properties are not loaded yet', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/properties'
			)
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( fixtures.webDataStreamsBatchSetup, {
				propertyIDs: Object.keys( fixtures.webDataStreamsBatchSetup ),
			} );

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess
				isDisabled={ false }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when Web Data Streams are not loaded yet', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams'
			)
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( fixtures.properties, {
				accountID,
			} );

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess
				isDisabled={ false }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when selected property and Web Data Stream are available', () => {
		provideGA4PropertyAndWebDataStream( registry );

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess
				isDisabled={ false }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when user does not have module access', () => {
		provideGA4PropertyAndWebDataStream( registry );

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess={ false }
				isDisabled={ false }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when GA4 fields are disabled', () => {
		provideGA4PropertyAndWebDataStream( registry );

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess
				isDisabled
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render error message when selected Web Data Stream is not available', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( fixtures.properties, {
				accountID,
			} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreamsBatch(
			{ 1000: [] },
			{
				propertyIDs: [ '1000' ],
			}
		);

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess
				isDisabled={ false }
			/>,
			{ registry }
		);

		expect( container ).toHaveTextContent(
			`The previously selected web data stream with measurement ID ${ measurementID } is no longer available.`
		);
	} );

	it( 'should render error message when selected property is not available', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
			accountID,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( fixtures.webDataStreamsBatchSetup, {
				propertyIDs: Object.keys( fixtures.webDataStreamsBatchSetup ),
			} );

		const { container } = render(
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess
				isDisabled={ false }
			/>,
			{ registry }
		);

		expect( container ).toHaveTextContent(
			`The previously selected property with ID ${ propertyID } is no longer available.`
		);
	} );
} );
