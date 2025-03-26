/**
 * AdminMenuTooltip component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { AdminMenuTooltip } from './AdminMenuTooltip';
import * as tracking from '../../util/tracking';
import useViewContext from '../../hooks/useViewContext';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

// Mock useViewContext to return a consistent value
jest.mock( '../../hooks/useViewContext', () => jest.fn() );
useViewContext.mockImplementation( () => 'test-context' );

describe( 'AdminMenuTooltip', () => {
	let registry;
	const mockOnDismiss = jest.fn();

	beforeEach( () => {
		mockTrackEvent.mockClear();
		mockOnDismiss.mockClear();
		registry = createTestRegistry();
		jest.useFakeTimers();
	} );

	it( 'should not render when isTooltipVisible is false', async () => {
		registry.dispatch( CORE_UI ).setValue( 'admin-menu-tooltip', {
			isTooltipVisible: false,
		} );

		render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminMenuTooltip />
			</div>,
			{ registry }
		);

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should render when isTooltipVisible is true and track view event', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await registry.dispatch( CORE_UI ).setValue( 'admin-menu-tooltip', {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug,
		} );

		render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminMenuTooltip />
			</div>,
			{ registry }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		await waitFor( () => {
			const tooltip = document.querySelector(
				'.googlesitekit-tour-tooltip'
			);
			expect( tooltip ).toBeInTheDocument();
		} );

		expect(
			document.querySelector( '.googlesitekit-tour-tooltip' )
		).toMatchSnapshot();

		// The tracking event should fire when the tooltip is viewed.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`test-context_${ tooltipSlug }`,
			'view_tooltip'
		);
	} );

	it( 'should close the tooltip on clicking the `X` button and track dismiss event', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await registry.dispatch( CORE_UI ).setValue( 'admin-menu-tooltip', {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			onDismiss: mockOnDismiss,
			tooltipSlug,
		} );

		render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminMenuTooltip />
			</div>,
			{ registry }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		let closeButton;
		await waitFor( () => {
			const tooltip = document.querySelector(
				'.googlesitekit-tour-tooltip'
			);
			expect( tooltip ).toBeInTheDocument();

			closeButton = tooltip.querySelector(
				'.googlesitekit-tooltip-close'
			);
			expect( closeButton ).toBeInTheDocument();
		} );

		fireEvent.click( closeButton );

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		expect( mockOnDismiss ).toHaveBeenCalled();

		expect(
			registry.select( CORE_UI ).getValue( 'admin-menu-tooltip' )
		).toBeUndefined();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`test-context_${ tooltipSlug }`,
			'dismiss_tooltip'
		);
	} );

	it( 'should close the tooltip on clicking the `Got it` button and track dismiss event', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await registry.dispatch( CORE_UI ).setValue( 'admin-menu-tooltip', {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			onDismiss: mockOnDismiss,
			tooltipSlug,
		} );

		render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminMenuTooltip />
			</div>,
			{ registry }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		let gotItButton;
		await waitFor( () => {
			const tooltip = document.querySelector(
				'.googlesitekit-tour-tooltip'
			);
			expect( tooltip ).toBeInTheDocument();

			gotItButton = tooltip.querySelector(
				'.googlesitekit-tooltip-button'
			);
			expect( gotItButton ).toBeInTheDocument();
		} );

		// Click the Got it button
		fireEvent.click( gotItButton );

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		expect( mockOnDismiss ).toHaveBeenCalled();

		expect(
			registry.select( CORE_UI ).getValue( 'admin-menu-tooltip' )
		).toBeUndefined();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`test-context_${ tooltipSlug }`,
			'dismiss_tooltip'
		);
	} );
} );
