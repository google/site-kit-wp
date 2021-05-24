/**
 * Tag Manager AMP Container Select component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ContainerSelect from './ContainerSelect';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect, useDispatch } = Data;

export default function AMPContainerSelect() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const ampContainerID = useSelect( ( select ) => select( STORE_NAME ).getAMPContainerID() );
	const ampContainers = useSelect( ( select ) => select( STORE_NAME ).getAMPContainers( accountID ) );
	const isAMP = useSelect( ( select ) => select( CORE_SITE ).isAMP() );
	const isSecondaryAMP = useSelect( ( select ) => select( CORE_SITE ).isSecondaryAMP() );

	const { setAMPContainerID, setInternalAMPContainerID } = useDispatch( STORE_NAME );
	const onSelect = useCallback( ( index, item ) => {
		const {
			value: newContainerID,
			// eslint-disable-next-line sitekit/acronym-case
			internalId: newInternalContainerID,
		} = item.dataset;
		if ( ampContainerID !== newContainerID ) {
			setAMPContainerID( newContainerID );
			setInternalAMPContainerID( newInternalContainerID || '' );
		}
	}, [ ampContainerID, setAMPContainerID, setInternalAMPContainerID ] );

	if ( ! isAMP ) {
		return null;
	}

	const label = isSecondaryAMP
		? __( 'AMP Container', 'google-site-kit' )
		: __( 'Container', 'google-site-kit' );

	return (
		<ContainerSelect
			className="googlesitekit-tagmanager__select-container--amp"
			label={ label }
			value={ ampContainerID }
			containers={ ampContainers }
			onEnhancedChange={ onSelect }
		/>
	);
}
