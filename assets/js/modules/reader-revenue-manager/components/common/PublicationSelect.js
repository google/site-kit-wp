/**
 * Publication Select component.
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

/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Option, ProgressBar, Select } from 'googlesitekit-components';
import { isValidPublicationID } from '@/js/modules/reader-revenue-manager/utils/validation';
import { useSelect, useDispatch } from 'googlesitekit-data';

export default function PublicationSelect( props ) {
	const {
		isDisabled,
		hasModuleAccess,
		className,
		onChange = () => {},
	} = props;

	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const publications = useSelect( ( select ) =>
		hasModuleAccess !== false && ! isDisabled
			? select( MODULES_READER_REVENUE_MANAGER ).getPublications() || []
			: null
	);

	const publicationsLoaded = useSelect(
		( select ) =>
			hasModuleAccess === false ||
			isDisabled ||
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getPublications'
			)
	);

	const { selectPublication } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const onPublicationChange = useCallback(
		( index, item ) => {
			const newPublicationID = item.dataset.value;
			const publication = publications.find(
				// eslint-disable-next-line sitekit/acronym-case
				( { publicationId } ) => publicationId === newPublicationID
			);

			selectPublication( publication );

			onChange( publication );
		},
		[ publications, selectPublication, onChange ]
	);

	if ( ! publicationsLoaded ) {
		// Display progress bar while publications are loading.
		return (
			<ProgressBar
				mobileVerticalSpacing={ 76 }
				desktopVerticalSpacing={ 84 }
				small
			/>
		);
	}

	const isValidSelection =
		publicationID === undefined || publicationID === ''
			? true
			: isValidPublicationID( publicationID );

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className={ classnames( className ) }
				label={ __( 'Publication', 'google-site-kit' ) }
				value={ publicationID }
				enhanced
				outlined
				disabled
			>
				<Option value={ publicationID }>{ publicationID }</Option>
			</Select>
		);
	}

	return (
		<Select
			className={ classnames( className, {
				'mdc-select--invalid': ! isValidSelection,
			} ) }
			label={ __( 'Publication', 'google-site-kit' ) }
			value={ publicationID }
			onEnhancedChange={ onPublicationChange }
			disabled={ isDisabled }
			enhanced
			outlined
		>
			{ ( publications || [] ).map(
				// eslint-disable-next-line sitekit/acronym-case
				( { publicationId, displayName } ) => (
					// eslint-disable-next-line sitekit/acronym-case
					<Option key={ publicationId } value={ publicationId }>
						{ sprintf(
							/* translators: 1: Publication display name, 2: Publication ID */
							__( '%1$s (%2$s)', 'google-site-kit' ),
							displayName,
							// eslint-disable-next-line sitekit/acronym-case
							publicationId
						) }
					</Option>
				)
			) }
		</Select>
	);
}

PublicationSelect.propTypes = {
	isDisabled: PropTypes.bool,
	hasModuleAccess: PropTypes.bool,
	className: PropTypes.string,
	onChange: PropTypes.func,
};
