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
import { useInViewSelect, useDispatch } from 'googlesitekit-data';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './AudienceSelectionPanel/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import Link from '../../../../../components/Link';
import PencilIcon from '../../../../../../svg/icons/pencil-alt.svg';

export default function ChangeGroupsLink() {
	const availableAudiences = useInViewSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getConfigurableAudiences(),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );

	const openAudiencesSelectionPanel = useCallback( () => {
		setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );
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
				className="googlesitekit-widget-area__cta-link"
				onClick={ openAudiencesSelectionPanel }
				leadingIcon={ <PencilIcon width={ 22 } height={ 22 } /> }
			>
				{ __( 'Change groups', 'google-site-kit' ) }
			</Link>
		</Fragment>
	);
}
