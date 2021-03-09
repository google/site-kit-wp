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
import { render, createTestRegistry, fireEvent } from '../../../tests/js/test-utils';
import TourTooltips from './TourTooltips';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';

const SECOND_STEP = 1;
const FINAL_STEP = 2;
const TOUR_ID = 'mock-feature';
const STEP_KEY = `${ TOUR_ID }-step`;
const RUN_KEY = `${ TOUR_ID }-run`;
const ENCOUNTERED_KEY = `sitekit-${ TOUR_ID }__has-encountered-tour`;
const MOCK_STEPS = [
	{
		target: '.step-1',
		title: 'Title for step 1',
		content: <em>This is the first step</em>,
	},
	{
		target: '.step-2',
		title: 'Title for step 2',
		content: 'This is the second step',
	},
	{
		target: '.step-3',
		title: 'Title for step 3',
		content: 'This is the third step',
	},
];

const MockUIWrapper = ( { children } ) => (
	<div>
		<div className="step-1" />
		<div className="step-2" />
		<div className="step-3" />
		{ children }
	</div>
);

const renderTourTooltipsWithMockUI = ( registry ) => render( (
	<MockUIWrapper>
		<TourTooltips steps={ MOCK_STEPS } tourID={ TOUR_ID } />
	</MockUIWrapper>
), { registry } );

describe( 'TourTooltips', () => {
	let registry;
	let select;
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
	} );

	afterAll( () => {
		global.document.createRange = nativeCreateRange;
	} );

	it( 'should display step title & content correctly', async () => {
		const { findByRole } = renderTourTooltipsWithMockUI( registry );

		const tourTooltip = await findByRole( 'alertdialog' );

		expect( tourTooltip ).toHaveTextContent( 'Title for step 1' );
		expect( tourTooltip ).toContainHTML( '<em>This is the first step</em>' );
	} );

	it( 'should switch to next step when next button is clicked', async () => {
		const { getByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /next/i } ) );

		getByRole( 'heading', { name: /title for step 2/i } );
	} );

	it( 'should not render next step button if on last step', async () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, FINAL_STEP );

		const { queryByRole } = renderTourTooltipsWithMockUI( registry );

		expect( queryByRole( 'button', { name: /next/i } ) ).not.toBeInTheDocument();
	} );

	it( 'should switch to previous step when back button is clicked', async () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, SECOND_STEP );

		const { getByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /back/i } ) );

		getByRole( 'heading', { name: /title for step 1/i } );
	} );

	it( 'should not render previous step button if on first step', async () => {
		const { queryByRole } = renderTourTooltipsWithMockUI( registry );

		expect( queryByRole( 'button', { name: /back/i } ) ).not.toBeInTheDocument();
	} );

	it( 'should end tour when close icon is clicked', async () => {
		const { getByRole, queryByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should end tour when "Got it" button is clicked', async () => {
		registry.dispatch( CORE_UI ).setValue( STEP_KEY, FINAL_STEP );

		const { getByRole, queryByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /got it/i } ) );

		expect( queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should persist tour completion after tour closed', async () => {
		const { getByRole } = renderTourTooltipsWithMockUI( registry );

		fireEvent.click( getByRole( 'button', { name: /close/i } ) );

		expect( localStorage.setItem ).toHaveBeenCalledWith( ENCOUNTERED_KEY, 'true' );
	} );

	it( 'should start tour if no persisted tour completion exists', async () => {
		renderTourTooltipsWithMockUI( registry );

		expect( localStorage.getItem ).toHaveBeenCalledWith( ENCOUNTERED_KEY );
		expect( localStorage.getItem( ENCOUNTERED_KEY ) ).toBeNull();
		expect( select.getValue( RUN_KEY ) ).toBe( true );
	} );

	it( 'should not start tour if persisted tour completion is found', async () => {
		localStorage.setItem( ENCOUNTERED_KEY, 'true' );

		renderTourTooltipsWithMockUI( registry );

		expect( localStorage.getItem ).toHaveBeenCalledWith( ENCOUNTERED_KEY );
		expect( localStorage.getItem( ENCOUNTERED_KEY ) ).toBe( 'true' );
		expect( select.getValue( RUN_KEY ) ).toBeUndefined();
	} );
} );
