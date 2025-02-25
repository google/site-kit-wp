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
import { useBlockProps, InspectorControls } from '@wordpress-core/block-editor';
import { Notice } from '@wordpress-core/components';
import { Fragment } from '@wordpress-core/element';

/**
 * Internal dependencies
 */
import { EditorButton } from '.';
import { CORE_EDITOR } from './constants';
import { CORE_MODULES } from '../../../assets/js/googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../../assets/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Contribute with Google Block Edit component.
 *
 * @since n.e.x.t
 *
 * @param {Object} props                                               Component props.
 * @param {Object} props.select                                        Data store select function.
 * @param {string} props.buttonLabel                                   Button label.
 * @param {string} props.requiredPaymentOption                         Required payment option.
 * @param {string} props.invalidPaymentOptionWithModuleAccessNotice    Invalid payment option with module access notice.
 * @param {string} props.invalidPaymentOptionWithoutModuleAccessNotice Invalid payment option without module access notice.
 * @param {string} props.noSnippetWithModuleAccessNotice               No snippet with module access notice.
 * @param {string} props.noSnippetWithoutModuleAccessNotice            No snippet without module access notice.
 * @return {Element} Element to render.
 */
export default function EditButton( {
	select,
	buttonLabel,
	requiredPaymentOption,
	invalidPaymentOptionWithModuleAccessNotice,
	invalidPaymentOptionWithoutModuleAccessNotice,
	noSnippetWithModuleAccessNotice,
	noSnippetWithoutModuleAccessNotice,
} ) {
	const blockProps = useBlockProps();

	const hasModuleAccess = select( CORE_MODULES ).hasModuleOwnershipOrAccess(
		'reader-revenue-manager'
	);

	const settings = select( MODULES_READER_REVENUE_MANAGER ).getSettings();

	const { publicationID, paymentOption, snippetMode, postTypes } = settings;

	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;

	const postProductID =
		select( CORE_EDITOR ).getEditedPostAttribute( 'meta' )?.[ metaKey ] ||
		'';
	const postType = select( CORE_EDITOR ).getCurrentPostType();

	let notice = '';
	let disabled = false;

	if ( paymentOption !== requiredPaymentOption ) {
		disabled = true;

		if ( hasModuleAccess ) {
			notice = invalidPaymentOptionWithModuleAccessNotice;
		} else {
			notice = invalidPaymentOptionWithoutModuleAccessNotice;
		}
	} else if (
		postProductID === 'none' ||
		( ! postProductID && snippetMode === 'per_post' ) ||
		( ! postProductID &&
			snippetMode === 'post_types' &&
			! postTypes.includes( postType ) )
	) {
		disabled = true;

		if ( hasModuleAccess ) {
			notice = noSnippetWithModuleAccessNotice;
		} else {
			notice = noSnippetWithoutModuleAccessNotice;
		}
	}

	return (
		<Fragment>
			{ notice && (
				<InspectorControls>
					<div className="block-editor-block-card">
						<Notice status="warning" isDismissible={ false }>
							{ notice }
						</Notice>
					</div>
				</InspectorControls>
			) }
			<div { ...blockProps }>
				<div className="googlesitekit-blocks-reader-revenue-manager">
					<EditorButton disabled={ disabled }>
						{ buttonLabel }
					</EditorButton>
				</div>
			</div>
		</Fragment>
	);
}
