/**
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { listFormat, trackEvent } from '../../util';
import ModalDialog from '../ModalDialog';
import useViewContext from '../../hooks/useViewContext';

const { useSelect } = Data;

export default function ConfirmDisableConsentModeDialog( {
	onConfirm,
	onCancel,
} ) {
	const viewContext = useViewContext();

	const isAdsConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isAdsConnected()
	);
	const consentModeRegions = useSelect( ( select ) =>
		select( CORE_SITE ).getConsentModeRegions()
	);

	const dependentModuleNames = useSelect( ( select ) =>
		[ 'analytics-4', 'ads' ].reduce( ( names, slug ) => {
			if ( select( CORE_MODULES ).isModuleConnected( slug ) ) {
				return [
					...names,
					select( CORE_MODULES ).getModule( slug ).name,
				];
			}
			return names;
		}, [] )
	);

	const dependentModulesText =
		dependentModuleNames.length > 0
			? sprintf(
					/* translators: %s: list of dependent modules */
					__(
						'these active modules depend on consent mode and will be affected: %s',
						'google-site-kit'
					),
					listFormat( dependentModuleNames )
			  )
			: null;

	useMount( () => {
		trackEvent( `${ viewContext }_CoMo`, 'view_modal' );
	} );

	let provides = [
		__( 'Track how visitors interact with your site', 'google-site-kit' ),
	];
	let subtitle = __(
		'Disabling consent mode may affect your ability in the European Economic Area and the United Kingdom to:',
		'google-site-kit'
	);

	if ( consentModeRegions?.includes( 'CH' ) ) {
		subtitle = __(
			'Disabling consent mode may affect your ability in the European Economic Area, the UK and Switzerland to:',
			'google-site-kit'
		);
	}

	if ( isAdsConnected ) {
		provides = [
			__( 'Performance of your Ad campaigns', 'google-site-kit' ),
			__(
				'How visitors interact with your site via Analytics',
				'google-site-kit'
			),
		];
		subtitle = __(
			'Disabling consent mode may affect your ability to track these in the European Economic Area and the United Kingdom:',
			'google-site-kit'
		);

		if ( consentModeRegions?.includes( 'CH' ) ) {
			subtitle = __(
				'Disabling consent mode may affect your ability to track these in the European Economic Area, the UK and Switzerland:',
				'google-site-kit'
			);
		}
	}

	return (
		<ModalDialog
			dialogActive
			title={ __( 'Disable consent mode?', 'google-site-kit' ) }
			subtitle={ subtitle }
			handleConfirm={ onConfirm }
			handleDialog={ onCancel }
			provides={ provides }
			dependentModules={ dependentModulesText }
			confirmButton={ __( 'Disable', 'google-site-kit' ) }
			danger
		/>
	);
}

ConfirmDisableConsentModeDialog.propTypes = {
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};
