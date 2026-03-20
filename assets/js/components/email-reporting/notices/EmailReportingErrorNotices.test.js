/**
 * EmailReportingErrorNotices component tests.
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

import EmailReportingErrorNotices from './EmailReportingErrorNotices';
import {
	render,
	createTestRegistry,
	provideUserAuthentication,
	provideModules,
} from '../../../../../tests/js/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import * as tracking from '@/js/util/tracking';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'EmailReportingErrorNotices', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		mockTrackEvent.mockClear();
	} );

	it( 'should render the default server error notice when email reporting is enabled, user is not view-only, and there is no category ID', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: {
				email_report_section_build_failed: [
					'title must be a non-empty string',
				],
			},
			error_data: [],
		} );

		const { container, getByText } = render(
			<EmailReportingErrorNotices />,
			{
				registry,
			}
		);

		expect( container ).not.toBeEmptyDOMElement();
		expect(
			getByText( 'Email reports are failing to send' )
		).toBeInTheDocument();
		expect(
			getByText(
				'We were unable to deliver your report. Report delivery will automatically resume once the issue is resolved.'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the permissions error notice when email reporting is enabled, user is not view-only, and there is a permissions_error category ID and a module slug', () => {
		provideModules( registry );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: {
				403: [
					'User does not have sufficient permissions for this property. To learn more about Property ID, see https://developers.google.com/analytics/devguides/reporting/data/v1/property-id.',
				],
			},
			error_data: {
				403: {
					status: 403,
					reason: 'forbidden',
					category_id: 'permissions_error',
					module_slug: 'analytics-4',
				},
			},
		} );

		const { container } = render( <EmailReportingErrorNotices />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the report error notice when email reporting is enabled, user is not view-only, and there is a report_error category ID and a module slug', () => {
		provideModules( registry );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: {
				unknown: [
					'cURL error 6: Could not resolve host: searchconsole.googleapis.com (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://searchconsole.googleapis.com/batch',
				],
			},
			error_data: {
				unknown: {
					status: 500,
					reason: '',
					category_id: 'report_error',
					module_slug: 'search-console',
				},
			},
		} );

		const { container } = render( <EmailReportingErrorNotices />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the sending error notice when email reporting is enabled, user is not view-only, and there is a sending_error category ID', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: {
				wp_mail_failed: [
					'You must provide at least one recipient email address.',
				],
			},
			error_data: {
				wp_mail_failed: {
					to: [ 'incorrect.email' ],
					subject: 'Your weekly Site Kit report for oi.ie',
					message:
						'<p>Here is your weekly Site Kit report for oi.ie</p>',
					headers: [],
					attachments: [],
					phpmailer_exception_code: 2,
					category_id: 'sending_error',
				},
			},
		} );

		const { container, getByText } = render(
			<EmailReportingErrorNotices />,
			{
				registry,
			}
		);

		expect( container ).not.toBeEmptyDOMElement();
		expect(
			getByText( 'Email reports are failing to send' )
		).toBeInTheDocument();
		expect(
			getByText(
				'We were unable to deliver your report, likely due to your WordPress email configuration. To fix this, go to your WordPress site’s system settings or contact your host. Report delivery will automatically resume once the issue is resolved.'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the cron scheduler error notice when there is a cron_scheduler_error category ID', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: {
				cron_scheduler_error: [ 'Cron issue.' ],
			},
			error_data: {
				cron_scheduler_error: {
					category_id: 'cron_scheduler_error',
				},
			},
		} );

		const { container, getByText } = render(
			<EmailReportingErrorNotices />,
			{
				registry,
			}
		);

		expect( container ).not.toBeEmptyDOMElement();
		expect(
			getByText( 'Email reports are failing to send' )
		).toBeInTheDocument();
		expect(
			getByText(
				'We were unable to deliver your report, likely due to a WP-Cron configuration error in your WordPress site’s system settings. To fix this, contact your administrator or get help. Report delivery will automatically resume once the issue is resolved.'
			)
		).toBeInTheDocument();
	} );

	it( 'should not render when email reporting is not enabled', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: { test_error: [ 'This is a test error.' ] },
			error_data: [],
		} );

		const { container } = render( <EmailReportingErrorNotices />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when dashboard context is view-only', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( {
			errors: { test_error: [ 'This is a test error.' ] },
			error_data: [],
		} );

		const { container } = render( <EmailReportingErrorNotices />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there are no errors', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( [] );

		const { container } = render( <EmailReportingErrorNotices />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
