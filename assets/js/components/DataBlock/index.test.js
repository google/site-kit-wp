/**
 * DataBlock component tests.
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
import DataBlock from './index';
import { render, fireEvent } from '../../../../tests/js/test-utils';
import { NOTICE_STYLE } from '../GatheringDataNotice';

describe( 'DataBlock', () => {
	it( 'should render with title', () => {
		const title = 'Test Title';
		const { getByText } = render( <DataBlock title={ title } /> );

		expect( getByText( title ) ).toBeInTheDocument();
	} );

	it( 'should render with datapoint and unit', () => {
		const datapoint = 0.42;
		const datapointUnit = '%';
		const { getByText } = render(
			<DataBlock
				datapoint={ datapoint }
				datapointUnit={ datapointUnit }
			/>
		);

		expect( getByText( /42%/i ) ).toBeInTheDocument();
	} );

	it( 'should render with change indicator', () => {
		const change = 0.155;
		const { getByText } = render(
			<DataBlock change={ change } changeDataUnit="%" />
		);

		expect( getByText( /15.5%/i ) ).toBeInTheDocument();
	} );

	it( 'should render with gathering data notice', () => {
		const { getByText } = render( <DataBlock gatheringData /> );

		expect( getByText( /Gathering data…/i ) ).toBeInTheDocument();
	} );

	it( 'should render with custom gathering data notice style', () => {
		const { container, getByText } = render(
			<DataBlock
				gatheringData
				gatheringDataNoticeStyle={ NOTICE_STYLE.SMALL }
			/>
		);

		expect( getByText( /Gathering data…/i ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-gathering-data-notice--has-style-small'
			)
		).toBeInTheDocument();
	} );

	it( 'should render with badge', () => {
		const badge = <span>New</span>;
		const { getByText } = render( <DataBlock badge={ badge } /> );

		expect( getByText( /New/i ) ).toBeInTheDocument();
	} );

	it( 'should handle click events when in button context', () => {
		const handleStatSelection = vi.fn();
		const stat = 1;
		const { getByRole } = render(
			<DataBlock
				context="button"
				stat={ stat }
				handleStatSelection={ handleStatSelection }
			/>
		);

		fireEvent.click( getByRole( 'button' ) );
		expect( handleStatSelection ).toHaveBeenCalledWith( stat );
	} );

	it( 'should not handle click events when gathering data', () => {
		const handleStatSelection = vi.fn();
		const { getByRole } = render(
			<DataBlock
				context="button"
				gatheringData
				handleStatSelection={ handleStatSelection }
			/>
		);

		fireEvent.click( getByRole( 'button' ) );
		expect( handleStatSelection ).not.toHaveBeenCalled();
	} );

	it( 'should handle keyboard events when in button context', () => {
		const handleStatSelection = vi.fn();
		const stat = 1;
		const { getByRole } = render(
			<DataBlock
				context="button"
				stat={ stat }
				handleStatSelection={ handleStatSelection }
			/>
		);

		fireEvent.keyDown( getByRole( 'button' ), { key: 'Enter' } );
		expect( handleStatSelection ).toHaveBeenCalledWith( stat );

		fireEvent.keyDown( getByRole( 'button' ), { key: ' ' } );
		expect( handleStatSelection ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should apply selected class when selected', () => {
		const { container } = render( <DataBlock selected /> );

		expect(
			container.querySelector( '.googlesitekit-data-block' )
		).toHaveClass( 'googlesitekit-data-block--selected' );
	} );

	it( 'should apply custom className', () => {
		const className = 'test-class';
		const { container } = render( <DataBlock className={ className } /> );

		expect(
			container.querySelector( '.googlesitekit-data-block' )
		).toHaveClass( className );
	} );

	it( 'should render with sparkline', () => {
		const sparkline = <div>Sparkline</div>;
		const { container } = render( <DataBlock sparkline={ sparkline } /> );

		expect(
			container.querySelector( '.googlesitekit-data-block__sparkline' )
		).toBeInTheDocument();
	} );
} );
