/**
 * HOC whenScopesGranted tests.
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
import { render } from '../../../tests/js/test-utils';
import { createTestRegistry, subscribeUntil } from '../../../tests/js/utils';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import whenScopesGranted from './whenScopesGranted';

describe( 'whenScopesGranted', () => {
	let registry;

	function TestComponent() {
		return <div data-testid="component" />;
	}
	function TestFallbackComponent() {
		return <div data-testid="fallback-component" />;
	}
	function FakeWidgetNull() {
		return <div data-testid="widget-null" />;
	}

	async function loadScopes( registryReference, scopes = [] ) {
		const coreUserDataEndpointRegExp = new RegExp(
			'^/google-site-kit/v1/core/user/data/authentication'
		);

		fetchMock.getOnce( coreUserDataEndpointRegExp, {
			body: {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: scopes,
				unsatisfiedScopes: [],
			},
			status: 200,
		} );

		registryReference.select( CORE_USER ).hasScope( scopes );
		await subscribeUntil( registryReference, () =>
			registryReference
				.select( CORE_USER )
				.hasFinishedResolution( 'getAuthentication' )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders nothing (`null`) when scopes are loading', async () => {
		await loadScopes( registry );

		const WhenScopesGrantedComponent = whenScopesGranted( {
			scopes: [ 'loading' ],
		} )( TestComponent );

		const { container, queryByTestID } = render(
			<WhenScopesGrantedComponent />,
			{
				registry,
			}
		);

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the given component when all scopes are present', async () => {
		await loadScopes( registry, [ 'https://test.net/testing' ] );

		const WhenScopesGrantedComponent = whenScopesGranted( {
			scopes: [ 'https://test.net/testing' ],
			FallbackComponent: TestFallbackComponent,
		} )( TestComponent );

		const { queryByTestID } = render( <WhenScopesGrantedComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );

	it( 'renders the fallback component when some, but not all, scopes are present', async () => {
		await loadScopes( registry, [ 'https://test.net/testing' ] );

		const WhenScopesGrantedComponent = whenScopesGranted( {
			scopes: [
				'https://test.net/testing',
				'https://otherscope.com/i-am-not-here',
			],
			FallbackComponent: TestFallbackComponent,
		} )( TestComponent );

		const { queryByTestID } = render( <WhenScopesGrantedComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'fallback-component' ) ).toBeInTheDocument();
	} );

	it( 'renders the fallback component when none of the scopes are present', async () => {
		await loadScopes( registry, [] );

		const WhenScopesGrantedComponent = whenScopesGranted( {
			scopes: [
				'https://test.net/testing',
				'https://otherscope.com/i-am-not-here',
			],
			FallbackComponent: TestFallbackComponent,
		} )( TestComponent );

		const { queryByTestID } = render( <WhenScopesGrantedComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'fallback-component' ) ).toBeInTheDocument();
	} );

	it( 'renders `WidgetNull` from the components ownProps for the default `FallbackComponent`', async () => {
		await loadScopes( registry, [] );

		const WhenScopesGrantedComponent = whenScopesGranted( {
			scopes: [
				'https://test.net/testing',
				'https://otherscope.com/i-am-not-here',
			],
		} )( TestComponent );

		const { queryByTestID } = render(
			<WhenScopesGrantedComponent WidgetNull={ FakeWidgetNull } />,
			{
				registry,
			}
		);

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'widget-null' ) ).toBeInTheDocument();
	} );
} );
