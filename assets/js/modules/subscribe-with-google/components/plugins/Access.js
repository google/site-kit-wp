/**
 * Subscribe with Google Account Create component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const { SelectControl, PanelRow } = global.wp.components; // TODO: Fix ES6 imports
const { useSelect, useDispatch } = global.wp.data; // TODO: Fix ES6 imports
const { PluginDocumentSettingPanel } = global.wp.editPost; // TODO: Fix ES6 imports
const { useCallback } = global.wp.element; // TODO: Fix ES6 imports

export default function Access() {
	const postType = useSelect( ( select ) =>
		select( 'core/editor' ).getCurrentPostType()
	);
	const postMeta = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'meta' )
	);

	const { editPost } = useDispatch( 'core/editor' );

	const onChange = useCallback(
		( value ) =>
			editPost( { meta: { sitekit__reader_revenue__access: value } } ),
		[ editPost ]
	);

	if ( postType !== 'post' ) {
		return null;
	}

	const previewText = __(
		'Preview this in the top admin bar',
		'google-site-kit'
	);

	return (
		<PluginDocumentSettingPanel
			title={ __( 'Reader revenue', 'google-site-kit' ) }
			initialOpen={ true }
			icon="money-alt"
		>
			<PanelRow>
				<SelectControl
					label={ __( 'Access', 'google-site-kit' ) }
					value={ postMeta.sitekit__reader_revenue__access }
					labelPosition="side"
					options={ [
						{ label: '— Free —', value: 'openaccess' },
						{ label: 'Basic', value: 'basic' },
						{ label: 'Premium', value: 'premium' },
					] }
					onChange={ onChange }
				></SelectControl>
			</PanelRow>
			{ previewText }
		</PluginDocumentSettingPanel>
	);
}
