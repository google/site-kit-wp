/**
 * CronSchedulerErrorNotice component tests.
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
import CronSchedulerErrorNotice from './CronSchedulerErrorNotice';
import {
	createTestRegistry,
	provideSiteInfo,
	render,
} from '../../../../../../tests/js/test-utils';

describe( 'CronSchedulerErrorNotice', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'renders expected title and description', () => {
		const { getByText } = render( <CronSchedulerErrorNotice />, {
			registry,
		} );

		expect(
			getByText( 'Email reports are failing to send' )
		).toBeInTheDocument();
		expect(
			getByText(
				'We were unable to deliver your report, likely due to a WP-Cron configuration error in your WordPress site’s system settings. To fix this, contact your administrator or get help. Report delivery will automatically resume once the issue is resolved.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders a "Get help" link to the scheduler issues doc', () => {
		const { getByRole } = render( <CronSchedulerErrorNotice />, {
			registry,
		} );

		const helpLink = getByRole( 'button', { name: /get help/i } );
		expect( helpLink ).toBeInTheDocument();
		expect( helpLink.getAttribute( 'href' ) ).toContain(
			'doc=email-reporting-scheduler-issues'
		);
	} );
} );
