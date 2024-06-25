/**
 * GA4 Property Select component.
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, ProgressBar, Select } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../datastore/constants';
import {
	isValidAccountID,
	isValidPropertySelection,
} from '../../utils/validation';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';

export default function PropertySelect( props ) {
	const {
		isDisabled,
		hasModuleAccess,
		className,
		onChange = () => {},
	} = props;
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);

	const properties = useSelect( ( select ) =>
		hasModuleAccess !== false && ! isDisabled
			? select( MODULES_ANALYTICS_4 ).getPropertySummaries( accountID ) ||
			  []
			: null
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const isLoading = useSelect( ( select ) => {
		if ( isDisabled ) {
			return false;
		}

		return (
			select( MODULES_ANALYTICS_4 ).isLoadingPropertySummaries() ||
			select( MODULES_ANALYTICS_4 ).isLoadingWebDataStreams( {
				hasModuleAccess,
			} )
		);
	} );

	const viewContext = useViewContext();
	const { selectProperty } = useDispatch( MODULES_ANALYTICS_4 );
	const onPropertyChange = useCallback(
		( index, { dataset } ) => {
			const newPropertyID = dataset.value;
			if ( propertyID === newPropertyID ) {
				return;
			}

			selectProperty( newPropertyID );

			trackEvent(
				`${ viewContext }_analytics`,
				newPropertyID === PROPERTY_CREATE
					? 'change_property_new'
					: 'change_property',
				'ga4'
			);

			onChange();
		},
		[ onChange, propertyID, selectProperty, viewContext ]
	);

	if ( ! isValidAccountID( accountID ) ) {
		return null;
	} else if ( isLoading ) {
		return <ProgressBar smallHeight={ 80 } desktopHeight={ 88 } small />;
	}

	const isValidSelection =
		propertyID === undefined || propertyID === ''
			? true
			: isValidPropertySelection( propertyID );

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className={ classnames(
					'googlesitekit-analytics-4__select-property',
					className
				) }
				label={ __( 'Property', 'google-site-kit' ) }
				value={ propertyID }
				enhanced
				outlined
				disabled
			>
				<Option value={ propertyID }>{ propertyID }</Option>
			</Select>
		);
	}

	return (
		<Select
			className={ classnames(
				'googlesitekit-analytics-4__select-property',
				className,
				{
					'mdc-select--invalid': ! isValidSelection,
					'googlesitekit-analytics-4__select-property--loaded':
						! isDisabled && ! isLoading,
				}
			) }
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onPropertyChange }
			disabled={ isDisabled }
			enhanced
			outlined
		>
			{ ( properties || [] )
				.concat( {
					_id: PROPERTY_CREATE,
					displayName: __(
						'Set up a new property',
						'google-site-kit'
					),
				} )
				.map( ( { _id, displayName } ) => (
					<Option key={ _id } value={ _id }>
						{ _id === PROPERTY_CREATE
							? displayName
							: sprintf(
									/* translators: 1: Property name. 2: Property ID. */
									_x(
										'%1$s (%2$s)',
										'Analytics property name and ID',
										'google-site-kit'
									),
									displayName,
									_id
							  ) }
					</Option>
				) ) }
		</Select>
	);
}

PropertySelect.propTypes = {
	isDisabled: PropTypes.bool,
	hasModuleAccess: PropTypes.bool,
	className: PropTypes.string,
	onChange: PropTypes.func,
};
