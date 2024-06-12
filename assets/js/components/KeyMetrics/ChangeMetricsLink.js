/**
 * Key Metrics ChangeMetricsLink component.
 *
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
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import Link from '../Link';
import PencilIcon from '../../../svg/icons/pencil-alt.svg';
import SetupCompletedSurveyTrigger from './SetupCompletedSurveyTrigger';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { useChangeMetricsFeatureTourEffect } from './hooks/useChangeMetricsFeatureTourEffect';
const { useSelect, useDispatch } = Data;

export default function ChangeMetricsLink() {
	const keyMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetrics()
	);
	const viewContext = useViewContext();

	const { setValue } = useDispatch( CORE_UI );

	const openMetricsSelectionPanel = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
		trackEvent( `${ viewContext }_kmw`, 'change_metrics' );
	}, [ setValue, viewContext ] );

	const renderChangeMetricLink =
		Array.isArray( keyMetrics ) && keyMetrics?.length > 0;

	useChangeMetricsFeatureTourEffect( renderChangeMetricLink );

	if ( ! renderChangeMetricLink ) {
		return null;
	}

	return (
		<Fragment>
			<Link
				secondary
				linkButton
				className="googlesitekit-widget-area__cta-link"
				onClick={ openMetricsSelectionPanel }
				leadingIcon={ <PencilIcon width={ 22 } height={ 22 } /> }
			>
				{ __( 'Change metrics', 'google-site-kit' ) }
			</Link>
			<SetupCompletedSurveyTrigger />
		</Fragment>
	);
}
