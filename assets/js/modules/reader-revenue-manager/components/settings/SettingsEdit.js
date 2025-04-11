/**
 * Reader Revenue Manager SettingsEdit component.
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
import { useUnmount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import useViewContext from '../../../../hooks/useViewContext';
import { getPostTypesString } from '../../utils/settings';
import { trackEvent } from '../../../../util';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { SNIPPET_MODES } from '../../constants';
import SettingsForm from './SettingsForm';

export default function SettingsEdit() {
	const viewContext = useViewContext();

	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges()
	);

	const hasModuleAccess = useSelect( ( select ) => {
		const { hasModuleOwnershipOrAccess, getErrorForAction } =
			select( CORE_MODULES );

		const hasAccess = hasModuleOwnershipOrAccess(
			READER_REVENUE_MANAGER_MODULE_SLUG
		);

		if ( hasAccess ) {
			return true;
		}

		const checkAccessError = getErrorForAction( 'checkModuleAccess', [
			READER_REVENUE_MANAGER_MODULE_SLUG,
		] );

		// Return early if request is not completed yet.
		if ( undefined === hasAccess && ! checkAccessError ) {
			return undefined;
		}

		// Return false if RRM is connected and access is concretely missing.
		if ( false === hasAccess ) {
			return false;
		}

		if ( 'module_not_connected' === checkAccessError?.code ) {
			return true;
		}

		return false;
	} );

	const haveSettingsChanged = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).haveSettingsChanged()
	);

	const allPostTypes = useSelect( ( select ) =>
		select( CORE_SITE ).getPostTypes()
	);

	const settings = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getSettings()
	);

	const { snippetMode, postTypes } = settings || {};

	const [ oldSettings, setOldSettings ] = useState( settings );

	// Set old settings if they were not available on mount.
	useEffect( () => {
		if ( ! oldSettings && !! settings ) {
			setOldSettings( settings );
		}
	}, [ oldSettings, settings ] );

	// Track GA event when snippet mode or post types change.
	useUnmount( () => {
		// Do not run if settings have not been saved.
		if ( haveSettingsChanged ) {
			return;
		}

		if ( snippetMode !== oldSettings.snippetMode ) {
			trackEvent(
				`${ viewContext }_rrm-settings`,
				'change_snippet_mode',
				SNIPPET_MODES[ snippetMode ]
			);
		}

		if (
			getPostTypesString( postTypes ) !==
			getPostTypesString( oldSettings.postTypes )
		) {
			trackEvent(
				`${ viewContext }_rrm-settings`,
				'change_post_types',
				getPostTypesString( postTypes, allPostTypes )
			);
		}
	} );

	if ( isDoingSubmitChanges || undefined === hasModuleAccess ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--reader-revenue-manager googlesitekit-rrm-settings-edit">
			<SettingsForm hasModuleAccess={ hasModuleAccess } />
		</div>
	);
}
