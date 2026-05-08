/**
 * HOC whenActive tests.
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
 * Internal dependencies
 */
import { render } from '../../../tests/js/test-utils';
import { createTestRegistry, provideModules } from '../../../tests/js/utils';
import whenActive from './when-active';

describe( 'whenActive', () => {
	let registry;
	const slug = 'test-module';

	function TestComponent() {
		return <div data-testid="component" />;
	}
	function TestFallbackComponent() {
		return <div data-testid="fallback-component" />;
	}
	function TestIncompleteComponent() {
		return <div data-testid="incomplete-component" />;
	}
	function FakeWidgetNull() {
		return <div data-testid="widget-null" />;
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders nothing for modules that have not been registered', () => {
		provideModules( registry );
		const WhenActiveComponent = whenActive( { moduleName: slug } )(
			TestComponent
		);

		const { queryByTestID } = render( <WhenActiveComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the given component when the module is active and connected', () => {
		provideModules( registry, [ { slug, active: true, connected: true } ] );
		const WhenActiveComponent = whenActive( { moduleName: slug } )(
			TestComponent
		);

		const { queryByTestID } = render( <WhenActiveComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );

	it( 'renders the given `FallbackComponent` when the module is not active', () => {
		provideModules( registry, [ { slug, active: false } ] );
		const WhenActiveComponent = whenActive( {
			moduleName: slug,
			FallbackComponent: TestFallbackComponent,
		} )( TestComponent );

		const { queryByTestID } = render( <WhenActiveComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'fallback-component' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when the module is not active and no `FallbackComponent` is provided', () => {
		provideModules( registry, [ { slug, active: false } ] );
		const WhenActiveComponent = whenActive( { moduleName: slug } )(
			TestComponent
		);

		const { queryByTestID } = render( <WhenActiveComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the given `IncompleteComponent` when the module is active, but not connected', () => {
		provideModules( registry, [
			{ slug, active: true, connected: false },
		] );
		const WhenActiveComponent = whenActive( {
			moduleName: slug,
			FallbackComponent: TestFallbackComponent,
			IncompleteComponent: TestIncompleteComponent,
		} )( TestComponent );

		const { queryByTestID } = render( <WhenActiveComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'fallback-component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'incomplete-component' ) ).toBeInTheDocument();
	} );

	it( 'renders the given `FallbackComponent` when the module is active, but not connected, and no `IncompleteComponent` is provided', () => {
		provideModules( registry, [
			{ slug, active: true, connected: false },
		] );
		const WhenActiveComponent = whenActive( {
			moduleName: slug,
			FallbackComponent: TestFallbackComponent,
		} )( TestComponent );

		const { queryByTestID } = render( <WhenActiveComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'fallback-component' ) ).toBeInTheDocument();
	} );

	it( 'renders `WidgetNull` from the components ownProps for the default `FallbackComponent`', () => {
		provideModules( registry, [ { slug, active: false } ] );
		const WhenActiveComponent = whenActive( {
			moduleName: slug,
		} )( TestComponent );

		const { queryByTestID } = render(
			<WhenActiveComponent WidgetNull={ FakeWidgetNull } />,
			{
				registry,
			}
		);

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		// `WidgetNull` does not actually render anything,
		// a fake implementation is used here just for testing.
		expect( queryByTestID( 'widget-null' ) ).toBeInTheDocument();
	} );
} );
