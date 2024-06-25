/**
 * PropertySelect component.
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
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, ProgressBar, Select } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import { trackEvent } from '../../../../util/tracking';
import useViewContext from '../../../../hooks/useViewContext';

export default function PropertySelect( { hasModuleAccess } ) {
	const viewContext = useViewContext();

	const propertyID = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getPropertyID()
	);
	const matchedProperties = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getMatchedProperties()
	);
	const hasResolvedProperties = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
			'getMatchedProperties'
		)
	);

	const { setPropertyID } = useDispatch( MODULES_SEARCH_CONSOLE );
	const onChange = useCallback(
		( index, item ) => {
			const newPropertyID = item.dataset.value;
			if ( propertyID !== newPropertyID ) {
				setPropertyID( newPropertyID );

				trackEvent(
					`${ viewContext }_search-console`,
					'change_property'
				);
			}
		},
		[ propertyID, setPropertyID, viewContext ]
	);

	if ( ! hasResolvedProperties ) {
		return <ProgressBar small />;
	}

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className="googlesitekit-search-console__select-property"
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
			className="googlesitekit-search-console__select-property"
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			{ ( matchedProperties || [] ).map( ( { siteURL } ) => (
				<Option key={ siteURL } value={ siteURL }>
					{ siteURL.startsWith( 'sc-domain:' )
						? sprintf(
								/* translators: %s: domain name */
								__( '%s (domain property)', 'google-site-kit' ),
								siteURL.replace( /^sc-domain:/, '' )
						  )
						: siteURL }
				</Option>
			) ) }
		</Select>
	);
}
