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
import { InspectorControls, useBlockProps } from '@wordpress-core/block-editor';
import { Notice, PanelBody, TextControl } from '@wordpress-core/components';
import { useSelect } from '@wordpress-core/data';
import { Fragment, useEffect, useState } from '@wordpress-core/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { resolveSelect, select } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { getNoticeAndDisabled } from './button-edit-utils';
import { CORE_EDITOR } from './constants';
import EditorButton from './EditorButton';

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
 * @param {Object} props.attributes                                    Block attributes.
 * @param {Function} props.setAttributes                               Block attribute setter.
 * @param {string} props.className                                     Block class name.
 * @return {Element} Element to render.
 */
export default function ButtonEdit( {
	buttonLabel,
	requiredPaymentOption,
	invalidPaymentOptionWithModuleAccessNotice,
	invalidPaymentOptionWithoutModuleAccessNotice,
	noSnippetWithModuleAccessNotice,
	noSnippetWithoutModuleAccessNotice,
	attributes,
	setAttributes,
	className,
} ) {
	const [ hasModuleAccess, setHasModuleAccess ] = useState( undefined );

	const { buttonClassName } = attributes;
	const blockProps = useBlockProps( { className } );

	function handleClassChange( value ) {
		const sanitizedValue = value.trim();
		setAttributes( {
			buttonClassName: sanitizedValue ? sanitizedValue : undefined,
		} );
	}

	// Determine if the user has access to the module.
	useEffect( () => {
		async function getModuleAccess() {
			let hasModuleOwnershipOrAccess = select(
				CORE_MODULES
			).hasModuleOwnership( MODULE_SLUG_READER_REVENUE_MANAGER );

			if ( hasModuleOwnershipOrAccess === false ) {
				hasModuleOwnershipOrAccess = await resolveSelect(
					CORE_MODULES
				).hasModuleAccess( MODULE_SLUG_READER_REVENUE_MANAGER );
			}

			// Note: `hasModuleOwnershipOrAccess` can be expected to be `undefined` if `ownerID` is not set for a view-only user.
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
			<InspectorControls>
				<PanelBody
					title={ __( 'Button settings', 'google-site-kit' ) }
					initialOpen
				>
					<TextControl
						label={ __( 'HTML class', 'google-site-kit' ) }
						help={ __(
							'Add optional classes to customize the button in the editor and on the frontend.',
							'google-site-kit'
						) }
						value={ buttonClassName || '' }
						onChange={ handleClassChange }
						// Opt-in to new WordPress components styles introduced in Gutenberg 6.7+.
						// Safe for pre-6.7 WordPress: these props are ignored in older versions.
						// __next40pxDefaultSize - use new 40px height (replaces deprecated 36px)
						// __nextHasNoMarginBottom - remove legacy bottom margin
						// Ref: https://github.com/WordPress/gutenberg/pull/61132
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
				{ notice && (
					<div className="block-editor-block-card">
						<Notice status="warning" isDismissible={ false }>
							{ notice }
						</Notice>
					</div>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<div className="googlesitekit-blocks-reader-revenue-manager">
					<EditorButton
						className={ buttonClassName || '' }
						disabled={ disabled }
					>
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
	attributes: PropTypes.shape( {
		buttonClassName: PropTypes.string,
	} ).isRequired,
	setAttributes: PropTypes.func.isRequired,
	className: PropTypes.string,
};
