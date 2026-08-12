/**
 * Tests for UserInputPreviewGroup component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { fireEvent, render } from '@tests/js/test-utils';
import { createTestRegistry } from '@tests/js/utils';
import UserInputPreviewGroup from './UserInputPreviewGroup';
import {
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_QUESTIONS_PURPOSE,
} from './util/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'UserInputPreviewGroup', () => {
	let registry;

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		registry.dispatch( CORE_UI ).setValues( {
			[ USER_INPUT_CURRENTLY_EDITING_KEY ]: undefined,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: {
				values: [],
				scope: 'site',
			},
			postFrequency: {
				values: [],
				scope: 'site',
			},
			goals: {
				values: [],
				scope: 'site',
			},
		} );
	} );

	const baseProps = {
		slug: USER_INPUT_QUESTIONS_PURPOSE,
		title: 'What is the main purpose of this site?',
		subtitle: '',
		values: [],
		options: {
			option1: 'Option 1',
			option2: 'Option 2',
		},
		settingsView: true,
		onChange: jest.fn(),
	};

	it( 'should show the "Answer question" button and hide the Edit link for an unanswered question when the `setupFlowRefresh` feature flag is enabled', () => {
		const { container, getByRole, queryByRole } = render(
			<UserInputPreviewGroup { ...baseProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
			}
		);

		expect(
			getByRole( 'button', { name: /answer question/i } )
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /edit/i } )
		).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-error-text' )
		).not.toBeInTheDocument();
	} );

	it( 'should expand to the edit mode when the "Answer question" button is clicked', () => {
		const { getByRole } = render(
			<UserInputPreviewGroup { ...baseProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
			}
		);

		fireEvent.click( getByRole( 'button', { name: /answer question/i } ) );

		expect(
			getByRole( 'button', { name: /save answer/i } )
		).toBeInTheDocument();
		expect(
			getByRole( 'radio', { name: /option 1/i } )
		).toBeInTheDocument();
		expect(
			getByRole( 'radio', { name: /option 2/i } )
		).toBeInTheDocument();
	} );

	it( 'should track a select_answer event when the "Answer question" button is clicked', () => {
		const { getByRole } = render(
			<UserInputPreviewGroup { ...baseProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: 'test-context',
			}
		);

		fireEvent.click( getByRole( 'button', { name: /answer question/i } ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'test-context_kmw',
			'select_answer',
			USER_INPUT_QUESTIONS_PURPOSE
		);
	} );
} );
