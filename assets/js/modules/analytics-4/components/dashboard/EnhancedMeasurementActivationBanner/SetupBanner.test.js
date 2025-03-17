/**
 * EnhancedMeasurementActivationBanner > SetupBanner component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	render,
	provideUserAuthentication,
	provideSiteInfo,
	waitFor,
} from '../../../../../../../tests/js/test-utils';
import { mockSurveyEndpoints } from '../../../../../../../tests/js/mock-survey-endpoints';
import { EDIT_SCOPE } from '../../../datastore/constants';
import SetupBanner from './SetupBanner';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../tests/js/viewport-width-utils';
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';

describe( 'SetupBanner', () => {
	const SetupBannerComponent = withNotificationComponentProps(
		'enhanced-measurement-notification'
	)( SetupBanner );

	let registry;
	let originalViewportWidth;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );

		originalViewportWidth = getViewportWidth();
		setViewportWidth( 450 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewportWidth );
	} );

	it( 'should render correctly when the user does have the edit scope granted', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const { container, getByText } = render( <SetupBannerComponent />, {
			registry,
		} );

		await waitFor( () => expect( container ).toMatchSnapshot() );

		await waitFor( () =>
			expect(
				getByText(
					'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required.'
				)
			).toBeInTheDocument()
		);
	} );

	it( 'should render correctly when the user does not have the edit scope granted', async () => {
		mockSurveyEndpoints();

		provideSiteInfo( registry, {
			usingProxy: true,
		} );

		const { container, getByText, waitForRegistry } = render(
			<SetupBannerComponent />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required — you’ll be redirected to give permission for Site Kit to enable it on your behalf.'
			)
		).toBeInTheDocument();
	} );
} );
