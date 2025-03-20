/**
 * Audience Segmentation ChangeGroupsLink component tests.
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

import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './AudienceSelectionPanel/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';
import { availableAudiences } from '../../../datastore/__fixtures__';
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../../../tests/js/test-utils';
import * as tracking from '../../../../../util/tracking';
import ChangeGroupsLink from './ChangeGroupsLink';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'ChangeGroupsLink', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should not render if no audiences are available', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableAudiences: [],
		} );

		const { queryByRole } = render( <ChangeGroupsLink />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).not.toBeInTheDocument();
	} );

	it( 'should render a button to change groups', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: availableAudiences.reduce( ( acc, { name } ) => {
					acc[ name ] = 20201220;
					return acc;
				}, {} ),
				customDimension: {},
				property: {},
			} );

		const { queryByRole } = render( <ChangeGroupsLink />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Change groups' );
	} );

	it( 'should set UI store key correctly when button is clicked', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: availableAudiences.reduce( ( acc, { name } ) => {
					acc[ name ] = 20201220;
					return acc;
				}, {} ),
				customDimension: {},
				property: {},
			} );

		registry
			.dispatch( CORE_UI )
			.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, false );

		const { getByRole } = render( <ChangeGroupsLink />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const button = getByRole( 'button', { name: /change groups/i } );

		fireEvent.click( button );

		expect(
			registry
				.select( CORE_UI )
				.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar`,
			'change_groups'
		);
	} );
} );
