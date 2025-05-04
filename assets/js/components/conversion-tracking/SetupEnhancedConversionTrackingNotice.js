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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

export default function SetupEnhancedConversionTrackingNotice( {
	className,
	message,
} ) {
	const isCTEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConversionTrackingEnabled()
	);

	if ( isCTEnabled || isCTEnabled === undefined ) {
		return null;
	}

	return (
		<p
			className={ classnames(
				className,
				'googlesitekit-color--surfaces-on-background-variant'
			) }
		>
			{ message }
		</p>
	);
}
