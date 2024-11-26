/**
 * SettingsGroup component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import { render } from '../../../../tests/js/test-utils';
import SettingsGroup from './SettingsGroup';

describe( 'SettingsGroup', () => {
	it( 'renders children', () => {
		const { container } = render(
			<SettingsGroup title="Test Title">
				<div>Test Child 1</div>
				<div>Test Child 2</div>
			</SettingsGroup>
		);

		expect( container ).toMatchSnapshot();

		expect(
			container.querySelectorAll(
				'.googlesitekit-settings-module__setting'
			).length
		).toBe( 2 );
	} );
} );
