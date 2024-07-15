/**
 * HOC whenInViewContext tests.
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
import { createTestRegistry } from '../../../tests/js/utils';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_SETTINGS,
} from '../googlesitekit/constants';
import whenInViewContext from './when-in-view-context';

describe( 'whenInViewContext', () => {
	let registry;

	function TestComponent() {
		return <div data-testid="component" />;
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'throws an error if both includeList and excludeList props are provided', () => {
		const WhenInViewComponent = whenInViewContext( {
			includeList: [ VIEW_CONTEXT_ENTITY_DASHBOARD ],
			excludeList: [ VIEW_CONTEXT_ENTITY_DASHBOARD ],
		} )( TestComponent );

		try {
			render( <WhenInViewComponent /> );
		} catch ( e ) {
			expect( e.message ).toBe(
				'include and exclude lists cannot both be provided'
			);
		}

		// Additional console error needs to be caught to prevent the test from failing.
		expect( console ).toHaveErrored();
	} );

	it( 'throws an error if both allViewOnly and allNonViewOnly props are provided', () => {
		const WhenInViewComponent = whenInViewContext( {
			allViewOnly: true,
			allNonViewOnly: true,
		} )( TestComponent );

		try {
			render( <WhenInViewComponent /> );
		} catch ( e ) {
			expect( e.message ).toBe(
				'view only and non view only lists cannot both be true'
			);
		}

		// Additional console error needs to be caught to prevent the test from failing.
		expect( console ).toHaveErrored();
	} );

	describe( 'allViewOnly', () => {
		it( 'renders nothing when not in view only context and allViewOnly is true', () => {
			const WhenInViewComponent = whenInViewContext( {
				allViewOnly: true,
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		} );

		it( 'renders component when in view only context and allViewOnly is true', () => {
			const WhenInViewComponent = whenInViewContext( {
				allViewOnly: true,
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect( queryByTestID( 'component' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'allNonViewOnly', () => {
		it( 'renders nothing when in view only context and allNonViewOnly is true', () => {
			const WhenInViewComponent = whenInViewContext( {
				allNonViewOnly: true,
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		} );

		it( 'renders component when not in view only context and allNonViewOnly is true', () => {
			const WhenInViewComponent = whenInViewContext( {
				allNonViewOnly: true,
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( queryByTestID( 'component' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'includeList', () => {
		it( 'renders nothing when in view context that is not included in includeList', () => {
			const WhenInViewComponent = whenInViewContext( {
				includeList: [
					VIEW_CONTEXT_MAIN_DASHBOARD,
					VIEW_CONTEXT_ENTITY_DASHBOARD,
				],
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			} );

			expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		} );

		it( 'renders component when in view context that is included in includeList', () => {
			const WhenInViewComponent = whenInViewContext( {
				includeList: [
					VIEW_CONTEXT_MAIN_DASHBOARD,
					VIEW_CONTEXT_ENTITY_DASHBOARD,
				],
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( queryByTestID( 'component' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'excludeList', () => {
		it( 'renders nothing when in view context that is included in excludeList', () => {
			const WhenInViewComponent = whenInViewContext( {
				excludeList: [
					VIEW_CONTEXT_MAIN_DASHBOARD,
					VIEW_CONTEXT_ENTITY_DASHBOARD,
				],
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
			} );

			expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		} );

		it( 'renders component when in view context that is not included in excludeList', () => {
			const WhenInViewComponent = whenInViewContext( {
				excludeList: [
					VIEW_CONTEXT_MAIN_DASHBOARD,
					VIEW_CONTEXT_ENTITY_DASHBOARD,
				],
			} )( TestComponent );

			const { queryByTestID } = render( <WhenInViewComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			} );

			expect( queryByTestID( 'component' ) ).toBeInTheDocument();
		} );
	} );
} );
