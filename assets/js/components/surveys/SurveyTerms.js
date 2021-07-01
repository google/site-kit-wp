/**
 * SurveyTerms component.
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
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Link from '../Link';
const { useSelect } = Data;

export default function SurveyTerms() {
	const privacy = useSelect( ( select ) => select( CORE_SITE ).getGooglePrivacyPolicyURL() );
	const terms = useSelect( ( select ) => select( CORE_SITE ).getGoogleTermsURL() );

	return (
		<p className="googlesitekit-survey__terms">
			{
				createInterpolateElement(
					__( 'By continuing, you agree to allow Google to use your answers and account info to improve services, per our <privacy>Privacy</privacy> & <terms>Terms</terms>.', 'google-site-kit' ),
					{
						privacy: <Link href={ privacy } inherit external />,
						terms: <Link href={ terms } inherit external />,
					},
				)
			}
		</p>
	);
}
