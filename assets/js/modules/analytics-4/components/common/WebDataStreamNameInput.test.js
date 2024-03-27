/**
 * Analytics WebDataStreamNameInput component tests.
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

import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	FORM_SETUP,
	MODULES_ANALYTICS_4,
	WEBDATASTREAM_CREATE,
} from '../../datastore/constants';
import WebDataStreamNameInput from './WebDataStreamNameInput';
import {
	act,
	createTestRegistry,
	render,
} from '../../../../../../tests/js/test-utils';
import * as fixtures from '../../datastore/__fixtures__';

describe( 'WebDataStreamNameInput', () => {
	let registry;

	const propertyID = '1001';

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: 'http://example.com',
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreams( fixtures.webDataStreams, {
				propertyID,
			} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setWebDataStreamID( WEBDATASTREAM_CREATE );
	} );

	it( 'should not render when option to create a new web data stream is not chosen', () => {
		// Select a valid web data stream.
		registry.dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID( '2001' );

		const { container } = render( <WebDataStreamNameInput />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render when option to create a new web data stream is chosen', () => {
		const { container, getByLabelText } = render(
			<WebDataStreamNameInput />,
			{
				registry,
			}
		);

		expect( getByLabelText( /Web Data Stream Name/i ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should set value to site URL hostname by default', () => {
		const { getByDisplayValue } = render( <WebDataStreamNameInput />, {
			registry,
		} );

		expect( getByDisplayValue( /example.com/i ) ).toBeInTheDocument();
	} );

	it( 'should show error state if web data stream name already exists', () => {
		// Set the web data stream name to an existing one (in fixtures).
		registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
			webDataStreamName: 'Test GA4 WebDataStream',
		} );

		const { container } = render( <WebDataStreamNameInput />, {
			registry,
		} );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				.classList.contains( 'mdc-text-field--error' )
		).toBeTruthy();

		expect( container ).toHaveTextContent(
			'A web data stream with this name already exists.'
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should show error state if web data stream name is not set', () => {
		const { container } = render( <WebDataStreamNameInput />, {
			registry,
		} );

		// Update web data stream name to empty after initial render.
		act( () => {
			registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
				webDataStreamName: '',
			} );
		} );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				.classList.contains( 'mdc-text-field--error' )
		).toBeTruthy();

		expect( container ).toHaveTextContent(
			'A web data stream name is required.'
		);

		expect( container ).toMatchSnapshot();
	} );
} );
