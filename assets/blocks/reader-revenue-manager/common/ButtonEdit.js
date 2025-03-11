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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls } from '@wordpress-core/block-editor';
import { Notice } from '@wordpress-core/components';
import { Fragment, useEffect, useState } from '@wordpress-core/element';
import { useSelect } from '@wordpress-core/data';

/**
 * Internal dependencies
 */
import { select, resolveSelect } from 'googlesitekit-data';
import EditorButton from './EditorButton';
import { CORE_EDITOR } from './constants';
import { CORE_MODULES } from '../../../js/googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../../js/modules/reader-revenue-manager/datastore/constants';
import { getNoticeAndDisabled } from './button-edit-utils';

/**
 * Reader Revenue Manager Button Edit component.
 *
 * @since 1.148.0
 *
 * @param {Object} props                                               Component props.
 * @param {string} props.buttonLabel                                   Button label.
 * @param {string} props.requiredPaymentOption                         Required payment option.
 * @param {string} props.invalidPaymentOptionWithModuleAccessNotice    Invalid payment option with module access notice.
 * @param {string} props.invalidPaymentOptionWithoutModuleAccessNotice Invalid payment option without module access notice.
 * @param {string} props.noSnippetWithModuleAccessNotice               No snippet with module access notice.
 * @param {string} props.noSnippetWithoutModuleAccessNotice            No snippet without module access notice.
 * @return {Element} Element to render.
 */
export default function ButtonEdit( {
	buttonLabel,
	requiredPaymentOption,
	invalidPaymentOptionWithModuleAccessNotice,
	invalidPaymentOptionWithoutModuleAccessNotice,
	noSnippetWithModuleAccessNotice,
	noSnippetWithoutModuleAccessNotice,
} ) {
	const [ hasModuleAccess, setHasModuleAccess ] = useState( undefined );

	const blockProps = useBlockProps();

	// Determine if the user has access to the module.
	useEffect( () => {
		async function getModuleAccess() {
			let hasModuleOwnershipOrAccess = select(
				CORE_MODULES
			).hasModuleOwnership( 'reader-revenue-manager' );

			if ( hasModuleOwnershipOrAccess === false ) {
				hasModuleOwnershipOrAccess = await resolveSelect(
					CORE_MODULES
				).hasModuleAccess( 'reader-revenue-manager' );
			}

			// Note: `hasModuleOwnershipOrAccess` can be expected to be undefined if
			// - `ownerID` is not set for view-only or non-SK users.
			// - the `check-access` endpoint returns a 403 error for non-SK users.
			setHasModuleAccess( !! hasModuleOwnershipOrAccess );
		}

		getModuleAccess();
	}, [] );

	const settings = select( MODULES_READER_REVENUE_MANAGER ).getSettings();

	const { publicationID, paymentOption, snippetMode, postTypes } = settings;

	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;

	const postProductID = useSelect(
		( coreSelect ) =>
			coreSelect( CORE_EDITOR ).getEditedPostAttribute( 'meta' )?.[
				metaKey
			] || ''
	);

	const postType = useSelect( ( coreSelect ) =>
		coreSelect( CORE_EDITOR ).getCurrentPostType()
	);

	const { notice, disabled } = getNoticeAndDisabled( {
		paymentOption,
		requiredPaymentOption,
		hasModuleAccess,
		postProductID,
		snippetMode,
		postTypes,
		postType,
		invalidPaymentOptionWithModuleAccessNotice,
		invalidPaymentOptionWithoutModuleAccessNotice,
		noSnippetWithModuleAccessNotice,
		noSnippetWithoutModuleAccessNotice,
	} );

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

ButtonEdit.propTypes = {
	buttonLabel: PropTypes.string.isRequired,
	requiredPaymentOption: PropTypes.string.isRequired,
	invalidPaymentOptionWithModuleAccessNotice: PropTypes.node.isRequired,
	invalidPaymentOptionWithoutModuleAccessNotice: PropTypes.node.isRequired,
	noSnippetWithModuleAccessNotice: PropTypes.node.isRequired,
	noSnippetWithoutModuleAccessNotice: PropTypes.node.isRequired,
};
