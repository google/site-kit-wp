/**
 * UserInputQuestionnaire component tests.
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
import { ALL_SERVICES_TAB_PATH } from '@/js/components/feature-discovery/constants';
import { setItem } from '@/js/googlesitekit/api/cache';
import { VIEW_CONTEXT_USER_INPUT } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import * as pendingSetup from '@/js/googlesitekit/feature-discovery/pending-setup';
import { KEY_METRICS_FEATURE_SLUG } from '@/js/modules/analytics-4/feature-discovery/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import UserInputQuestionnaire from './UserInputQuestionnaire';
import {
	USER_INPUT_QUESTIONS_GOALS,
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
} from './util/constants';

const {
	FEATURE_DISCOVERY_SETUP_CACHE_KEY,
	consumePendingSetup,
	setPendingSetup,
} = pendingSetup;

describe( 'UserInputQuestionnaire', () => {
	mockLocation();

	const userInputSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
	);

	const userInputSettings = {
		[ USER_INPUT_QUESTIONS_PURPOSE ]: {
			values: [ 'publish_blog' ],
			scope: 'site',
		},
		[ USER_INPUT_QUESTION_POST_FREQUENCY ]: {
			values: [ 'monthly' ],
			scope: 'user',
		},
		[ USER_INPUT_QUESTIONS_GOALS ]: {
			values: [ 'retaining_visitors' ],
			scope: 'user',
		},
	};

	let registry;
	let consumePendingSetupSpy;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideSiteConnection( registry );
		provideUserAuthentication( registry );
		provideModules( registry );

		registry
			.dispatch( CORE_USER )
			.receiveGetUserInputSettings( userInputSettings );

		// Starts the questionnaire on its last question, whose CTA completes it.
		global.location.href = `http://example.com/wp-admin/admin.php?page=googlesitekit-user-input&question=${ USER_INPUT_QUESTIONS_GOALS }`;

		fetchMock.postOnce( userInputSettingsEndpoint, {
			body: userInputSettings,
			status: 200,
		} );

		consumePendingSetupSpy = jest.spyOn(
			pendingSetup,
			'consumePendingSetup'
		);
	} );

	afterEach( async () => {
		consumePendingSetupSpy.mockRestore();
		await consumePendingSetup();
	} );

	async function completeQuestionnaire() {
		const { getByRole, waitForRegistry } = render(
			<UserInputQuestionnaire />,
			{
				registry,
				viewContext: VIEW_CONTEXT_USER_INPUT,
			}
		);

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /complete setup/i } ) );
	}

	it( 'should return to the hub when the pending setup belongs to Key Metrics', async () => {
		await setPendingSetup(
			KEY_METRICS_FEATURE_SLUG,
			ALL_SERVICES_TAB_PATH
		);

		await completeQuestionnaire();

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalledWith(
				registry
					.select( CORE_SITE )
					.getAdminURL( 'googlesitekit-features' )
			);
		} );

		expect( consumePendingSetupSpy ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'there is no pending setup', () => Promise.resolve() ],
		[
			'the pending setup has expired',
			() =>
				setItem(
					FEATURE_DISCOVERY_SETUP_CACHE_KEY,
					{
						featureSlug: KEY_METRICS_FEATURE_SLUG,
						returnTab: ALL_SERVICES_TAB_PATH,
					},
					{
						// Saved two hours ago, with a TTL of one hour.
						timestamp: Math.round( Date.now() / 1000 ) - 7200, // eslint-disable-line sitekit/no-direct-date
						ttl: 3600,
					}
				),
		],
		[
			'the pending setup belongs to another feature',
			() => setPendingSetup( 'ads', ALL_SERVICES_TAB_PATH ),
		],
	] )(
		'should complete on the dashboard when %s',
		async ( _, providePendingSetup ) => {
			await providePendingSetup();

			await completeQuestionnaire();

			await waitFor( () => {
				expect( global.location.assign ).toHaveBeenCalledWith(
					registry
						.select( CORE_SITE )
						.getAdminURL( 'googlesitekit-dashboard' )
				);
			} );

			expect( consumePendingSetupSpy ).not.toHaveBeenCalled();
		}
	);
} );
