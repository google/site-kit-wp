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
import { Component } from '@wordpress/element';

// Import some core WP libraries instead of polyfills,
// to support Gutenberg components.
const { SelectControl, PanelRow } = global.wp.components;
const { select, dispatch } = global.wp.data;
const { PluginDocumentSettingPanel } = global.wp.editPost;

export default class Access extends Component {
	constructor( props ) {
		super( props );

		const postMeta = select( 'core/editor' ).getEditedPostAttribute(
			'meta'
		);
		this.state = {
			access: postMeta.sitekit__reader_revenue__access,
		};
	}

	setAccess( access ) {
		// Update post meta field.
		const { editPost } = dispatch( 'core/editor' );
		editPost( {
			meta: { sitekit__reader_revenue__access: access },
		} );

		// Update component.
		this.setState( { access } );
	}

	render() {
		// Only show for normal posts.
		const postType = select( 'core/editor' ).getCurrentPostType();
		if ( postType !== 'post' ) {
			return null;
		}

		return (
			<PluginDocumentSettingPanel
				icon="money-alt"
				initialOpen={ true }
				title={ __( 'Reader revenue', 'google-site-kit' ) }
			>
				<PanelRow>
					<SelectControl
						label={ __( 'Access', 'google-site-kit' ) }
						labelPosition="side"
						onChange={ this.setAccess.bind( this ) }
						options={ [
							{ label: '— Free —', value: 'openaccess' },
							{ label: 'Basic', value: 'basic' },
							{ label: 'Premium', value: 'premium' },
						] }
						value={ this.state.access }
					></SelectControl>
				</PanelRow>
				{ __( 'Preview this in the top admin bar', 'google-site-kit' ) }
			</PluginDocumentSettingPanel>
		);
	}
}
