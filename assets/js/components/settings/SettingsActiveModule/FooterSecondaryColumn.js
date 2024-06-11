/**
 * Footer Secondary Column component.
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
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import TrashIcon from '../../../../svg/icons/trash.svg';
import Link from '../../Link';
const { useDispatch, useSelect } = Data;

export default function FooterSecondaryColumn( { slug, module, isEditing } ) {
	const dialogActiveKey = `module-${ slug }-dialogActive`;

	const { setValue } = useDispatch( CORE_UI );

	const { name, forceActive } = module;

	const dialogActive = useSelect( ( select ) =>
		select( CORE_UI ).getValue( dialogActiveKey )
	);

	const moduleHomepage = useSelect( ( select ) => {
		if ( ! module || isEmpty( module.homepage ) ) {
			return undefined;
		}
		return select( CORE_USER ).getAccountChooserURL( module.homepage );
	} );

	const handleDialog = useCallback( () => {
		setValue( dialogActiveKey, ! dialogActive );
	}, [ dialogActive, dialogActiveKey, setValue ] );

	let markup = null;

	if ( isEditing && ! forceActive ) {
		markup = (
			<Link
				className="googlesitekit-settings-module__remove-button"
				onClick={ handleDialog }
				danger
				trailingIcon={
					<TrashIcon
						className="googlesitekit-settings-module__remove-button-icon"
						width={ 13 }
						height={ 13 }
					/>
				}
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'Disconnect %s from Site Kit', 'google-site-kit' ),
					name
				) }
			</Link>
		);
	} else if ( ! isEditing && moduleHomepage ) {
		markup = (
			<Link
				href={ moduleHomepage }
				className="googlesitekit-settings-module__cta-button"
				external
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'See full details in %s', 'google-site-kit' ),
					name
				) }
			</Link>
		);
	}

	return markup;
}
