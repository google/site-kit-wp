/**
 * DashboardSharingSettingsButton component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import ShareIcon from '../../../svg/icons/share.svg';
import useViewContext from '../../hooks/useViewContext';
import { trackEvent } from '../../util';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { SETTINGS_DIALOG } from './DashboardSharingSettings/constants';
import DashboardSharingDialog from './DashboardSharingDialog';
const { useSelect, useDispatch } = Data;

export default function DashboardSharingSettingsButton() {
	const viewContext = useViewContext();
	const { setValue } = useDispatch( CORE_UI );

	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);

	const openDialog = useCallback( () => {
		trackEvent(
			`${ viewContext }_headerbar`,
			'open_sharing',
			hasMultipleAdmins ? 'advanced' : 'simple'
		);

		setValue( SETTINGS_DIALOG, true );
	}, [ setValue, viewContext, hasMultipleAdmins ] );

	return (
		<Fragment>
			<Button
				aria-label={ __( 'Open sharing settings', 'google-site-kit' ) }
				className="googlesitekit-sharing-settings__button googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon"
				onClick={ openDialog }
				icon={ <ShareIcon width={ 20 } height={ 20 } /> }
				tooltipEnterDelayInMS={ 500 }
			/>

			<DashboardSharingDialog />
		</Fragment>
	);
}
