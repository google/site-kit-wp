/**
 * ConversionReportingNotificationCTAWidget component tests.
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

/**
 * Internal dependencies
 */
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { getWidgetComponentProps } from '../../googlesitekit/widgets/util';
import {
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideKeyMetricsUserInputSettings,
} from '../../../../tests/js/test-utils';
import ConversionReportingNotificationCTAWidget from './ConversionReportingNotificationCTAWidget';

describe( 'ConversionReportingNotificationCTAWidget', () => {
	let registry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'ConversionReportingNotificationCTAWidget'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideKeyMetricsUserInputSettings( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionReportingInlineData( {
				newEvents: [ 'contact' ],
				lostEvents: [],
			} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'contact' ] );

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			includeConversionTailoredMetrics: false,
			isWidgetHidden: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: {
				values: [ 'publish_blog' ],
				scope: 'site',
			},
		} );
	} );

	it( 'does not render when user input is not completed', async () => {
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		const { container, waitForRegistry } = render(
			<ConversionReportingNotificationCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'conversionReporting' ],
			}
		);
		await waitForRegistry();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when detected event does not match the currently saved site purpose', async () => {
		// Current site purpose is `publish_blog` which includes KMW from `contact`, `generate_lead` and `submit_lead_form` events.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'add_to_cart' ] );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( true );

		const { container, waitForRegistry } = render(
			<ConversionReportingNotificationCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'conversionReporting' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when includeConversionTailoredMetrics is already set', async () => {
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			includeConversionTailoredMetrics: true,
			isWidgetHidden: false,
		} );

		const { container, waitForRegistry } = render(
			<ConversionReportingNotificationCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'conversionReporting' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does render when includeConversionTailoredMetrics is not set and there are new events connected to the ACR KMW matching the currently saved site purpose', async () => {
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( true );

		const { waitForRegistry } = render(
			<ConversionReportingNotificationCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'conversionReporting' ],
			}
		);
		await waitForRegistry();

		expect(
			document.querySelector( '.googlesitekit-acr-subtle-notification' )
		).toBeInTheDocument();
	} );
} );
