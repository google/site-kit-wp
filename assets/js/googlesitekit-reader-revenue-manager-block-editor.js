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

import { PluginDocumentSettingPanel } from '@wordpress-core/edit-post';
import { ToggleControl } from '@wordpress-core/components';
// import { useSelect, useDispatch } from '@wordpress/data';
import { registerPlugin } from '@wordpress-core/plugins';

// const { registerPlugin } = wp.plugins;
// const { PluginDocumentSettingPanel } = wp.editPost;
// const { ToggleControl } = wp.components;

function MyPostSettingPanel() {
	// const meta = useSelect( ( select ) =>
	// 	select( 'core/editor' ).getEditedPostAttribute( 'meta' )
	// );
	// const { editPost } = useDispatch( 'core/editor' );
	// const { my_custom_setting: myCustomSetting } = meta || {};

	return (
		<PluginDocumentSettingPanel
			name="my-custom-setting-panel"
			title="My Custom Setting"
			className="my-custom-setting-panel"
		>
			<ToggleControl
				label="Enable Custom Setting"
				checked
				// onChange={ ( value ) =>
				// 	editPost( { meta: { my_custom_setting: value } } )
				// }
			/>
		</PluginDocumentSettingPanel>
	);

	// return (
	// 	<PluginDocumentSettingPanel
	// 		name="my-custom-setting-panel"
	// 		title="My Custom Setting"
	// 		className="my-custom-setting-panel"
	// 	>
	// 		<ToggleControl
	// 			label="Enable Custom Setting"
	// 			checked={ !! myCustomSetting }
	// 			onChange={ ( value ) =>
	// 				editPost( { meta: { my_custom_setting: value } } )
	// 			}
	// 		/>
	// 	</PluginDocumentSettingPanel>
	// );
}

registerPlugin( 'my-custom-setting', {
	render: MyPostSettingPanel,
	icon: 'admin-settings', // Optional icon
} );
