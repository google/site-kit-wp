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
 * Internal dependencies
 */
import { render } from '../../../../../tests/js/test-utils';
import MaybeTooltip from './MaybeTooltip';

describe( 'MaybeTooltip', () => {
	it( 'should render children without Tooltip when conditions are not met', () => {
		const { container } = render(
			<MaybeTooltip>
				<div className="test-child">Test</div>
			</MaybeTooltip>
		);
		expect( container.querySelector( '.test-child' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.mdc-tooltip' )
		).not.toBeInTheDocument();
	} );

	it( 'should not render Tooltip when disabled is true', () => {
		const { container } = render(
			<MaybeTooltip disabled tooltip tooltipTitle="Test Title">
				<div className="test-child">Test</div>
			</MaybeTooltip>
		);
		expect(
			container.querySelector( '.mdc-tooltip' )
		).not.toBeInTheDocument();
	} );

	it( 'should not render Tooltip when tooltipTitle is not provided', () => {
		const { container } = render(
			<MaybeTooltip tooltip>
				<div className="test-child">Test</div>
			</MaybeTooltip>
		);
		expect(
			container.querySelector( '.mdc-tooltip' )
		).not.toBeInTheDocument();
	} );
} );
