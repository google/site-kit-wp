/**
 * SetupFlowSVG component.
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
import { lazy, Suspense, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import MediaErrorHandler from '@/js/components/MediaErrorHandler';

export default function SetupFlowSVG( { name, ...props } ) {
	const LazySVGComponent = useMemo(
		() => lazy( () => import( `../../../../svg/graphics/${ name }.svg` ) ),
		[ name ]
	);

	if ( ! name ) {
		return null;
	}

	const { width = '400px', height = '500px' } = props;

	return (
		<Suspense
			fallback={ <PreviewBlock width={ width } height={ height } /> }
		>
			<MediaErrorHandler
				errorMessage={ __(
					'Failed to load graphic',
					'google-site-kit'
				) }
			>
				<LazySVGComponent { ...props } />
			</MediaErrorHandler>
		</Suspense>
	);
}
