/**
 * Product ID Select component.
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '../../../../components/Link';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { Option, Select } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

export default function ProductIDSelect( props ) {
	const {
		isDisabled,
		hasModuleAccess,
		showHelperText = true,
		className,
		onChange = () => {},
	} = props;

	const productID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductID()
	);
	const productIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs()
	);
	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'rrm-content-settings'
		);
	} );

	const { setProductID } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const onProductIDChange = useCallback(
		( index, item ) => {
			const newProductID = item.dataset.value;

			setProductID( newProductID );

			onChange();
		},
		[ setProductID, onChange ]
	);

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className={ classnames( className ) }
				label={ __( 'Default Product ID', 'google-site-kit' ) }
				value={ productID }
				enhanced
				outlined
				disabled
			>
				<Option value={ productID }>{ productID }</Option>
			</Select>
		);
	}

	return (
		<Select
			className={ classnames( className ) }
			label={ __( 'Default Product ID', 'google-site-kit' ) }
			value={ productID }
			onEnhancedChange={ onProductIDChange }
			disabled={ isDisabled }
			enhanced
			outlined
			helperText={
				showHelperText
					? createInterpolateElement(
							__(
								'Product IDs offer a way to link content to payment plans. <a>Learn more</a>',
								'google-site-kit'
							),
							{
								a: (
									<Link
										aria-label={ __(
											'Learn more about Product IDs',
											'google-site-kit'
										) }
										href={ learnMoreURL }
										external
										hideExternalIndicator
									/>
								),
							}
					  )
					: undefined
			}
		>
			<Option key="openaccess" value="openaccess">
				{ __( 'Open access', 'google-site-kit' ) }
			</Option>
			{ ( productIDs || [] ).map( ( product ) => (
				<Option key={ product } value={ product }>
					{ product }
				</Option>
			) ) }
		</Select>
	);
}

ProductIDSelect.propTypes = {
	isDisabled: PropTypes.bool,
	hasModuleAccess: PropTypes.bool,
	showHelperText: PropTypes.bool,
	className: PropTypes.string,
	onChange: PropTypes.func,
};
