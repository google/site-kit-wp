/**
 * ConnectGA4CTA component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import KeyMetricsCTAContent from './KeyMetricsCTAContent';
import KeyMetricsCTAFooter from './KeyMetricsCTAFooter';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
const { useSelect } = Data;

export default function ConnectGA4CTAWidget( { Widget, WidgetNull } ) {
	const DISMISSED_ITEM_KEY = 'key-metrics-connect-ga4-cta-widget';

	const isCTADismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( DISMISSED_ITEM_KEY )
	);
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const ga4DependantKeyMetrics = useSelect( ( select ) => {
		const keyMetrics = select( CORE_USER ).getKeyMetrics();
		const widgets = select( CORE_WIDGETS ).getWidgets(
			AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
		);

		if ( ! keyMetrics || ! widgets ) {
			return [];
		}

		return widgets.filter(
			( { slug, modules } ) =>
				keyMetrics.includes( slug ) && modules.includes( 'analytics-4' )
		);
	} );

	if (
		isCTADismissed ||
		! isUserInputCompleted ||
		isGA4Connected ||
		ga4DependantKeyMetrics.length < 3
	) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding Footer={ () => <KeyMetricsCTAFooter /> }>
			<KeyMetricsCTAContent
				className="googlesitekit-km-connect-ga4-cta"
				title={ __(
					'Google Analytics is disconnected',
					'google-site-kit'
				) }
				description={ __(
					'Metrics cannot be displayed without Google Analytics',
					'google-site-kit'
				) }
				actions={
					<Button>
						{ __( 'Connect Google Analytics', 'google-site-kit' ) }
					</Button>
				}
			/>
		</Widget>
	);
}
