/**
 * Container Select component.
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
import { _x, __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, ProgressBar, Select } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import {
	MODULES_TAGMANAGER,
	CONTAINER_CREATE,
} from '../../datastore/constants';
import { isValidAccountID } from '../../util';
const { useSelect } = Data;

export default function ContainerSelect( {
	containers,
	className,
	value,
	...props
} ) {
	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getAccounts' )
	);
	const hasResolvedContainers = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getContainers', [
			accountID,
		] )
	);

	if ( ! hasResolvedAccounts || ! hasResolvedContainers ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className={ classnames(
				'googlesitekit-tagmanager__select-container',
				className
			) }
			disabled={ ! isValidAccountID( accountID ) }
			value={ value }
			enhanced
			outlined
			{ ...props }
		>
			{ ( containers || [] )
				.concat( {
					// eslint-disable-next-line sitekit/acronym-case
					publicId: CONTAINER_CREATE,
					name: __( 'Set up a new container', 'google-site-kit' ),
				} )
				.map(
					(
						{ publicId, name, containerId } // eslint-disable-line sitekit/acronym-case
					) => (
						<Option
							key={ publicId } // eslint-disable-line sitekit/acronym-case
							value={ publicId } // eslint-disable-line sitekit/acronym-case
							data-internal-id={ containerId } // eslint-disable-line sitekit/acronym-case
						>
							{ publicId === CONTAINER_CREATE // eslint-disable-line sitekit/acronym-case
								? name
								: sprintf(
										/* translators: 1: container name, 2: container ID */
										_x(
											'%1$s (%2$s)',
											'Tag Manager container name and ID',
											'google-site-kit'
										),
										name,
										publicId // eslint-disable-line sitekit/acronym-case
								  ) }
						</Option>
					)
				) }
		</Select>
	);
}

ContainerSelect.propTypes = {
	containers: PropTypes.arrayOf( PropTypes.object ),
};
