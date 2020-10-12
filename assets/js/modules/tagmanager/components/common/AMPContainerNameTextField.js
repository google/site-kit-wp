/**
 * AMPContainerNameTextField component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, FORM_SETUP } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms';
import ContainerNameTextField from './ContainerNameTextField';
const { useSelect, useDispatch } = Data;

export default function AMPContainerNameTextField() {
	const containers = useSelect( ( select ) => {
		const accountID = select( STORE_NAME ).getAccountID();
		return select( STORE_NAME ).getAMPContainers( accountID );
	} );

	const siteName = useSelect( ( select ) => select( CORE_SITE ).getSiteName() );
	const ampContainerName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'ampContainerName' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	useEffect( () => {
		if ( ! ampContainerName ) {
			setValues( FORM_SETUP, { ampContainerName: `${ siteName || global.location.hostname } AMP` } );
		}
	}, [] );

	return (
		<ContainerNameTextField
			formFieldID="ampContainerName"
			label={ __( 'AMP Container Name', 'google-site-kit' ) }
			containers={ containers }
		/>
	);
}
