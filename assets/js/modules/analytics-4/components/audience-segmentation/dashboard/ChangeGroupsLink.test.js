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
import { availableAudiences } from '../../../datastore/__fixtures__';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	render,
} from '../../../../../../../tests/js/test-utils';
import ChangeGroupsLink from './ChangeGroupsLink';

describe( 'ChangeGroupsLink', () => {
	let registry;

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should not render if available audiences are undefined', () => {
		freezeFetch( settingsEndpoint );

		const { queryByRole } = render( <ChangeGroupsLink />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).not.toBeInTheDocument();
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
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
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
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
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

		const { getByRole } = render( <ChangeGroupsLink />, { registry } );

		const button = getByRole( 'button', { name: /change groups/i } );

		fireEvent.click( button );

		expect(
			registry
				.select( CORE_UI )
				.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );
} );
