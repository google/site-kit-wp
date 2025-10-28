/**
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
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import ShowNextToCommentsToggle from './ShowNextToCommentsToggle';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'ShowNextToCommentsToggle', () => {
	let registry;

	const validSettings = {
		clientID: 'test-client-id.apps.googleusercontent.com',
		text: 'signin_with',
		theme: 'outline',
		shape: 'rectangular',
		oneTapEnabled: false,
		showNextToCommentsEnabled: false,
	};

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
				active: true,
				connected: true,
			},
		] );
		provideSiteInfo( registry );
	} );

	it( 'should render the toggle when showNextToCommentsEnabled is false', () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: true,
			isMultisite: false,
		} );

		const { getByLabelText, getAllByRole } = render(
			<ShowNextToCommentsToggle />,
			{
				registry,
			}
		);

		expect(
			getByLabelText( /Show next to comments/i )
		).toBeInTheDocument();

		const switchElements = getAllByRole( 'switch', {
			name: /Show next to comments/i,
		} );
		switchElements.forEach( ( switchEl ) => {
			expect( switchEl ).not.toBeChecked();
		} );
	} );

	it( 'should render the toggle as checked when showNextToCommentsEnabled is true', () => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).receiveGetSettings( {
			...validSettings,
			showNextToCommentsEnabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: true,
			isMultisite: false,
		} );

		const { getByLabelText, getAllByRole } = render(
			<ShowNextToCommentsToggle />,
			{
				registry,
			}
		);

		expect(
			getByLabelText( /Show next to comments/i )
		).toBeInTheDocument();

		const switchElements = getAllByRole( 'switch', {
			name: /Show next to comments/i,
		} );
		switchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );
	} );

	it( 'should toggle the setting when clicked', () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: true,
			isMultisite: false,
		} );

		const { getByLabelText, getAllByRole } = render(
			<ShowNextToCommentsToggle />,
			{
				registry,
			}
		);

		const toggle = getByLabelText( /Show next to comments/i );

		// Initially unchecked
		let switchElements = getAllByRole( 'switch', {
			name: /Show next to comments/i,
		} );
		switchElements.forEach( ( switchEl ) => {
			expect( switchEl ).not.toBeChecked();
		} );

		// Click to enable
		fireEvent.click( toggle );

		switchElements = getAllByRole( 'switch', {
			name: /Show next to comments/i,
		} );
		switchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );

		// Verify the setting was updated in the registry
		expect(
			registry
				.select( MODULES_SIGN_IN_WITH_GOOGLE )
				.getShowNextToCommentsEnabled()
		).toBe( true );

		// Click to disable
		fireEvent.click( toggle );

		switchElements = getAllByRole( 'switch', {
			name: /Show next to comments/i,
		} );
		switchElements.forEach( ( switchEl ) => {
			expect( switchEl ).not.toBeChecked();
		} );

		// Verify the setting was updated in the registry
		expect(
			registry
				.select( MODULES_SIGN_IN_WITH_GOOGLE )
				.getShowNextToCommentsEnabled()
		).toBe( false );
	} );

	it( 'should fire appropriate tracking events when toggle is clicked', () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: true,
			isMultisite: false,
		} );

		const { getByLabelText } = render( <ShowNextToCommentsToggle />, {
			viewContext: VIEW_CONTEXT_SETTINGS,
			registry,
		} );

		// Click to enable
		fireEvent.click( getByLabelText( /Show next to comments/i ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_sign-in-with-google-settings',
			'enable_comments'
		);

		// Click to disable
		fireEvent.click( getByLabelText( /Show next to comments/i ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_sign-in-with-google-settings',
			'disable_comments'
		);
	} );

	it( 'should disable the toggle when anyoneCanRegister is false', () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			anyoneCanRegister: false,
			isMultisite: false,
		} );

		const { getByLabelText } = render( <ShowNextToCommentsToggle />, {
			registry,
		} );

		const toggle = getByLabelText( /Show next to comments/i );
		expect( toggle ).toBeDisabled();
	} );
} );
