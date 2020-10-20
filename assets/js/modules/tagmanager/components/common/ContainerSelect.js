/**
 * Container Select component.
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import { STORE_NAME, CONTAINER_CREATE } from '../../datastore/constants';
import ProgressBar from '../../../../components/progress-bar';
import { isValidAccountID } from '../../util';
const { useSelect } = Data;

export default function ContainerSelect( {
	containers,
	className,
	value,
	...props
} ) {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const hasResolvedAccounts = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ) );
	const hasResolvedContainers = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getContainers', [ accountID ] ) );

	if ( ! hasResolvedAccounts || ! hasResolvedContainers ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className={ classnames( 'googlesitekit-tagmanager__select-container', className ) }
			disabled={ hasExistingTag || ! isValidAccountID( accountID ) }
			value={ value }
			enhanced
			outlined
			{ ...props }
		>
			{ ( containers || [] )
				.concat( {
					// eslint-disable-next-line sitekit/camelcase-acronyms
					publicId: CONTAINER_CREATE,
					name: __( 'Set up a new container', 'google-site-kit' ),
				} )
				.map( ( { publicId, name, containerId } ) => ( // eslint-disable-line sitekit/camelcase-acronyms
					<Option
						key={ publicId } // eslint-disable-line sitekit/camelcase-acronyms
						value={ publicId } // eslint-disable-line sitekit/camelcase-acronyms
						data-internal-id={ containerId } // eslint-disable-line sitekit/camelcase-acronyms
					>
						{ name }
					</Option>
				) ) }
		</Select>
	);
}

ContainerSelect.propTypes = {
	containers: PropTypes.arrayOf( PropTypes.object ),
};
