/**
 * `withData` tests.
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
 * WordPress dependencies
 */
import { addAction, hasFilter, removeAllActions, removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import withData from './withData';
import { render, act } from '../../../../tests/js/test-utils';
import dataAPI, { TYPE_MODULES } from '../data';
import { getCacheKey } from '../data/cache';
import { provideModules, provideSiteInfo, provideUserAuthentication } from '../../../../tests/js/utils';
import { CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { createModuleStore } from '../../googlesitekit/modules/create-module-store';

const collectModuleData = dataAPI.collectModuleData.bind( dataAPI );

describe( 'withData', () => {
	let TestComponent;
	const context = 'TestContext';
	// A placeholder dateRange is used to allow for getting a stable cache key for the dataset.
	const dateRange = 'last-99-days';
	// The `loadingComponent` argument to withData is actually an element/node, not a component type.
	const loadingComponent = <div data-testid="loading-component">loading</div>;
	const testModule = {
		slug: 'test',
		name: 'Test Module',
		active: true,
		setupComplete: true,
	};
	const testModuleAlt = {
		slug: 'test-alt',
		name: 'Alternate Test Module',
		active: true,
		setupComplete: true,
	};

	const createDataset = ( type, identifier, datapoint, data, _context = context ) => ( { type, identifier, datapoint, data, context: _context } );
	const getCacheKeyForDataset = ( { type, identifier, datapoint, data } ) => getCacheKey( type, identifier, datapoint, data );
	// Registry setup is only needed for integration with the new activate and complete module activation components.
	const setupRegistry = ( registry ) => {
		provideModules( registry, [ testModule ] );
		provideUserAuthentication( registry );
		provideSiteInfo( registry );
		// Module registration is now required by CompleteModuleActivationCTA to display.
		const registerModule = ( slug ) => {
			const storeName = `test/${ slug }`;
			const store = createModuleStore( slug, { storeName } );
			registry.registerStore( storeName, store );
			registry.dispatch( CORE_MODULES ).registerModule( slug, { storeName } );
		};
		registerModule( testModule.slug );
		registerModule( testModuleAlt.slug );
		registry.dispatch( CORE_USER ).receiveCapabilities( { [ PERMISSION_MANAGE_OPTIONS ]: true } );
	};

	beforeEach( () => {
		TestComponent = jest.fn(
			() => <div data-testid="test-component">Test</div>
		);
		removeAllActions( 'googlesitekit.dataLoaded' );
		removeAllFilters( `googlesitekit.module${ context }DataRequest` );
	} );

	afterEach( () => {
		delete global._googlesitekitLegacyData.modules[ testModule.slug ];
		delete global._googlesitekitLegacyData.modules[ testModuleAlt.slug ];
	} );

	it( 'supports datasets with single or multiple contexts', () => {
		const datasetCommon = [ 'test', 'test-identifier', 'test-datapoint', {} ];
		const singleContextDataset = createDataset( ...datasetCommon, 'context_a' );
		const multipleContextDataset = createDataset( ...datasetCommon, [ 'context_y', 'context_z' ] );
		const hasFilterForContext = ( _context ) => hasFilter( `googlesitekit.module${ _context }DataRequest` );

		const WrappedComponent = withData( TestComponent, [ singleContextDataset, multipleContextDataset ] );

		expect( hasFilterForContext( 'context_a' ) ).toBe( false );
		expect( hasFilterForContext( 'context_y' ) ).toBe( false );
		expect( hasFilterForContext( 'context_z' ) ).toBe( false );

		render( <WrappedComponent /> );

		expect( hasFilterForContext( 'context_a' ) ).toBe( true );
		expect( hasFilterForContext( 'context_y' ) ).toBe( true );
		expect( hasFilterForContext( 'context_z' ) ).toBe( true );
	} );

	it( 'renders the loading component when there is no data yet', () => {
		const WrappedComponent = withData( TestComponent, [], loadingComponent );

		const { container, queryByTestID } = render( <WrappedComponent /> );

		expect( queryByTestID( 'test-component' ) ).not.toBeInTheDocument();
		expect( container.firstChild ).toBe( queryByTestID( 'loading-component' ) );
	} );

	it( 'renders the data dependent component when there is data', async () => {
		const [ type, identifier, datapoint, data ] = [ 'test', 'test-identifier', 'test-datapoint', { dateRange } ];
		const toState = () => {};
		const dataset = { type, identifier, datapoint, data, context, toState };
		const WrappedComponent = withData( TestComponent, [ dataset ] );

		const { container, queryByTestID } = render( <WrappedComponent arbitraryProp="oh yeah" /> );

		const responseData = { foo: 'bar' };
		fetchMock.postOnce(
			/^\/google-site-kit\/v1\/data/,
			{ body: { [ getCacheKeyForDataset( dataset ) ]: responseData } }
		);
		await act(
			() => new Promise( ( resolve ) => {
				addAction( 'googlesitekit.dataLoaded', 'test.resolve', resolve );
				collectModuleData( context );
			} )
		);

		expect( container.firstChild ).toBe( queryByTestID( 'test-component' ) );
		expect( queryByTestID( 'loading-component' ) ).not.toBeInTheDocument();
		// Check props that were passed to the data dependent component.
		expect( TestComponent.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			data: responseData,
			datapoint,
			requestDataToState: toState,
			arbitraryProp: 'oh yeah', // All other props are passed through.
		} );
	} );

	it( 'renders the setup incomplete component when requesting data for a module with incomplete setup', () => {
		global._googlesitekitLegacyData.modules[ testModule.slug ] = { ...testModule, setupComplete: false };
		const dataset = createDataset( TYPE_MODULES, testModule.slug, 'test-datapoint', { dateRange } );
		const WrappedComponent = withData( TestComponent, [ dataset ] );

		const { container, queryByTestID } = render( <WrappedComponent />, { setupRegistry } );

		collectModuleData( context );

		expect( queryByTestID( 'test-component' ) ).not.toBeInTheDocument();
		expect( container.querySelector( '.googlesitekit-cta__title' ) ).toHaveTextContent( 'Test Module activation' );
		expect( container.querySelector( '.googlesitekit-cta__description' ) ).toHaveTextContent( 'Test Module module setup needs to be completed' );
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'renders the setup incomplete component when requesting data from any module with incomplete setup', async () => {
		global._googlesitekitLegacyData.modules[ testModule.slug ] = { ...testModule, setupComplete: false };
		global._googlesitekitLegacyData.modules[ testModuleAlt.slug ] = testModuleAlt;

		const requests = [
			createDataset( TYPE_MODULES, testModule.slug, 'test-datapoint', { dateRange } ),
			createDataset( TYPE_MODULES, testModuleAlt.slug, 'test-datapoint', { dateRange } ),
		];
		const WrappedComponent = withData( TestComponent, requests, loadingComponent );

		const { container, queryByTestID } = render( <WrappedComponent />, { setupRegistry } );

		// testModuleAlt's request will not be filtered out because its setup is complete so a request is expected.
		const body = {
			[ getCacheKeyForDataset( requests[ 1 ] ) ]: { foo: 'bar' },
		};
		fetchMock.postOnce( /^\/google-site-kit\/v1\/data/, { body } );
		await act(
			() => new Promise( ( resolve ) => {
				addAction( 'googlesitekit.dataLoaded', 'test.resolve', resolve );
				collectModuleData( context );
			} )
		);

		expect( queryByTestID( 'test-component' ) ).not.toBeInTheDocument();
		expect( container.querySelector( '.googlesitekit-cta__title' ) ).toHaveTextContent( 'Test Module activation' );
		expect( container.querySelector( '.googlesitekit-cta__description' ) ).toHaveTextContent( 'Test Module module setup needs to be completed' );
		expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/data/ );
	} );

	it( 'renders the error component when an error is returned for any request', async () => {
		global._googlesitekitLegacyData.modules[ testModule.slug ] = testModule;

		const requests = [
			createDataset( TYPE_MODULES, testModule.slug, 'test-datapoint-a', { dateRange } ),
			createDataset( TYPE_MODULES, testModule.slug, 'test-datapoint-b', { dateRange } ),
		];
		const WrappedComponent = withData( TestComponent, requests, loadingComponent );

		const { container, queryByTestID } = render( <WrappedComponent /> );

		const error = { code: 'test_error', message: 'Error!', data: { status: 500 } };
		const body = {
			[ getCacheKeyForDataset( requests[ 0 ] ) ]: error,
			[ getCacheKeyForDataset( requests[ 1 ] ) ]: { foo: 'some data' },
		};
		fetchMock.postOnce( /^\/google-site-kit\/v1\/data/, { body } );
		await act(
			() => new Promise( ( resolve ) => {
				addAction( 'googlesitekit.dataLoaded', 'test.resolve', resolve );
				collectModuleData( context );
			} )
		);

		expect( queryByTestID( 'test-component' ) ).not.toBeInTheDocument();
		expect( container.querySelector( '.googlesitekit-cta__title' ) ).toHaveTextContent( 'Data error in Test Module' );
		expect( container.querySelector( '.googlesitekit-cta__description' ) ).toHaveTextContent( error.message );
		expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/data/ );
		expect( console ).toHaveWarned();
	} );

	it( 'renders the no data component when isDataZero returns `true` for the returned data', async () => {
		global._googlesitekitLegacyData.modules[ testModule.slug ] = testModule;
		const dataset = createDataset( TYPE_MODULES, testModule.slug, 'test-datapoint', { dateRange } );
		const isDataZero = jest.fn( ( data ) => data.hasAnything === 'no' );
		const WrappedComponent = withData( TestComponent, [ dataset ], loadingComponent, {}, isDataZero );

		const { container, queryByTestID } = render( <WrappedComponent /> );

		const responseData = { hasAnything: 'no', foo: 'bar', something: 'else' };
		const body = {
			[ getCacheKeyForDataset( dataset ) ]: responseData,
		};
		fetchMock.postOnce( /^\/google-site-kit\/v1\/data/, { body } );
		await act(
			() => new Promise( ( resolve ) => {
				addAction( 'googlesitekit.dataLoaded', 'test.resolve', resolve );
				collectModuleData( context );
			} )
		);

		expect( isDataZero ).toHaveBeenCalledWith( responseData, 'test-datapoint', dataset );
		expect( queryByTestID( 'test-component' ) ).not.toBeInTheDocument();
		expect( container.querySelector( '.googlesitekit-cta__title' ) ).toHaveTextContent( 'Test Module Gathering Data' );
		expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/data/ );
	} );
} );
