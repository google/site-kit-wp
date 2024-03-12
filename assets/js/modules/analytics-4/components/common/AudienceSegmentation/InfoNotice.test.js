/**
 * EnhancedMeasurementSwitch tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { render } from '../../../../../../../tests/js/test-utils';
import InfoNotice from './InfoNotice';
import { Default as InfoNoticeStory } from './InfoNotice.stories';

describe( 'InfoNotice', () => {
	it( 'should render correctly in the default state', () => {
		const { container, getByText } = render(
			<InfoNotice { ...InfoNoticeStory.args } />
		);

		expect( container ).toMatchSnapshot();
		expect( getByText( InfoNoticeStory.args.content ) ).toBeInTheDocument();

		expect(
			getByText( InfoNoticeStory.args.dismissLabel )
		).toBeInTheDocument();
	} );

	it( 'should invoke the onDismiss callback when clicked', () => {
		const onClick = jest.fn();

		const { getByText } = render(
			<InfoNotice { ...InfoNoticeStory.args } onDismiss={ onClick } />
		);

		const button = getByText( InfoNoticeStory.args.dismissLabel );

		button.click();

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
