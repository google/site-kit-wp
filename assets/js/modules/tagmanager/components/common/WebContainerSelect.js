/**
 * Tag Manager Web Container Select component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import {
	CONTAINER_CREATE,
	MODULES_TAGMANAGER,
} from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import ContainerSelect from './ContainerSelect';
import { trackEvent } from '../../../../util/tracking';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function WebContainerSelect( { hasModuleAccess } ) {
	const viewContext = useViewContext();

	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);
	const containerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getContainerID()
	);
	const containers = useSelect( ( select ) => {
		if ( hasModuleAccess === false ) {
			return null;
		}

		return select( MODULES_TAGMANAGER ).getWebContainers( accountID );
	} );
	const isPrimaryAMP = useSelect( ( select ) =>
		select( CORE_SITE ).isPrimaryAMP()
	);
	const isSecondaryAMP = useSelect( ( select ) =>
		select( CORE_SITE ).isSecondaryAMP()
	);

	const { setContainerID, setInternalContainerID } =
		useDispatch( MODULES_TAGMANAGER );
	const onSelect = useCallback(
		( index, item ) => {
			const {
				value: newContainerID,
				// eslint-disable-next-line sitekit/acronym-case
				internalId: newInternalContainerID,
			} = item.dataset;
			if ( containerID !== newContainerID ) {
				const eventAction =
					newContainerID === CONTAINER_CREATE
						? 'change_container_new'
						: 'change_container';
				trackEvent( `${ viewContext }_tagmanager`, eventAction );

				setContainerID( newContainerID );
				setInternalContainerID( newInternalContainerID || '' );
			}
		},
		[ containerID, setContainerID, setInternalContainerID, viewContext ]
	);

	if ( isPrimaryAMP ) {
		return null;
	}

	const label = isSecondaryAMP
		? __( 'Web Container', 'google-site-kit' )
		: __( 'Container', 'google-site-kit' );

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className="googlesitekit-tagmanager__select-container--web"
				label={ label }
				value={ containerID }
				enhanced
				outlined
				disabled
			>
				<Option value={ containerID }>{ containerID }</Option>
			</Select>
		);
	}

	return (
		<ContainerSelect
			className="googlesitekit-tagmanager__select-container--web"
			label={ label }
			value={ containerID }
			containers={ containers }
			onEnhancedChange={ onSelect }
		/>
	);
}

WebContainerSelect.propTypes = {
	hasModuleAccess: PropTypes.bool,
};
