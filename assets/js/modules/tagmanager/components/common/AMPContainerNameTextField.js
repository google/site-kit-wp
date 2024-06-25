/**
 * AMPContainerNameTextField component.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	MODULES_TAGMANAGER,
	FORM_SETUP,
	CONTAINER_CREATE,
} from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import ContainerNameTextField from './ContainerNameTextField';

export default function AMPContainerNameTextField() {
	const ampContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAMPContainerID()
	);
	const siteName = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteName()
	);
	const referenceSiteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);
	const initialAMPContainerName = useSelect(
		( select ) =>
			select( CORE_FORMS ).getValue( FORM_SETUP, 'ampContainerName' ),
		[]
	);

	let ampContainerName = siteName;
	if ( ! ampContainerName && isURL( referenceSiteURL ) ) {
		ampContainerName = new URL( referenceSiteURL ).hostname;
	}

	ampContainerName += ' AMP';

	const { setValues } = useDispatch( CORE_FORMS );
	useMount( () => {
		if ( ! initialAMPContainerName ) {
			setValues( FORM_SETUP, { ampContainerName } );
		}
	} );

	if ( ampContainerID !== CONTAINER_CREATE ) {
		return null;
	}

	return (
		<ContainerNameTextField
			name="ampContainerName"
			label={ __( 'AMP Container Name', 'google-site-kit' ) }
		/>
	);
}
