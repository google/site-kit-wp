/**
 * InstructionInformation component tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import apiFetchMock from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import InstructionInformation from './InstructionInformation';
import { render } from '../../../../../tests/js/test-utils';
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as CORE_MODULE } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import * as fixtures from '../datastore/__fixtures__';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
} );

const allParamsRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( 'OPT-1234567' );
	registry.dispatch( CORE_MODULE ).receiveGetModules( fixtures.analyticsActivate );
};

const noAmpModeModeRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( 'OPT-1234567' );
};

const falseUseSnippetRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( 'OPT-1234567' );
	registry.dispatch( CORE_MODULE ).receiveGetModules( fixtures.analyticsActivate );
	registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
};

const invalidAmpExperimentJSONRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( 'OPT-1234567' );
	registry.dispatch( CORE_MODULE ).receiveGetModules( fixtures.analyticsGtmActivate );
	registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );
};

describe( 'InstructionInformation', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'should render with analytics active and no useSnippet', () => {
		const { container } = render( <InstructionInformation />, { setupRegistry: allParamsRegistry } );

		const selectedText = container.querySelector( 'p' );
		expect( selectedText ).toHaveTextContent( 'You disabled analytics auto insert snippet. If You are using Google Analytics code snippet, add the code below:' );
	} );
	it( 'should not render tagmanger and anylytics inactive', () => {
		const { container } = render( <InstructionInformation />, { setupRegistry: noAmpModeModeRegistry } );

		expect( container.querySelector( 'p' ) ).toEqual( null );
	} );
	it( 'should not render with analytics active and a useSnippet', () => {
		const { container } = render( <InstructionInformation />, { setupRegistry: falseUseSnippetRegistry } );

		expect( container.querySelector( 'p' ) ).toEqual( null );
	} );
	it( 'should render with analytics active and no analytics useSnippet, also with tagmanager active and a gtm useSnippet', () => {
		const { container } = render( <InstructionInformation />, { setupRegistry: invalidAmpExperimentJSONRegistry } );

		const selectedText = container.querySelector( 'p' );
		expect( selectedText ).toHaveTextContent( 'You are using auto insert snippet with Tag Manager' );
	} );
} );
