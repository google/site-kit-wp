/**
 * Audience Selection Panel Add Group Notice
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	AUDIENCE_ADD_GROUP_NOTICE_SLUG,
	AUDIENCE_SELECTION_CHANGED,
	AUDIENCE_SELECTION_FORM,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import InfoIcon from '../../../../../../../svg/icons/info-circle.svg';
import InfoNotice from '../InfoNotice';

const { useDispatch, useSelect } = Data;

export default function AddGroupNotice( { savedItemSlugs = [] } ) {
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( AUDIENCE_ADD_GROUP_NOTICE_SLUG )
	);
	const selectionChanged = useSelect(
		( select ) =>
			select( CORE_FORMS ).getValue(
				AUDIENCE_SELECTION_FORM,
				AUDIENCE_SELECTION_CHANGED
			) || false
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const onDismiss = useCallback( async () => {
		await dismissItem( AUDIENCE_ADD_GROUP_NOTICE_SLUG );
	}, [ dismissItem ] );

	if ( isDismissed || savedItemSlugs.length !== 1 || selectionChanged ) {
		return null;
	}

	return (
		<InfoNotice
			className="googlesitekit-audience-selection-panel__add-group-notice"
			content={ __(
				'By adding another group to your dashboard, you will be able to compare them and understand which content brings back users from each group',
				'google-site-kit'
			) }
			dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			Icon={ InfoIcon }
			onDismiss={ onDismiss }
		/>
	);
}

AddGroupNotice.propTypes = {
	savedItemSlugs: PropTypes.array,
};
