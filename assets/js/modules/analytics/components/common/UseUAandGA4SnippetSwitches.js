/**
 * Analytics Use UA and GA4 Snippet Switch component.
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
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import Switch from '../../../../components/Switch';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function UseUAandGA4SnippetSwitches() {
	const useUASnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const canUseUASnippet = useSelect( ( select ) => select( STORE_NAME ).getCanUseSnippet() );

	const ga4ExistingTag = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getExistingTag() );
	const ga4MeasurementID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getMeasurementID() );
	const useGA4Snippet = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getUseSnippet() );

	const { setUseSnippet: setUseUASnippet } = useDispatch( STORE_NAME );
	const { setUseSnippet: setUseGA4Snippet } = useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		if ( ga4MeasurementID === ga4ExistingTag ) {
			setUseGA4Snippet( false );
		}
	}, [ ga4ExistingTag, setUseGA4Snippet, ga4MeasurementID ] );

	const onUAChange = useCallback( () => {
		setUseUASnippet( ! useUASnippet );
		trackEvent( 'analytics_setup', useUASnippet ? 'analytics_tag_enabled' : 'analytics_tag_disabled' );
	}, [ useUASnippet, setUseUASnippet ] );

	const onGA4Change = useCallback( () => {
		setUseGA4Snippet( ! useGA4Snippet );
		trackEvent( 'analytics_setup', useGA4Snippet ? 'analytics4_tag_enabled' : 'analytics4_tag_disabled' );
	}, [ useGA4Snippet, setUseGA4Snippet ] );

	if ( useGA4Snippet === undefined || useUASnippet === undefined ) {
		return null;
	}

	let message;

	if ( useUASnippet && useGA4Snippet ) {
		message = __( 'Site Kit will add the Universal Analytics and Google Analytics 4 codes automatically', 'google-site-kit' );
	} else if ( useUASnippet && ! useGA4Snippet ) {
		message = __( 'Site Kit will add the Universal Analytics code automatically', 'google-site-kit' );
	} else if ( ! useUASnippet && useGA4Snippet ) {
		message = __( 'Site Kit will add the Google Analytics 4 code automatically', 'google-site-kit' );
	} else {
		message = __( 'Site Kit will not add the code to your site', 'google-site-kit' );
	}

	return (
		<div className="googlesitekit-analytics-usesnippet">
			<div className="googlesitekit-settings-module__inline-items">
				<div className="googlesitekit-settings-module__inline-item">
					<Switch
						label={ __( 'Place Universal Analytics code', 'google-site-kit' ) }
						checked={ useUASnippet }
						onClick={ onUAChange }
						hideLabel={ false }
						disabled={ ! canUseUASnippet }
					/>
				</div>
				<div className="googlesitekit-settings-module__inline-item">
					<Switch
						label={ __( 'Place Google Analytics 4 code', 'google-site-kit' ) }
						checked={ useGA4Snippet }
						onClick={ onGA4Change }
						hideLabel={ false }
					/>
				</div>
			</div>

			<p className="googlesitekit-margin-top-0">{ message }</p>
		</div>
	);
}
