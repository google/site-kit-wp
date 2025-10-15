/**
 * KeyMetricsSetupApp component tests.
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

import {
	render,
	createTestRegistry,
	provideUserAuthentication,
	fireEvent,
	provideSiteInfo,
	freezeFetch,
	muteFetch,
	waitForTimeouts,
} from '../../../../tests/js/test-utils';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_KEY_METRICS_SETUP } from '@/js/googlesitekit/constants';
import KeyMetricsSetupApp from './KeyMetricsSetupApp';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';

describe( 'KeyMetricsSetupApp', () => {
	mockLocation();

	let registry;

	const syncAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);
	const syncCustomDimensionsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
	);

	const coreUserInputSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
	);

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);

	// The `UserInputSelectOptions` automatically focuses the first radio/checkbox
	// 50 milliseconds after it renders, which causes inconsistencies in snapshots,
	// so we advance the timer to make sure it's focused before we capture the snapshot.
	async function waitForFocus() {
		return await waitForTimeouts( 100 );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideSiteInfo( registry );

		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {} );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		fetchMock.post( syncAudiencesEndpoint, { body: [], status: 200 } );
		fetchMock.post( syncCustomDimensionsEndpoint, {
			body: [],
			status: 200,
		} );

		muteFetch( audienceSettingsEndpoint );

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withConnected( MODULE_SLUG_ANALYTICS_4 ) );
	} );

	it( 'should render correctly', async () => {
		const { getByText, getByRole, waitForRegistry } = render(
			<KeyMetricsSetupApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
			}
		);

		await waitForRegistry();
		await waitForFocus();

		expect(
			getByText( 'Tell us your main goal to get tailored metrics' )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Complete setup' } )
		).toBeInTheDocument();
	} );

	it( 'should exclude the "Other" option from the options list', async () => {
		const { getAllByRole, getByRole, queryByRole, waitForRegistry } =
			render( <KeyMetricsSetupApp />, {
				registry,
				viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
			} );

		await waitForRegistry();

		[
			'Sell products',
			'Provide services',
			'Monetize content',
			'Publish a blog',
			'Publish news content',
			'Portfolio or business card',
		].forEach( ( option ) => {
			expect(
				getByRole( 'radio', { name: option } )
			).toBeInTheDocument();
		} );

		expect(
			queryByRole( 'radio', { name: 'Other' } )
		).not.toBeInTheDocument();

		expect( getAllByRole( 'radio' ) ).toHaveLength( 6 );
	} );

	it( 'should save the answer when the CTA is clicked', async () => {
		freezeFetch( coreUserInputSettingsEndpointRegExp );

		const { getByRole, waitForRegistry } = render( <KeyMetricsSetupApp />, {
			registry,
			viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'radio', { name: 'Publish a blog' } ) );

		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched(
			coreUserInputSettingsEndpointRegExp,
			{
				method: 'POST',
				body: { data: { settings: { purpose: [ 'publish_blog' ] } } },
			}
		);
	} );

	it( 'should navigate to the dashboard when saving is successful', async () => {
		fetchMock.postOnce( coreUserInputSettingsEndpointRegExp, {
			body: {
				purpose: {
					values: [ 'publish_blog' ],
					scope: 'site',
				},
			},
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render( <KeyMetricsSetupApp />, {
			registry,
			viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'radio', { name: 'Publish a blog' } ) );
		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
	} );

	it( 'should show an error when the save fails', async () => {
		fetchMock.postOnce( coreUserInputSettingsEndpointRegExp, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole, getByText, waitForRegistry } = render(
			<KeyMetricsSetupApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
			}
		);

		await waitForRegistry();
		await waitForFocus();

		fireEvent.click( getByRole( 'radio', { name: 'Publish a blog' } ) );
		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		await waitForRegistry();

		expect(
			getByText( 'Error: Internal server error (Please try again.)' )
		).toBeInTheDocument();

		expect( console ).toHaveErroredWith( [
			'Google Site Kit API Error',
			'method:POST',
			'datapoint:user-input-settings',
			'type:core',
			'identifier:user',
			'error:"Internal server error"',
		] );
	} );

	it( 'should not navigate to the dashboard when saving fails', async () => {
		fetchMock.postOnce( coreUserInputSettingsEndpointRegExp, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole, waitForRegistry } = render( <KeyMetricsSetupApp />, {
			registry,
			viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'radio', { name: 'Publish a blog' } ) );
		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		await waitForRegistry();

		expect( global.location.assign ).not.toHaveBeenCalled();
		expect( console ).toHaveErrored();
	} );

	it( 'should show the analytics setup success toast notice', async () => {
		const { container, getByText, waitForRegistry } = render(
			<KeyMetricsSetupApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
			}
		);

		await waitForRegistry();
		await waitForFocus();

		expect( container ).toMatchSnapshot();

		expect(
			getByText( 'Google Analytics was successfully set up' )
		).toBeInTheDocument();
	} );

	it( 'should display the progress indicator when the showProgress query arg is present', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-key-metrics-setup&showProgress=true';

		const { container, waitForRegistry } = render( <KeyMetricsSetupApp />, {
			registry,
			viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
		} );

		await waitForRegistry();

		await waitForFocus();

		expect( container ).toMatchSnapshot();

		expect(
			document.querySelector(
				'.googlesitekit-subheader .googlesitekit-progress-indicator'
			)
		).toBeInTheDocument();
	} );

	it( 'should sync audiences and custom dimensions on render', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences: null,
		} );

		const { waitForRegistry } = render( <KeyMetricsSetupApp />, {
			registry,
			viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( syncAudiencesEndpoint );
		expect( fetchMock ).toHaveFetched( syncCustomDimensionsEndpoint );
	} );

	it( 'should not attempt to sync again while syncing is already in progress', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences: null,
		} );

		const { rerender, waitForRegistry } = render( <KeyMetricsSetupApp />, {
			registry,
			viewContext: VIEW_CONTEXT_KEY_METRICS_SETUP,
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, syncAudiencesEndpoint );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			syncCustomDimensionsEndpoint
		);

		rerender( <KeyMetricsSetupApp /> );
		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, syncAudiencesEndpoint );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			syncCustomDimensionsEndpoint
		);
	} );
} );
