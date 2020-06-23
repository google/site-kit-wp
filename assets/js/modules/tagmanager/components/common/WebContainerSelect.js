/**
 * Tag Manager Web Container Select component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import ProgressBar from '../../../../components/progress-bar';
import { STORE_NAME, CONTAINER_CREATE } from '../../datastore/constants';
import { isValidAccountID } from '../../util';
const { useSelect, useDispatch } = Data;

export default function WebContainerSelect() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() );
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const containerID = useSelect( ( select ) => select( STORE_NAME ).getContainerID() );
	const containers = useSelect( ( select ) => select( STORE_NAME ).getWebContainers( accountID ) );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const isLoadingContainers = useSelect( ( select ) => select( STORE_NAME ).isDoingGetContainers( accountID ) );

	const { setContainerID, setInternalContainerID } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		const newContainerID = item.dataset.value;
		if ( containerID !== newContainerID ) {
			setContainerID( newContainerID );
			setInternalContainerID( item.dataset.internalId );
		}
	}, [ containerID ] );

	if ( accounts === undefined || isLoadingContainers ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-tagmanager__select-container-web"
			label={ __( 'Container', 'google-site-kit' ) }
			value={ containerID }
			onEnhancedChange={ onChange }
			disabled={ hasExistingTag || ! isValidAccountID( accountID ) }
			enhanced
			outlined
		>
			{ ( containers || [] )
				.concat( {
					publicId: CONTAINER_CREATE,
					name: __( 'Set up a new container', 'google-site-kit' ),
				} )
				.map( ( { publicId, name, containerId }, index ) => ( // Capitalization rule exception: publicId, containerId
					<Option
						key={ index }
						value={ publicId }
						data-internal-id={ containerId } // Capitalization rule exception: containerId
					>
						{ name }
					</Option>
				) ) }
		</Select>
	);
}
