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
import { render } from 'tests/js/test-utils';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';

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
				name: 'Hide section',
			} )
		).toBeInTheDocument();
		expect( getByText( 'Collapsible Widget Body' ) ).toBeInTheDocument();
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
			name: 'Hide section',
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

	it( 'should toggle the collapsible widget body when the header is toggled with the keyboard', () => {
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
			name: 'Hide section',
		} );

		// The body should be visible by default.
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).not.toBeInTheDocument();

		fireEvent.keyUp( header, { key: 'Enter' } );
		// Snapshot should mark the body as collapsed.
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).toBeInTheDocument();

		fireEvent.keyUp( header, { key: 'Enter' } );
		// Snapshot should mark the body as visible again (eg. no collapsed
		// CSS class).
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
			name: 'Expand section',
		} );

		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).toBeInTheDocument();

		// Should expand the body when the header is clicked, even
		// when `defaultCollapsed` is true.
		fireEvent.keyUp( header, { key: 'Enter' } );
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).not.toBeInTheDocument();
	} );

	it( 'should allow the parent component to control the collapsed state', () => {
		const { container, getByRole } = render(
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
		expect( () => {
			getByRole( 'button', {
				name: 'Expand section',
			} );
		} ).toThrow(
			'Unable to find an accessible element with the role "button" and name "Expand section"'
		);

		// The body should not be visible when `isCollapsed` is true.
		expect(
			container.querySelector( '.googlesitekit-widget__body--collapsed' )
		).toBeInTheDocument();
	} );
} );
