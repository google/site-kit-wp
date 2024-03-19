/**
 * Analytics WebDataStreamNameInput component.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	FORM_SETUP,
	MODULES_ANALYTICS_4,
	WEBDATASTREAM_CREATE,
} from '../../datastore/constants';
import { TextField } from 'googlesitekit-components';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import WarningIcon from '../../../../../svg/icons/warning-v2.svg';
import { isValidWebDataStreamName } from '../../utils/validation';

const { useSelect, useDispatch } = Data;

export default function WebDataStreamNameInput() {
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);
	const webDataStreams = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreams( propertyID )
	);
	const webDataStreamName = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'webDataStreamName' )
	);
	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const onChange = useCallback(
		( { currentTarget } ) => {
			setValues( FORM_SETUP, { webDataStreamName: currentTarget.value } );
		},
		[ setValues ]
	);

	// Set the default web data stream name.
	useMount( () => {
		if ( ! webDataStreamName && isURL( siteURL ) ) {
			const { hostname } = new URL( siteURL );

			setValues( FORM_SETUP, {
				webDataStreamName: hostname,
			} );
		}
	} );

	// Bounce if an existing web data stream is selected.
	if ( webDataStreamID !== WEBDATASTREAM_CREATE ) {
		return null;
	}

	const existingWebDataStream =
		Array.isArray( webDataStreams ) &&
		webDataStreams.some(
			( { displayName } ) => displayName === webDataStreamName
		);

	const error =
		existingWebDataStream ||
		! webDataStreamName ||
		! isValidWebDataStreamName( webDataStreamName );

	return (
		<div className="googlesitekit-analytics-webdatastreamname">
			<TextField
				className={ classnames( {
					'mdc-text-field--error': error,
				} ) }
				label={ __( 'Web Data Stream Name', 'google-site-kit' ) }
				outlined
				helperText={ ( () => {
					if ( existingWebDataStream ) {
						return __(
							'A web data stream with this name already exists.',
							'google-site-kit'
						);
					} else if ( ! webDataStreamName ) {
						return __(
							'A web data stream name is required.',
							'google-site-kit'
						);
					} else if (
						! isValidWebDataStreamName( webDataStreamName )
					) {
						return __(
							'This is not a valid web data stream name.',
							'google-site-kit'
						);
					}

					return false;
				} )() }
				trailingIcon={
					error && (
						<span className="googlesitekit-text-field-icon--warning">
							<VisuallyHidden>
								{ __( 'Warning', 'google-site-kit' ) }
							</VisuallyHidden>
							<WarningIcon width={ 14 } height={ 12 } />
						</span>
					)
				}
				value={ webDataStreamName }
				onChange={ onChange }
			/>
		</div>
	);
}
