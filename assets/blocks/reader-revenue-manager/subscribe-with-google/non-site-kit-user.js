/**
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
import { registerBlockType } from '@wordpress-core/blocks';
import { useBlockProps, InspectorControls } from '@wordpress-core/block-editor';
import { Notice } from '@wordpress-core/components';
import { Fragment } from '@wordpress-core/element';
import { select } from '@wordpress-core/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_EDIT_SITE } from '../common/constants';
import { EditorButton } from '../common';
import metadata from './block.json';

function Edit() {
	const blockProps = useBlockProps();

	return (
		<Fragment>
			<InspectorControls>
				<div className="block-editor-block-card">
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'This block can only be configured by Site Kit users. Please contact your administrator.',
							'google-site-kit'
						) }
					</Notice>
				</div>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="googlesitekit-blocks-reader-revenue-manager">
					<EditorButton disabled>
						{
							/* translators: Button label for Subscribe with Google. See: https://github.com/subscriptions-project/swg-js/blob/05af2d45cfcaf831a6b4d35c28f2c7b5c2e39308/src/i18n/swg-strings.ts#L24-L57 (please refer to the latest version of the file) */
							__( 'Subscribe with Google', 'google-site-kit' )
						}
					</EditorButton>
				</div>
			</div>
		</Fragment>
	);
}

function registerBlock() {
	const isSiteEditor = !! select( CORE_EDIT_SITE );

	registerBlockType( metadata.name, {
		edit() {
			// Don't render the block in the site editor. Site editor support will be added in a future issue.
			if ( isSiteEditor ) {
				return null;
			}

			return <Edit />;
		},
		supports: {
			// Don't allow the block to be inserted in the site editor.
			inserter: ! isSiteEditor,
		},
	} );
}

registerBlock();
