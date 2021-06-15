/**
 * ModuleHeader component.
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
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import PageHeader from '../PageHeader';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

function ModuleHeader( { moduleSlug } ) {
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleSlug ) );
	const moduleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( moduleSlug ) );
	const moduleStatus = moduleConnected ? 'connected' : 'not-connected';
	const ModuleIcon = useSelect( ( select ) => select( CORE_MODULES ).getModuleIcon( moduleSlug ) );

	if ( ! module ) {
		return null;
	}

	const { name } = module;

	const moduleStatusText = sprintf(
		/* translators: %s: module name. */
		__( '%s is connected', 'google-site-kit' ),
		name,
	);

	return (
		<PageHeader
			title={ name }
			icon={
				ModuleIcon && <ModuleIcon
					className="googlesitekit-page-header__icon"
					height="21"
					width="23"
				/>
			}
			status={ moduleStatus }
			statusText={ moduleStatusText }
		/>
	);
}

PageHeader.propTypes = {
	moduleSlug: PropTypes.string,
};

export default ModuleHeader;
