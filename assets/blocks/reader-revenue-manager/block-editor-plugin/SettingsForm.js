/**
 * Reader Revenue Manager Block Editor SettingsForm component.
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
import { __, sprintf } from '@wordpress/i18n';
import { SelectControl } from '@wordpress-core/components';
import { useState } from '@wordpress-core/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '../../../js/modules/reader-revenue-manager/datastore/constants';
import { CORE_EDITOR } from '../common/constants';

const { select, dispatch } = Data;

export default function SettingsForm() {
	const productIDs =
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs() || [];
	const publicationID = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublicationID();
	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;
	const metaValue =
		select( CORE_EDITOR ).getEditedPostAttribute( 'meta' )?.[ metaKey ] ||
		'';
	const [ selectedValue, setSelectedValue ] = useState( metaValue );

	const help =
		selectedValue === ''
			? null
			: __(
					'This will override any other settings you might have applied in Site Kit.',
					'google-site-kit'
			  );

	function onChange( value ) {
		setSelectedValue( value );
		dispatch( CORE_EDITOR ).editPost( {
			meta: {
				[ metaKey ]: value,
			},
		} );
	}

	return (
		<SelectControl
			className="googlesitekit-rrm-panel__select-control"
			label={ __(
				'Decide how site visitors should access this post (if they will see CTAs by Reader Revenue Manager, which you activated via Site Kit):',
				'google-site-kit'
			) }
			onChange={ onChange }
			value={ selectedValue }
			options={ [
				{
					label: __(
						'Keep the default selection',
						'google-site-kit'
					),
					value: '',
				},
				{
					label: __(
						'Exclude from Reader Revenue Manager',
						'google-site-kit'
					),
					value: 'none',
				},
				{
					label: __( 'Use "open access"', 'google-site-kit' ),
					value: 'openaccess',
				},
				...productIDs.map( ( productID ) => {
					const productIDParts = productID.split( ':' );
					const label =
						productIDParts.length > 1
							? productIDParts[ 1 ]
							: productID;
					return {
						label: sprintf(
							/* translators: %s: Product ID */
							__( 'Use "%s"', 'google-site-kit' ),
							label
						),
						value: productID,
					};
				} ),
			] }
			help={ help }
			__nextHasNoMarginBottom
		/>
	);
}
