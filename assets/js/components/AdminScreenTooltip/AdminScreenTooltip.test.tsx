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
import { Registry } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import * as tracking from '@/js/util/tracking';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { AdminScreenTooltip } from './AdminScreenTooltip';
import { TooltipSettings } from './types';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AdminMenuTooltip', () => {
	let registry: Registry;

	function setTooltipSettings(
		settings: Partial< TooltipSettings > | undefined
	) {
		return registry
			.dispatch( CORE_UI )
			.setValue( 'admin-screen-tooltip', settings );
	}

	function getTooltipSettings(): Partial< TooltipSettings > | undefined {
		return registry.select( CORE_UI ).getValue( 'admin-screen-tooltip' );
	}

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry() as Registry;
		jest.useFakeTimers();
	} );

	it( 'should not render when isTooltipVisible is false', async () => {
		setTooltipSettings( {
			isTooltipVisible: false,
		} );

		render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should render when isTooltipVisible is true and track view event', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await setTooltipSettings( {
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
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
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
			'tooltip_view',
			undefined,
			undefined
		);
	} );

	it( 'should render content-only tooltip when title is not provided', async () => {
		await setTooltipSettings( {
			isTooltipVisible: true,
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug: 'test-tooltip-slug',
		} );

		const { findByRole } = render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		// Floater keeps the tooltip `visibility: hidden` in JSDOM, as it is never
		// positioned, so it has to be included explicitly.
		const tooltip = await findByRole( 'alertdialog', { hidden: true } );

		expect( tooltip ).toHaveClass( 'googlesitekit-tour-tooltip--no-title' );
		expect(
			tooltip.querySelector( '.googlesitekit-tooltip-title' )
		).not.toBeInTheDocument();
		expect(
			tooltip.querySelector( '.googlesitekit-tooltip-content' )
		).toHaveTextContent( 'Test Content' );
	} );

	it( 'should close the tooltip on clicking the `X` button and track dismiss event', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug,
		} );

		const { findByLabelText } = render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		fireEvent.click( await findByLabelText( 'Close' ) );

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		expect( getTooltipSettings() ).toBeUndefined();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`test-context_${ tooltipSlug }`,
			'tooltip_dismiss',
			undefined,
			undefined
		);
	} );

	it( 'should close the tooltip on clicking the `Got it` button and track dismiss event', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug,
		} );

		const { findByLabelText } = render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		fireEvent.click( await findByLabelText( 'Got it' ) );

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		expect( getTooltipSettings() ).toBeUndefined();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`test-context_${ tooltipSlug }`,
			'tooltip_dismiss',
			undefined,
			undefined
		);
	} );

	it( 'should remove the tooltip body class when the tooltip is hidden without being dismissed', async () => {
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug: 'test-tooltip-slug',
		} );

		render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		await waitFor( () => {
			expect( document.body ).toHaveClass(
				'googlesitekit-showing-tooltip'
			);
		} );

		act( () => {
			setTooltipSettings( undefined );
		} );

		expect( document.body ).not.toHaveClass(
			'googlesitekit-showing-tooltip'
		);
	} );

	it( 'should use the provided tracking label when tracking GA events', async () => {
		const tooltipSlug = 'test-tooltip-slug';
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug,
			gaTrackingEventLabel: 'test-label',
		} );

		const { findByLabelText } = render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		fireEvent.click( await findByLabelText( 'Close' ) );

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			`test-context_${ tooltipSlug }`,
			'tooltip_view',
			'test-label',
			undefined
		);

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			2,
			`test-context_${ tooltipSlug }`,
			'tooltip_dismiss',
			'test-label',
			undefined
		);
	} );

	it( 'should track GA events with the provided gaTrackingEventArgs when an id is given', async () => {
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			id: 'test-tooltip-id',
			gaTrackingEventArgs: {
				category: 'test-category',
				label: 'test-label',
				value: 1,
			},
		} );

		const { findByLabelText } = render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		fireEvent.click( await findByLabelText( 'Close' ) );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			'test-category',
			'tooltip_view',
			'test-label',
			1
		);

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			2,
			'test-category',
			'tooltip_dismiss',
			'test-label',
			1
		);
	} );

	it( 'should track GA events with a category based on the id when no category is given', async () => {
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			id: 'test-tooltip-id',
		} );

		const { findByLabelText } = render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
		);

		// Wait for Joyride tooltip's useInterval to render.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		fireEvent.click( await findByLabelText( 'Close' ) );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			'test-context_test-tooltip-id',
			'tooltip_view',
			undefined,
			undefined
		);

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			2,
			'test-context_test-tooltip-id',
			'tooltip_dismiss',
			undefined,
			undefined
		);
	} );

	it( 'should pass floaterProps to the JoyrideTooltip component when provided in the tooltip state', async () => {
		await setTooltipSettings( {
			isTooltipVisible: true,
			title: 'Test Title',
			content: 'Test Content',
			dismissLabel: 'Got it',
			tooltipSlug: 'test-tooltip-slug',
			floaterProps: {
				styles: {
					arrow: {
						margin: 42,
					},
				},
			},
		} );

		render(
			<div className="googlesitekit-plugin">
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<AdminScreenTooltip />
			</div>,
			{ registry, viewContext: 'test-context' }
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

		const floaterArrowSpan = document.querySelector(
			'.__floater__arrow > span'
		);
		expect( floaterArrowSpan ).toHaveStyle(
			'margin-top: 42px; margin-bottom: 42px;'
		);
	} );

	it.each( [
		[ 'X', 'Close' ],
		[ 'Got it', 'Got it' ],
	] )(
		'should call the optional onDismiss callback after clicking the `%s` button and still track the dismiss event',
		async ( _, buttonName ) => {
			const tooltipSlug = 'test-tooltip-slug';
			const onDismiss = jest.fn();

			await setTooltipSettings( {
				isTooltipVisible: true,
				content: 'Test Content',
				dismissLabel: 'Got it',
				tooltipSlug,
				onDismiss,
			} );

			const { findByLabelText } = render(
				<div className="googlesitekit-plugin">
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AdminScreenTooltip />
				</div>,
				{ registry, viewContext: 'test-context' }
			);

			// Wait for Joyride tooltip's useInterval to render.
			act( () => {
				jest.advanceTimersByTime( 1000 );
			} );

			const button = await findByLabelText( buttonName );

			expect( onDismiss ).not.toHaveBeenCalled();

			fireEvent.click( button );

			expect( onDismiss ).toHaveBeenCalledTimes( 1 );

			expect( getTooltipSettings() ).toBeUndefined();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`test-context_${ tooltipSlug }`,
				'tooltip_view',
				undefined,
				undefined
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`test-context_${ tooltipSlug }`,
				'tooltip_dismiss',
				undefined,
				undefined
			);
		}
	);
} );
