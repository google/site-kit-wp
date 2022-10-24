/**
 * BannerNotification component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import BannerNotification from './index';
import { render } from '../../../../../tests/js/test-utils';

describe( 'BannerNotification', () => {
	it( 'should render span with dangerouslySetInnerHTML', () => {
		const { container, getByText } = render(
			<BannerNotification
				id="fake"
				title={ 'Hey there!' }
				description={ 'I am string, not React elemet' }
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-publisher-win__inner-html'
			)
		).toBeInTheDocument();
		expect(
			getByText( /I am string, not React elemet/ )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render React element', () => {
		const { container } = render(
			<BannerNotification
				id="fake"
				title={ 'Hey there!' }
				description={
					<p className="sk-react-element">I am React elemet</p>
				}
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-publisher-win__inner-html'
			)
		).toBeFalsy();

		expect(
			container.querySelector( '.sk-react-element' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
