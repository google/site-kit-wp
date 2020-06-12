/**
 * Dashboard PageSpeed Widget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useCallback, useEffect } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ProgressBar from '../../../components/progress-bar';
import Link from '../../../components/link';
import LabReportMetrics from './LabReportMetrics';
import FieldReportMetrics from './FieldReportMetrics';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	STORE_NAME,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	FORM_DASH_WIDGET,
} from '../datastore/constants';
import { sanitizeHTML } from '../../../util';
const { useSelect, useDispatch } = Data;

export default function DashboardPageSpeed() {
	// TODO: remove legacy global fallback.
	const permalink = global._googlesitekitLegacyData?.permaLink || global.googlesitekit?.permaLink;
	const referenceURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
	const url = permalink || referenceURL;
	const reportMobile = useSelect( ( select ) => select( STORE_NAME ).getReport( url, STRATEGY_MOBILE ) );
	const reportDesktop = useSelect( ( select ) => select( STORE_NAME ).getReport( url, STRATEGY_DESKTOP ) );
	const strategy = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_DASH_WIDGET, 'strategy' ) ) || STRATEGY_MOBILE;
	const dataSrc = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_DASH_WIDGET, 'dataSrc' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const setStrategyMobile = useCallback( () => setValues( FORM_DASH_WIDGET, { strategy: STRATEGY_MOBILE } ), [] );
	const setStrategyDesktop = useCallback( () => setValues( FORM_DASH_WIDGET, { strategy: STRATEGY_DESKTOP } ), [] );
	const setDataSrcField = useCallback( () => setValues( FORM_DASH_WIDGET, { dataSrc: DATA_SRC_FIELD } ), [] );
	const setDataSrcLab = useCallback( () => setValues( FORM_DASH_WIDGET, { dataSrc: DATA_SRC_LAB } ), [] );

	// Set the default data source based on report data.
	useEffect( () => {
		if ( ! reportMobile || ! reportDesktop ) {
			return;
		}
		if ( reportMobile?.loadingExperience?.metrics && reportDesktop?.loadingExperience?.metrics ) {
			setDataSrcField();
		} else {
			setDataSrcLab();
		}
	}, [ reportMobile, reportDesktop ] );

	if ( ! reportMobile || ! reportDesktop || ! dataSrc ) {
		return <ProgressBar />;
	}

	const reportData = strategy === STRATEGY_MOBILE ? reportMobile : reportDesktop;
	const footerLinkHTML = sprintf(
		/* translators: 1: link attributes, 2: translated service name */
		__( 'Learn more details at <a %1$s>%2$s</a>', 'google-site-kit' ),
		`href="${ addQueryArgs( 'https://developers.google.com/speed/pagespeed/insights/', { url } ) }" class="googlesitekit-cta-link googlesitekit-cta-link--external" target="_blank"`,
		_x( 'PageSpeed Insights', 'Service name', 'google-site-kit' )
	);

	return (
		<div className="googlesitekit-pagespeed-widget">
			<header>
				<div className="googlesitekit-pagespeed-data-src-tabs">
					{ /* Temporarily use danger as an "active" state */ }
					<Link
						danger={ dataSrc === DATA_SRC_FIELD }
						onClick={ setDataSrcField }
					>
						{ __( 'In the Field', 'google-site-kit' ) }
					</Link>
					<Link
						danger={ dataSrc === DATA_SRC_LAB }
						onClick={ setDataSrcLab }
					>
						{ __( 'In the Lab', 'google-site-kit' ) }
					</Link>
				</div>
				<div className="googlesitekit-pagespeed-strategy-button-group">
					<Link
						danger={ strategy === STRATEGY_MOBILE }
						onClick={ setStrategyMobile }
					>
						mobile
					</Link>
					<Link
						danger={ strategy === STRATEGY_DESKTOP }
						onClick={ setStrategyDesktop }
					>
						desktop
					</Link>
				</div>
			</header>
			<main>
				{ dataSrc === DATA_SRC_LAB && <LabReportMetrics data={ reportData } /> }
				{ dataSrc === DATA_SRC_FIELD && <FieldReportMetrics data={ reportData } /> }
			</main>
			<footer>
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						footerLinkHTML,
						{
							ALLOWED_TAGS: [ 'a' ],
							ALLOWED_ATTR: [ 'href', 'class', 'target' ],
						}
					) }
				/>
			</footer>
		</div>
	);
}
