/**
 * Audience Segmentation ChangeGroupsLink component.
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
 * WordPress dependencies
 */
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import Link from '../../../../../components/Link';
import PencilIcon from '../../../../../../svg/icons/pencil-alt.svg';

const { useSelect, useDispatch } = Data;

export default function ChangeGroupsLink() {
	// TODO: Change this to use `getConfiguredAudiences`.
	const availableAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAvailableAudiences()
	);

	const { setValue } = useDispatch( CORE_UI );

	// TODO: Use appropriate UI key.
	const openAudiencesSelectionPanel = useCallback( () => {
		setValue( '', true );
	}, [ setValue ] );

	const renderChangeGroupsLink =
		Array.isArray( availableAudiences ) && availableAudiences?.length > 0;

	if ( ! renderChangeGroupsLink ) {
		return null;
	}

	return (
		<Fragment>
			<Link
				secondary
				linkButton
				className="googlesitekit-audience-widget-change-groups-cta"
				onClick={ openAudiencesSelectionPanel }
				leadingIcon={ <PencilIcon width={ 22 } height={ 22 } /> }
			>
				{ __( 'Change groups', 'google-site-kit' ) }
			</Link>
		</Fragment>
	);
}
