/**
 * AudienceSegmentationSetupCTAWidget Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import AudienceSegmentationSetupCTAWidget from './AudienceSegmentationSetupCTAWidget';
import { __ } from '@wordpress/i18n';

const WidgetWithComponentProps = withWidgetComponentProps(
	'audienceSegmentationSetupCTATile'
)( AudienceSegmentationSetupCTAWidget );

function Template() {
	return (
		<WidgetWithComponentProps
			title={ __(
				'Learn how different types of visitors interact with your site',
				'google-site-kit'
			) }
			description={ __(
				'Understand what brings new visitors to your site and keeps them coming back. Site Kit can now group your site visitors into relevant segments like "new" and "returning. To set up these new groups, Site Kit needs to update your Google Analytics property.',
				'google-site-kit'
			) }
		/>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Default',
	delay: 250,
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceSegmentationSetupCTATile',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = false;
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
				provideUserAuthentication( registry );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsDataAvailableOnLoad( true );
			};

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div style={ { flex: 1 } }>
						<WithRegistrySetup func={ setupRegistry }>
							<Story />
						</WithRegistrySetup>
					</div>
				</div>
			);
		},
	],
};
