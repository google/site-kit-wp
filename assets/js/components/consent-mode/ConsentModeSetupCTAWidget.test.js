/**
 * ConsentModeSetupCTAWidget component tests.
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
import {
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	provideUserAuthentication,
} from '../../../../tests/js/test-utils';
import ConsentModeSetupCTAWidget from './ConsentModeSetupCTAWidget';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

describe( 'ConsentModeSetupCTAWidget', () => {
	let registry;
	const ConsentModeSetupCTAWidgetComponent = withNotificationComponentProps(
		CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
	)( ConsentModeSetupCTAWidget );

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );

		registry
			.dispatch( CORE_SITE )
			.receiveGetAdsMeasurementStatus( { connected: true } );

		registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
			enabled: false,
			regions: [ 'AT', 'EU' ],
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	} );

	it( 'should render the widget', async () => {
		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry } = render(
			<ConsentModeSetupCTAWidgetComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not render the widget when it is being dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.setIsPromptDimissing( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG, true );

		const { container, waitForRegistry } = render(
			<ConsentModeSetupCTAWidgetComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
