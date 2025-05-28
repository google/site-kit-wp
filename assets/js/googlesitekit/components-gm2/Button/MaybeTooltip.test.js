/**
 * MaybeTooltip tests.
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
 * MaybeTooltip tests.
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
import { render, fireEvent } from '../../../../../tests/js/test-utils';
import MaybeTooltip from './MaybeTooltip';

describe( 'MaybeTooltip', () => {
	it( 'should render children without Tooltip when not hovered', () => {
		const { queryByRole } = render(
			<MaybeTooltip>
				<div className="test-child">Test</div>
			</MaybeTooltip>
		);
		expect( queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'should show Tooltip on hover', async () => {
		const { getByText, findByRole, queryByRole } = render(
			<MaybeTooltip tooltip tooltipTitle="Test Title">
				<div className="test-child">Hover me</div>
			</MaybeTooltip>
		);

		expect( queryByRole( 'tooltip' ) ).not.toBeInTheDocument();

		fireEvent.mouseOver( getByText( 'Hover me' ) );

		expect( await findByRole( 'tooltip' ) ).toBeInTheDocument();
		expect( getByText( 'Test Title' ) ).toBeInTheDocument();
	} );

	it( 'should show Tooltip on hover when hasIconOnly is true', async () => {
		const { getByText, findByRole } = render(
			<MaybeTooltip hasIconOnly tooltipTitle="Icon Title">
				<div className="test-child">Icon</div>
			</MaybeTooltip>
		);

		fireEvent.mouseOver( getByText( 'Icon' ) );
		expect( await findByRole( 'tooltip' ) ).toBeInTheDocument();
	} );

	it( 'should not show Tooltip when disabled is true', () => {
		const { getByText, queryByRole } = render(
			<MaybeTooltip disabled tooltip tooltipTitle="Test Title">
				<div className="test-child">Test</div>
			</MaybeTooltip>
		);

		fireEvent.mouseOver( getByText( 'Test' ) );
		expect( queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'should accept element as tooltipTitle', async () => {
		const { getByText, findByText } = render(
			<MaybeTooltip tooltip tooltipTitle={ <span>Element Title</span> }>
				<div className="test-child">Hover me</div>
			</MaybeTooltip>
		);

		fireEvent.mouseOver( getByText( 'Hover me' ) );
		expect( await findByText( 'Element Title' ) ).toBeInTheDocument();
	} );

	it( 'should not show Tooltip when tooltipTitle is not provided', () => {
		const { getByText, queryByRole } = render(
			<MaybeTooltip tooltip>
				<div className="test-child">Test</div>
			</MaybeTooltip>
		);

		fireEvent.mouseOver( getByText( 'Test' ) );
		expect( queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );
} );
