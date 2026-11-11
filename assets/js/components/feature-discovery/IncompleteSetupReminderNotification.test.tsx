/**
 * IncompleteSetupReminderNotification tests.
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
import { Registry } from 'googlesitekit-data';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { FeatureSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureIncompleteSetupReminderKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { getNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import IncompleteSetupReminderNotification from './IncompleteSetupReminderNotification';

const slug = 'newsletter-signup';
const id = getFeatureIncompleteSetupReminderKey( slug );
const props = getNotificationComponentProps( id );
const resumeURL = 'http://example.com/?expressSetup=true&cta=newsletter-signup';
const feature: FeatureSettings = {
	title: 'Newsletter',
	shortDescription: 'Newsletter sign-up form',
	effort: FEATURE_EFFORTS.MEDIUM,
	goalCategories: [ FEATURE_CATEGORIES.ENGAGEMENT ],
	addedInVersion: '1.191.0',
	setup: {
		type: FEATURE_SETUP_TYPES.SETUP_FLOW,
		getResumeURL: () => resumeURL,
	},
	incompleteSetupReminder: {
		title: 'Almost there! Finish your newsletter sign-up form',
		description:
			'Complete setup to make it live and start building a list of your most interested visitors',
		tooltip: '',
		resolveRequirements: () => Promise.resolve(),
	},
};

describe( 'IncompleteSetupReminderNotification', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		const api = createFeatureDiscovery( registry );
		api.registerFeature( 'other-feature', {
			...feature,
			incompleteSetupReminder: {
				...feature.incompleteSetupReminder!,
				title: 'Other reminder',
			},
		} );
		api.registerFeature( slug, feature );
	} );

	it( 'should render the matching feature copy with reminder markup', () => {
		const { container, getByText, queryByText } = render(
			<IncompleteSetupReminderNotification { ...props } />,
			{ registry }
		);

		expect(
			getByText( feature.incompleteSetupReminder!.title )
		).toBeInTheDocument();
		expect(
			getByText( feature.incompleteSetupReminder!.description )
		).toBeInTheDocument();
		expect( queryByText( 'Other reminder' ) ).not.toBeInTheDocument();
		expect( container ).toMatchSnapshot();
	} );

	it( 'should navigate to the matching feature resume URL', () => {
		const navigateTo = jest
			.spyOn( registry.dispatch( CORE_LOCATION ), 'navigateTo' )
			.mockImplementation( () => {} );
		const { getByRole } = render(
			<IncompleteSetupReminderNotification { ...props } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		expect( navigateTo ).toHaveBeenCalledWith( resumeURL );
	} );

	it( 'should persist dismissal for the current user', async () => {
		const endpoint =
			/^\/google-site-kit\/v1\/core\/user\/data\/dismiss-item/;
		fetchMock.postOnce( endpoint, { body: [ id ] } );
		const { getByRole } = render(
			<IncompleteSetupReminderNotification { ...props } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );

		await waitFor( () =>
			expect( registry.select( CORE_USER ).isItemDismissed( id ) ).toBe(
				true
			)
		);
		expect(
			registry
				.select( CORE_USER )
				.isItemDismissed(
					getFeatureIncompleteSetupReminderKey( 'other-feature' )
				)
		).toBe( false );
	} );

	it( 'should remain visible after more than three viewed dates', () => {
		jest.spyOn(
			registry.select( CORE_NOTIFICATIONS ),
			'getNotificationSeenDates'
		).mockReturnValue( [
			'2026-01-01',
			'2026-01-02',
			'2026-01-03',
			'2026-01-04',
		] );
		const dismiss = jest.spyOn(
			registry.dispatch( CORE_NOTIFICATIONS ),
			'dismissNotification'
		);

		render( <IncompleteSetupReminderNotification { ...props } />, {
			registry,
		} );

		expect( dismiss ).not.toHaveBeenCalled();
	} );

	it( 'should render nothing for an unknown notification ID', () => {
		const { container } = render(
			<IncompleteSetupReminderNotification
				{ ...getNotificationComponentProps( 'unknown' ) }
			/>,
			{ registry }
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it.each( [
		[ 'reminder', { incompleteSetupReminder: undefined } ],
		[
			'title',
			{
				incompleteSetupReminder: {
					...feature.incompleteSetupReminder!,
					title: '',
				},
			},
		],
		[
			'description',
			{
				incompleteSetupReminder: {
					...feature.incompleteSetupReminder!,
					description: '',
				},
			},
		],
		[
			'resume URL',
			{ setup: { ...feature.setup, getResumeURL: () => undefined } },
		],
	] )( 'should render nothing without a %s', ( _, settings ) => {
		registry = createTestRegistry() as Registry;
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( slug, { ...feature, ...settings } );
		const { container } = render(
			<IncompleteSetupReminderNotification { ...props } />,
			{ registry }
		);
		expect( container ).toBeEmptyDOMElement();
	} );
} );
