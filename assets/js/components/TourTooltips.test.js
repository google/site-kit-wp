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
import {
	render,
	createTestRegistry,
	fireEvent,
} from '../../../tests/js/test-utils';
import TourTooltips, { GA_ACTIONS } from './TourTooltips';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import * as tracking from '../util/tracking';
import { Provider as ViewContextProvider } from './Root/ViewContextContext';

const SECOND_STEP = 1;
const FINAL_STEP = 2;
const TOUR_ID = 'mock-feature';
const EVENT_CATEGORY = 'test-event-category';
const STEP_KEY = `${ TOUR_ID }-step`;
const RUN_KEY = `${ TOUR_ID }-run`;
const MOCK_STEPS = [
	{
		target: '.step-1',
		title: 'Title for step 1',
		content: <em>This is the first step</em>,
		placement: 'center',
	},
	{
		target: '.step-2',
		title: 'Title for step 2',
		content: 'This is the second step',
		placement: 'center',
	},
	{
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

const renderTourTooltipsWithMockUI = ( registry, overrideProps = {} ) =>
	render(
		<MockUIWrapper>
			<TourTooltips
				steps={ MOCK_STEPS }
				tourID={ TOUR_ID }
				gaEventCategory={ EVENT_CATEGORY }
				{ ...overrideProps }
			/>
		</MockUIWrapper>,
		{ registry }
	);

describe( 'TourTooltips', () => {
	let registry;
	let select;
	let dismissTourSpy;
	// store value to return default functionality on test teardown
	const nativeCreateRange = global.document.createRange;

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
		const { findByRole } = renderTourTooltipsWithMockUI( registry );

		const tourTooltip = await findByRole( 'alertdialog' );

		expect( tourTooltip ).toHaveTextContent( 'Title for step 1' );
		expect( tourTooltip ).toContainHTML(
			'<em>This is the first step</em>'
		);
	} );

	it( 'should switch to next step when next button is clicked', () => {
		const { getByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /next/i } ) );

		getByRole( 'heading', { name: /title for step 2/i } );
	} );

	it( 'should not render next step button if on last step', () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, FINAL_STEP );

		const { queryByRole } = renderTourTooltipsWithMockUI( registry );

		expect(
			queryByRole( 'button', { name: /next/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should switch to previous step when back button is clicked', () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, SECOND_STEP );

		const { getByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /back/i } ) );

		getByRole( 'heading', { name: /title for step 1/i } );
	} );

	it( 'should not render previous step button if on first step', () => {
		const { queryByRole } = renderTourTooltipsWithMockUI( registry );

		expect(
			queryByRole( 'button', { name: /back/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should add `googlesitekit-showing-feature-tour` class to `body`', () => {
		const { baseElement } = renderTourTooltipsWithMockUI( registry );

		expect(
			baseElement.classList.contains(
				'googlesitekit-showing-feature-tour'
			)
		).toBe( true );
	} );

	it( 'should remove `googlesitekit-showing-feature-tour` class from `body` when tour ends', () => {
		const { baseElement, getByRole } =
			renderTourTooltipsWithMockUI( registry );

		expect(
			baseElement.classList.contains(
				'googlesitekit-showing-feature-tour'
			)
		).toBe( true );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect(
			baseElement.classList.contains(
				'googlesitekit-showing-feature-tour'
			)
		).toBe( false );
	} );

	it( 'should end tour when close icon is clicked', () => {
		const { getByRole, queryByRole } =
			renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
		expect( dismissTourSpy ).toHaveBeenCalled();
	} );

	it( 'should end tour when "Got it" button is clicked', () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, FINAL_STEP );

		const { getByRole, queryByRole } =
			renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /got it/i } ) );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
		expect( dismissTourSpy ).toHaveBeenCalled();
	} );

	it( 'should persist tour completion after tour closed', () => {
		const { getByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( dismissTourSpy ).toHaveBeenCalledWith( TOUR_ID );
	} );

	it( 'should start tour if no persisted tour completion exists', () => {
		renderTourTooltipsWithMockUI( registry );

		expect( select.getValue( RUN_KEY ) ).toBe( true );
	} );

	it( 'should not start tour if persisted tour completion is found', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [ TOUR_ID ] );

		const { queryByRole } = renderTourTooltipsWithMockUI( registry );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	describe( 'event tracking', () => {
		beforeEach( () => mockTrackEvent.mockClear() );

		it( 'tracks all events for a completed tour', async () => {
			const { getByRole } = renderTourTooltipsWithMockUI( registry );
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
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'tracks all events for a dismissed tour', async () => {
			const { getByRole } = renderTourTooltipsWithMockUI( registry );
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
			const { getByRole } = renderTourTooltipsWithMockUI( registry );
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
			const { getByRole } = renderTourTooltipsWithMockUI( registry );
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
			const gaEventCategory = ( viewContext ) => `${ viewContext }_test`;
			const expectedCategory = gaEventCategory( TEST_VIEW_CONTEXT );

			const { getByRole } = renderTourTooltipsWithMockUI( registry, {
				gaEventCategory,
			} );

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
