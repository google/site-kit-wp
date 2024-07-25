/**
 * AudienceTilesWidget component.
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import whenActive from '../../../../../../util/when-active';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import AudienceTiles from './AudienceTiles';
import { useInView } from '../../../../../../hooks/useInView';

function AudienceTilesWidget( { Widget, WidgetNull } ) {
	const availableAudiences = useSelect( ( select ) => {
		const audiences = select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
		return audiences?.map( ( audience ) => audience.name );
	} );
	const configuredAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);

	const [ availableAudiencesSynced, setAvailableAudiencesSynced ] =
		useState( false );
	const { maybeSyncAvailableAudiences } = useDispatch( MODULES_ANALYTICS_4 );

	const inView = useInView();
	useEffect( () => {
		if ( inView && ! availableAudiencesSynced ) {
			maybeSyncAvailableAudiences();
			setAvailableAudiencesSynced( true );
		}
	}, [ inView, availableAudiencesSynced, maybeSyncAvailableAudiences ] );

	const hasMatchingAudience = configuredAudiences?.some( ( audience ) =>
		availableAudiences?.includes( audience )
	);

	if ( ! hasMatchingAudience ) {
		return <WidgetNull />;
	}

	return (
		<AudienceTiles
			Widget={ Widget }
			widgetLoading={
				! availableAudiencesSynced ||
				! availableAudiences ||
				! configuredAudiences
			}
		/>
	);
}

AudienceTilesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	AudienceTilesWidget
);
