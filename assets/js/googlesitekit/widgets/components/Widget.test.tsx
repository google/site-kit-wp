/**
 * Widget tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * External dependencies
 */
import { fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Widget from '@/js/googlesitekit/widgets/components/Widget';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';
import { render } from '@tests/js/test-utils';

describe( 'Widget', () => {
	it( 'should render the widget header and body', () => {
		const { getByText } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Test Widget"
				widgetSlug="test-widget"
			>
				<div>Widget Body</div>
			</Widget>
		);

		expect( getByText( 'Test Widget' ) ).toBeInTheDocument();
		expect( getByText( 'Widget Body' ) ).toBeInTheDocument();
	} );

	it( 'should render the collapsible widget header and body', () => {
		const { getByText, getByRole } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		expect(
			getByRole( 'button', {
				name: 'Collapsible Test Widget Hide section',
			} )
		).toBeInTheDocument();
		expect( getByText( 'Collapsible Widget Body' ) ).toBeInTheDocument();
	} );

	it( 'should not render a toggle button or toggle text when the widget is not collapsible', () => {
		const { queryByRole, queryByText } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Test Widget"
				widgetSlug="test-widget"
			>
				<div>Widget Body</div>
			</Widget>
		);

		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Hide section' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Expand section' ) ).not.toBeInTheDocument();
	} );

	it( 'should read the collapsible header contents followed by the toggle action', () => {
		const { getByRole } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		fireEvent.click(
			getByRole( 'button', {
				name: 'Collapsible Test Widget Hide section',
			} )
		);

		expect(
			getByRole( 'button', {
				name: 'Collapsible Test Widget Expand section',
			} )
		).toBeInTheDocument();
	} );

	it( 'should mark the collapsible header as expanded only while the widget body is shown', () => {
		const { getByRole } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		const header = getByRole( 'button', { expanded: true } );

		fireEvent.click( header );

		expect( getByRole( 'button', { expanded: false } ) ).toBe( header );
	} );

	it( 'should toggle the collapsible widget body when the header is clicked', () => {
		const { container, getByRole } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		const header = getByRole( 'button', {
			name: 'Collapsible Test Widget Hide section',
		} );

		// The body should be visible by default.
		expect(
			container.querySelector( '.googlesitekit-widget__body' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).not.toBeInTheDocument();

		fireEvent.click( header );
		// Snapshot should mark the body as collapsed.
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).toBeInTheDocument();

		fireEvent.click( header );
		// Snapshot should mark the body as visible again (eg. no collapsed
		// CSS class).
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).not.toBeInTheDocument();
	} );

	it( 'should render the collapsible header toggle as a native button', () => {
		const { getByRole } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		// A native button also toggles with Enter and Space.
		expect(
			getByRole( 'button', {
				name: 'Collapsible Test Widget Hide section',
			} )
		).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'should render the header badge outside the collapsible header toggle', () => {
		const { container, getByRole, getByText } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				headerBadge={ <span>Test Badge</span> }
				widgetSlug="collapsible-test-widget"
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		const badge = getByText( 'Test Badge' );

		expect(
			getByRole( 'button', {
				name: 'Collapsible Test Widget Hide section',
			} )
		).not.toContainElement( badge );

		// Clicking the badge should not toggle the body.
		fireEvent.click( badge );
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).not.toBeInTheDocument();
	} );

	it( 'should hide the collapsible widget body when `defaultCollapsed` is true', () => {
		const { container, getByRole } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				collapsible
				defaultCollapsed
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		const header = getByRole( 'button', {
			name: 'Collapsible Test Widget Expand section',
		} );

		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).toBeInTheDocument();

		// Should expand the body when the header is clicked, even
		// when `defaultCollapsed` is true.
		fireEvent.click( header );
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).not.toBeInTheDocument();
	} );

	it( 'should allow the parent component to control the collapsed state', () => {
		const { container, queryByRole, queryByText } = render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				isCollapsed
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		// When the `isCollapsed` prop is provided, the widget should not
		// render a button to toggle the collapsed state, as it is controlled
		// by the parent component.
		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Hide section' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Expand section' ) ).not.toBeInTheDocument();

		// The body should not be visible when `isCollapsed` is true.
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).toBeInTheDocument();
	} );

	it( 'should warn users when both `defaultCollapsed` and `isCollapsed` are provided', () => {
		render(
			<Widget
				Header={ WidgetHeaderTitle }
				headerContents="Collapsible Test Widget"
				widgetSlug="collapsible-test-widget"
				defaultCollapsed
				isCollapsed
				collapsible
			>
				<div>Collapsible Widget Body</div>
			</Widget>
		);

		expect( console ).toHaveWarnedWith(
			'Error in `Widget` component: The `defaultCollapsed` prop should not be used together with the `isCollapsed` prop. Providing the `isCollapsed` prop means the `Widget` component for slug "collapsible-test-widget" is controlled by its parent component, and the `defaultCollapsed` prop will be ignored.'
		);
	} );
} );
