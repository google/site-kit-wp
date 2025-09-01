/**
 * Tests for UserInputEditModeContent component.
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
import { createTestRegistry } from '../../../../tests/js/utils';
import { render } from '../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_QUESTIONS_PURPOSE,
} from './util/constants';
import UserInputEditModeContent from './UserInputEditModeContent';

describe( 'UserInputEditModeContent', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_UI ).setValues( {
			[ USER_INPUT_CURRENTLY_EDITING_KEY ]: USER_INPUT_QUESTIONS_PURPOSE,
		} );
	} );

	const defaultProps = {
		onChange: jest.fn(),
		options: {
			option1: 'Option 1',
			option2: 'Option 2',
		},
		settingsView: true,
		slug: USER_INPUT_QUESTIONS_PURPOSE,
		values: [ 'option1' ],
	};

	it( 'should disable the SpinnerButton when userInputValuesHaveErrors is true (no item selected)', () => {
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			[ USER_INPUT_QUESTIONS_PURPOSE ]: {
				values: [],
			},
		} );

		const { getByRole } = render(
			<UserInputEditModeContent { ...defaultProps } />,
			{
				registry,
			}
		);

		const spinnerButton = getByRole( 'button', { name: /save/i } );
		expect( spinnerButton ).toBeDisabled();
	} );

	it( 'should enable the SpinnerButton when userInputValuesHaveErrors is false (item is selected)', () => {
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			[ USER_INPUT_QUESTIONS_PURPOSE ]: {
				values: [ 'option1' ],
			},
		} );

		const { getByRole } = render(
			<UserInputEditModeContent { ...defaultProps } />,
			{
				registry,
			}
		);

		const spinnerButton = getByRole( 'button', { name: /save/i } );
		expect( spinnerButton ).not.toBeDisabled();
	} );

	it( 'should disable the SpinnerButton when answerHasError is true', () => {
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			[ USER_INPUT_QUESTIONS_PURPOSE ]: {
				values: [ 'option1' ],
			},
		} );

		const propsWithEmptyValues = {
			...defaultProps,
			values: [],
		};

		const { getByRole } = render(
			<UserInputEditModeContent { ...propsWithEmptyValues } />,
			{
				registry,
			}
		);

		const spinnerButton = getByRole( 'button', { name: /save/i } );
		expect( spinnerButton ).toBeDisabled();
	} );
} );
