/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Badge from '../Badge';
import { isFeatureEnabled } from '../../features';

export default function KeyMetricsNewBadge() {
	const conversionReportingEnabled = isFeatureEnabled(
		'conversionReporting'
	);
	// This is necessary to conditionally render the badge
	// as this component is used in a context where `select` is not in scope.
	const isKeyMetricsSetupNew = useSelect( ( select ) =>
		select( CORE_SITE ).getKeyMetricsSetupNew()
	);

	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	const [ initialKeyMetricsSetupCompleted ] = useState(
		isKeyMetricsSetupCompleted
	);

	const [ isNew, setIsNew ] = useState( isKeyMetricsSetupNew );

	useEffect( () => {
		if ( ! initialKeyMetricsSetupCompleted && isKeyMetricsSetupCompleted ) {
			setIsNew( true );
		}
	}, [ initialKeyMetricsSetupCompleted, isKeyMetricsSetupCompleted ] );

	// In new ACR design "New" badge is shown only initially before
	// KMW is setup, afterwards, "New" badge is not visible anymore.
	if ( conversionReportingEnabled && isKeyMetricsSetupCompleted ) {
		return null;
	}

	if ( ! isNew && ! conversionReportingEnabled ) {
		return null;
	}

	return (
		<Badge
			className="googlesitekit-new-badge"
			label={ __( 'New', 'google-site-kit' ) }
		/>
	);
}
