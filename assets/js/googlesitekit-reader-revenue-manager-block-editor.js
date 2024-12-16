/**
 * Reader Revenue Manager module's block editor entrypoint.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress-core/element';
import { PanelBody, ToggleControl } from '@wordpress-core/components';
import {
	PluginDocumentSettingPanel,
	PluginSidebar,
	PluginSidebarMoreMenuItem,
} from '@wordpress-core/edit-post';
import { registerPlugin } from '@wordpress-core/plugins';

function SettingsForm() {
	return <ToggleControl label="Enable Custom Setting" checked />;
}

function SiteKitSettingPanel() {
	const isDocumentSettingPanelAvailable =
		typeof wp.editPost?.PluginDocumentSettingPanel === 'function';

	return (
		<Fragment>
			<PluginSidebarMoreMenuItem target="google-site-kit">
				{ __( 'Google Site Kit', 'google-site-kit' ) }
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				name="google-site-kit"
				title={ __( 'Google Site Kit', 'google-site-kit' ) }
			>
				<PanelBody title={ __( 'Google Site Kit', 'google-site-kit' ) }>
					<SettingsForm />
				</PanelBody>
			</PluginSidebar>
			{ isDocumentSettingPanelAvailable && (
				<PluginDocumentSettingPanel
					name="google-site-kit"
					title={ __( 'Google Site Kit', 'google-site-kit' ) }
				>
					<SettingsForm />
				</PluginDocumentSettingPanel>
			) }
		</Fragment>
	);
}

registerPlugin( 'google-site-kit', {
	render: SiteKitSettingPanel,
	icon: 'admin-settings',
} );
