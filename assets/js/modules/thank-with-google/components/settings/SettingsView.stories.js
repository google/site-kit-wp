/**
 * Thank with Google SettingsView component stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import SettingsView from './SettingsView';
import { Cell, Grid, Row } from '../../../../material-components';
import {
	MODULES_THANK_WITH_GOOGLE,
	CTA_PLACEMENT_STATIC_AUTO,
} from '../../datastore/constants';
import {
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

const features = [ 'twgModule' ];

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--thank-with-google">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SettingsView />
							</Cell>
						</Row>
					</Grid>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.parameters = { features };
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_THANK_WITH_GOOGLE ).receiveGetSettings( {
			publicationID: 'example.com',
			ctaPlacement: CTA_PLACEMENT_STATIC_AUTO,
			colorTheme: 'purple',
			ctaPostTypes: [ 'post', 'page' ],
		} );

		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetSupporterWallSidebars( [ 'Sidebar 2' ] );
	},
};

export const SettingsError = Template.bind( null );
SettingsError.storyName = 'SettingsError';
SettingsError.parameters = { features };
SettingsError.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_THANK_WITH_GOOGLE ).receiveGetSettings( {
			publicationID: 'example.com',
			ctaPlacement: CTA_PLACEMENT_STATIC_AUTO,
			colorTheme: 'purple',
			ctaPostTypes: [ 'post', 'page' ],
		} );

		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetSupporterWallSidebars( [] );

		registry.dispatch( MODULES_THANK_WITH_GOOGLE ).receiveError(
			{
				message: 'Thank with Google publication is invalid.',
				data: {
					status: 403,
					reason: 'invalidSetting',
				},
			},
			'getPublicationId',
			[]
		);
	},
};

export default {
	title: 'Modules/Thank with Google/Settings/SettingsView',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'thank-with-google',
						active: true,
						connected: true,
					},
				] );
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
