/**
 * Reader Revenue Manager express setup `useExpressSetupSurveyTriggers` hook tests.
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
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { setupCompleteStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitForDefaultTimeouts,
} from '@tests/js/test-utils';
import useExpressSetupSurveyTriggers from './useExpressSetupSurveyTriggers';
import useStep from './useStep';

function SurveyTriggerTestComponent() {
	useExpressSetupSurveyTriggers();

	const [ step, setStep ] = useStep();

	return createElement(
		'button',
		{
			onClick: () => setStep( setupCompleteStep.slug ),
			type: 'button',
		},
		step
	);
}

describe( 'useExpressSetupSurveyTriggers', () => {
	mockLocation();

	const STARTED_TRIGGER_ID = `rrm_${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }_express_setup_started`;
	const COMPLETED_TRIGGER_ID = `rrm_${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }_express_setup_completed`;

	let registry: Registry;

	/**
	 * Counts the survey trigger requests made for the given trigger ID.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} triggerID Survey trigger ID.
	 * @return {number} Number of requests made.
	 */
	function countTriggerRequests( triggerID: string ): number {
		return fetchMock
			.calls( surveyTriggerEndpoint )
			.filter( ( call ) =>
				String( call[ 1 ]?.body ).includes( triggerID )
			).length;
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideUserAuthentication( registry );
		provideSiteInfo( registry );

		// Not the shared `mockSurveyEndpoints()` helper: it mocks a single
		// request of each kind, and both triggers fire within one render here.
		fetchMock.get( surveyTimeoutsEndpoint, { status: 200, body: [] } );
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
	} );

	it( 'should trigger the started survey when opened with a recognised CTA', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: STARTED_TRIGGER_ID } },
		} );
	} );

	it( 'should trigger the started survey only once as the flow advances', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;

		const { getByRole, waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( countTriggerRequests( STARTED_TRIGGER_ID ) ).toBe( 1 );

		fireEvent.click( getByRole( 'button' ) );

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( countTriggerRequests( STARTED_TRIGGER_ID ) ).toBe( 1 );
	} );

	it( 'should trigger the completed survey when the flow reaches the setup complete step', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }`;

		const { getByRole, waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( countTriggerRequests( COMPLETED_TRIGGER_ID ) ).toBe( 0 );

		fireEvent.click( getByRole( 'button' ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: COMPLETED_TRIGGER_ID } },
		} );
	} );

	it( 'should trigger the completed survey when entering on the setup complete step', async () => {
		global.location.href = `http://example.com/?cta=${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }&step=${ setupCompleteStep.slug }`;

		const { waitForRegistry } = render(
			createElement( SurveyTriggerTestComponent ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: COMPLETED_TRIGGER_ID } },
		} );
	} );

	it( 'should not trigger either survey when no CTA is specified', async () => {
		global.location.href = 'http://example.com/';

		render( createElement( SurveyTriggerTestComponent ), { registry } );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'should not trigger either survey for an unrecognised CTA', async () => {
		global.location.href = 'http://example.com/?cta=not-a-real-cta';

		render( createElement( SurveyTriggerTestComponent ), { registry } );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'should not trigger either survey when the default flow reaches the setup complete step', async () => {
		global.location.href = `http://example.com/?step=${ setupCompleteStep.slug }`;

		render( createElement( SurveyTriggerTestComponent ), { registry } );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );
} );
