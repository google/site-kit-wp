/**
 * TourTooltips tests.
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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import * as tracking from '@/js/util/tracking';
import { mockBrowserScrolling } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
} from '@tests/js/test-utils';
import { Provider as ViewContextProvider } from './Root/ViewContextContext';
import TourTooltips, { GA_ACTIONS } from './TourTooltips';

const SECOND_STEP = 1;
const FINAL_STEP = 2;
const TOUR_ID = 'mock-feature';
const EVENT_CATEGORY = 'test-event-category';
const STEP_KEY = `${ TOUR_ID }-step`;
const RUN_KEY = `${ TOUR_ID }-run`;
const MOCK_STEPS = [
	{
		slug: 'step-1',
		target: '.step-1',
		title: 'Title for step 1',
		content: <em>This is the first step</em>,
		placement: 'center',
	},
	{
		slug: 'step-2',
		target: '.step-2',
		title: 'Title for step 2',
		content: 'This is the second step',
		placement: 'center',
	},
	{
		slug: 'step-3',
		target: '.step-3',
		title: 'Title for step 3',
		content: 'This is the third step',
		placement: 'center',
	},
];
const TEST_VIEW_CONTEXT = 'testViewContext';

function MockUIWrapper( { children } ) {
	return (
		<ViewContextProvider value={ TEST_VIEW_CONTEXT }>
			<div className="step-1" />
			<div className="step-2" />
			<div className="step-3" />
			{ children }
		</ViewContextProvider>
	);
}

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

function renderTourTooltipsWithMockUI( options, overrideProps = {} ) {
	return render(
		<MockUIWrapper>
			<TourTooltips
				steps={ MOCK_STEPS }
				tourID={ TOUR_ID }
				gaEventCategory={ EVENT_CATEGORY }
				{ ...overrideProps }
			/>
		</MockUIWrapper>,
		options
	);
}

describe( 'TourTooltips', () => {
	let registry;
	let select;
	let dismissTourSpy;
	// store value to return default functionality on test teardown
	const nativeCreateRange = global.document.createRange;

	mockBrowserScrolling();

	beforeAll( () => {
		// `react-joyride` is calling `createRange` internally — method must be mocked.
		global.document.createRange = () => ( {
			setStart: () => {},
			setEnd: () => {},
			commonAncestorContainer: {
				nodeName: 'BODY',
				ownerDocument: document,
			},
		} );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		select = registry.select( CORE_UI );
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
		dismissTourSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissTour'
		);
		dismissTourSpy.mockImplementation( ( tourID ) => {
			// Bypass fetch requests and receive the dismissed tour directly.
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedTours( [ tourID ] );
		} );
	} );

	afterEach( () => dismissTourSpy.mockReset() );

	afterAll( () => {
		global.document.createRange = nativeCreateRange;
	} );

	it( 'should display step title & content correctly', async () => {
		const { findByRole } = renderTourTooltipsWithMockUI( { registry } );

		const tourTooltip = await findByRole( 'alertdialog' );

		expect( tourTooltip ).toHaveTextContent( 'Title for step 1' );
		expect( tourTooltip ).toContainHTML(
			'<em>This is the first step</em>'
		);
	} );

	it( 'should switch to next step when next button is clicked', () => {
		const { getByRole } = renderTourTooltipsWithMockUI( { registry } );

		fireEvent.click( getByRole( 'button', { name: /next/i } ) );

		getByRole( 'heading', { name: /title for step 2/i } );
	} );

	it( 'should not render next step button if on last step', () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, FINAL_STEP );

		const { queryByRole } = renderTourTooltipsWithMockUI( { registry } );

		expect(
			queryByRole( 'button', { name: /next/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should switch to previous step when back button is clicked', () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, SECOND_STEP );

		const { getByRole } = renderTourTooltipsWithMockUI( { registry } );

		fireEvent.click( getByRole( 'button', { name: /back/i } ) );

		getByRole( 'heading', { name: /title for step 1/i } );
	} );

	it( 'should not render previous step button if on first step', () => {
		const { queryByRole } = renderTourTooltipsWithMockUI( { registry } );

		expect(
			queryByRole( 'button', { name: /back/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should add classes to `body` when the tour starts', () => {
		const { baseElement } = renderTourTooltipsWithMockUI( { registry } );

		expect( baseElement.classList ).toContain(
			'googlesitekit-showing-feature-tour'
		);

		expect( baseElement.classList ).toContain(
			`googlesitekit-showing-feature-tour--${ TOUR_ID }`
		);

		expect( baseElement.classList ).toContain(
			`googlesitekit-showing-feature-tour--${ TOUR_ID }-step-1`
		);
	} );

	it( 'should remove classes from `body` when the tour ends', () => {
		const { baseElement, getByRole } = renderTourTooltipsWithMockUI( {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( baseElement.classList ).not.toContain(
			'googlesitekit-showing-feature-tour'
		);

		expect( baseElement.classList ).not.toContain(
			`googlesitekit-showing-feature-tour--${ TOUR_ID }`
		);

		expect( baseElement.classList ).not.toContain(
			`googlesitekit-showing-feature-tour--${ TOUR_ID }-step-1`
		);
	} );

	it( 'should update the step class when the step is changed', () => {
		const { baseElement, getByRole } = renderTourTooltipsWithMockUI( {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /next/i } ) );

		expect( baseElement.classList ).toContain(
			`googlesitekit-showing-feature-tour--${ TOUR_ID }-step-2`
		);

		expect( baseElement.classList ).not.toContain(
			`googlesitekit-showing-feature-tour--${ TOUR_ID }-step-1`
		);
	} );

	it( 'should end tour when close icon is clicked', async () => {
		const { getByRole, queryByRole, rerender } =
			renderTourTooltipsWithMockUI( { registry } );

		await act( () => {
			fireEvent.click( getByRole( 'button', { name: /close/i } ) );
		} );

		rerender();

		// This error is caused by the `react-select` component trying to update
		// state after the component has unmounted, so we can't fix it ourselves.
		expect( console ).toHaveErrored(
			"Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in %s.%s"
		);

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
		expect( dismissTourSpy ).toHaveBeenCalled();
	} );

	it( 'should end tour when "Got it" button is clicked', () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, FINAL_STEP );

		const { getByRole, queryByRole } = renderTourTooltipsWithMockUI( {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /got it/i } ) );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
		expect( dismissTourSpy ).toHaveBeenCalled();
	} );

	it( 'should persist tour completion after tour closed', () => {
		const { getByRole } = renderTourTooltipsWithMockUI( { registry } );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( dismissTourSpy ).toHaveBeenCalledWith( TOUR_ID );
	} );

	it( 'should not persist tour completion if tour is repeatable', () => {
		const { getByRole } = renderTourTooltipsWithMockUI(
			{ registry },
			{
				isRepeatable: true,
			}
		);

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( dismissTourSpy ).not.toHaveBeenCalled();
	} );

	it( 'should flush state on completion when tour is repeatable', () => {
		const { getByRole } = renderTourTooltipsWithMockUI(
			{ registry },
			{
				isRepeatable: true,
			}
		);

		// Verify initial state.
		expect( select.getValue( RUN_KEY ) ).toBe( true );
		expect( select.getValue( STEP_KEY ) ).toBe( undefined );
		expect( registry.select( CORE_USER ).getCurrentTour() ).toBeUndefined();

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( select.getValue( RUN_KEY ) ).toBe( false );
		expect( select.getValue( STEP_KEY ) ).toBe( null );
		expect( registry.select( CORE_USER ).getCurrentTour() ).toBeNull();
	} );

	it( 'should start tour if no persisted tour completion exists', () => {
		renderTourTooltipsWithMockUI( { registry } );

		expect( select.getValue( RUN_KEY ) ).toBe( true );
	} );

	it( 'should not start tour if persisted tour completion is found', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [ TOUR_ID ] );

		const { queryByRole } = renderTourTooltipsWithMockUI( { registry } );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should start repeatable tour even if persisted tour completion is found', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [ TOUR_ID ] );

		const { getByRole } = renderTourTooltipsWithMockUI(
			{ registry },
			{
				isRepeatable: true,
			}
		);

		expect( getByRole( 'alertdialog' ) ).toBeInTheDocument();
	} );

	it( 'should load Joyride in controlled mode', () => {
		function callback( data ) {
			const { controlled } = data;
			expect( controlled ).toBe( true );
		}
		renderTourTooltipsWithMockUI(
			{ registry },
			{
				callback,
			}
		);
	} );

	it( 'should not display the step indicator when there is only one step and `setupFlowRefresh` is enabled', () => {
		const { queryByText } = renderTourTooltipsWithMockUI(
			{ registry, features: [ 'setupFlowRefresh' ] },
			{
				steps: MOCK_STEPS.slice( 0, 1 ),
			}
		);

		expect( queryByText( '1 / 1' ) ).not.toBeInTheDocument();
	} );

	describe( 'event tracking', () => {
		beforeEach( () => mockTrackEvent.mockClear() );

		it( 'tracks all events for a completed tour', async () => {
			const { getByRole } = renderTourTooltipsWithMockUI( { registry } );
			await getByRole( 'alertdialog' );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenLastCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.VIEW,
				1
			);
			mockTrackEvent.mockClear();

			// Go to step 2
			fireEvent.click( getByRole( 'button', { name: /next/i } ) );
			await getByRole( 'alertdialog' );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			// Tracks the advance on the 1st step, view on the 2nd step.
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				EVENT_CATEGORY,
				GA_ACTIONS.NEXT,
				1
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				EVENT_CATEGORY,
				GA_ACTIONS.VIEW,
				2
			);
			mockTrackEvent.mockClear();

			// Go to step 3
			fireEvent.click( getByRole( 'button', { name: /next/i } ) );
			await getByRole( 'alertdialog' );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			// Tracks the advance on the 2nd step, view on the 3rd step.
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				EVENT_CATEGORY,
				GA_ACTIONS.NEXT,
				2
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				EVENT_CATEGORY,
				GA_ACTIONS.VIEW,
				3
			);
			mockTrackEvent.mockClear();

			// Finish the tour.
			fireEvent.click( getByRole( 'button', { name: /got it/i } ) );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.COMPLETE,
				3
			);
			expect( mockTrackEvent ).not.toHaveBeenCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.DISMISS,
				3
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'tracks all events for a dismissed tour', async () => {
			const { getByRole } = renderTourTooltipsWithMockUI( { registry } );
			await getByRole( 'alertdialog' );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.VIEW,
				1
			);
			mockTrackEvent.mockClear();

			// Dismissing a tour is specific to closing the dialog.
			fireEvent.click( getByRole( 'button', { name: /close/i } ) );
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.DISMISS,
				1
			);
		} );

		it( 'tracks all events for a dismissed tour on the last step', async () => {
			const { getByRole } = renderTourTooltipsWithMockUI( { registry } );
			await getByRole( 'alertdialog' );
			// Go to step 2/3
			fireEvent.click( getByRole( 'button', { name: /next/i } ) );
			await getByRole( 'alertdialog' );
			// Go to step 3/3
			fireEvent.click( getByRole( 'button', { name: /next/i } ) );
			await getByRole( 'alertdialog' );
			mockTrackEvent.mockClear();
			// Dismissing a tour is specific to closing the dialog.
			fireEvent.click( getByRole( 'button', { name: /close/i } ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.DISMISS,
				3
			);
			expect( mockTrackEvent ).not.toHaveBeenCalledWith(
				EVENT_CATEGORY,
				GA_ACTIONS.COMPLETE,
				3
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'tracks events for navigating between steps', async () => {
			const { getByRole } = renderTourTooltipsWithMockUI( { registry } );
			await getByRole( 'alertdialog' );
			mockTrackEvent.mockClear();

			// Go to step 2
			fireEvent.click( getByRole( 'button', { name: /next/i } ) );
			await getByRole( 'alertdialog' );
			// Tracks the advance on the 1st step, view on the 2nd step.
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				EVENT_CATEGORY,
				GA_ACTIONS.NEXT,
				1
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				EVENT_CATEGORY,
				GA_ACTIONS.VIEW,
				2
			);
			mockTrackEvent.mockClear();

			// Go back to step 1
			fireEvent.click( getByRole( 'button', { name: /back/i } ) );
			await getByRole( 'alertdialog' );
			// Tracks the return on the 2nd step, view on the 1st step.
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				EVENT_CATEGORY,
				GA_ACTIONS.PREV,
				2
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				EVENT_CATEGORY,
				GA_ACTIONS.VIEW,
				1
			);
		} );

		it( 'accepts a function to generate the event category', async () => {
			function gaEventCategory( viewContext ) {
				return `${ viewContext }_test`;
			}
			const expectedCategory = gaEventCategory( TEST_VIEW_CONTEXT );

			const { getByRole } = renderTourTooltipsWithMockUI(
				{ registry },
				{
					gaEventCategory,
				}
			);

			await getByRole( 'alertdialog' );
			mockTrackEvent.mockClear();

			// Go to step 2
			fireEvent.click( getByRole( 'button', { name: /next/i } ) );
			await getByRole( 'alertdialog' );
			// Tracks the advance on the 1st step, view on the 2nd step.
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				expectedCategory,
				GA_ACTIONS.NEXT,
				1
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				expectedCategory,
				GA_ACTIONS.VIEW,
				2
			);
			mockTrackEvent.mockClear();

			// Go back to step 1
			fireEvent.click( getByRole( 'button', { name: /back/i } ) );
			await getByRole( 'alertdialog' );
			// Tracks the return on the 2nd step, view on the 1st step.
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				expectedCategory,
				GA_ACTIONS.PREV,
				2
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				expectedCategory,
				GA_ACTIONS.VIEW,
				1
			);
		} );
	} );
} );
