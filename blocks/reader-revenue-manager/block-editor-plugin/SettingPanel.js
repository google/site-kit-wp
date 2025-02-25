/**
 * Reader Revenue Manager Block Editor SettingPanel component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { PluginDocumentSettingPanel as EditPostSettingPanel } from '@wordpress-core/edit-post';
import { PluginDocumentSettingPanel as EditorSettingPanel } from '@wordpress-core/editor';

/**
 * Internal dependencies
 */
import GoogleLogoIcon from '../../../assets/svg/graphics/logo-g.svg';
import SettingsForm from './SettingsForm';

export default function SettingPanel() {
	const PluginDocumentSettingPanel =
		EditorSettingPanel || EditPostSettingPanel;

	return (
		<PluginDocumentSettingPanel
			className="googlesitekit-rrm-settings-panel"
			name="googlesitekit-rrm-panel"
			title={ __( 'Google Site Kit', 'google-site-kit' ) }
			icon={ <GoogleLogoIcon height="16" width="16" /> }
		>
			<section>
				<h3>{ __( 'Reader Revenue Manager', 'google-site-kit' ) }</h3>
				<SettingsForm />
			</section>
		</PluginDocumentSettingPanel>
	);
}
