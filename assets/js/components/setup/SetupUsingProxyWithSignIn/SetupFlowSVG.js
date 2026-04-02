/**
 * SetupFlowSVG component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { Fragment, lazy, Suspense, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import MediaErrorHandler from '@/js/components/MediaErrorHandler';
import { useWindowHeight } from '@/js/hooks/useWindowSize';

const lazyChunks = [
	lazy( () =>
		import( '../../../../svg/graphics/splash-screenshot-optimised-0.svg' )
	),
	lazy( () =>
		import( '../../../../svg/graphics/splash-screenshot-optimised-1.svg' )
	),
	lazy( () =>
		import( '../../../../svg/graphics/splash-screenshot-optimised-2.svg' )
	),
	lazy( () =>
		import( '../../../../svg/graphics/splash-screenshot-optimised-3.svg' )
	),
	lazy( () =>
		import( '../../../../svg/graphics/splash-screenshot-optimised-4.svg' )
	),
];

const HEIGHT_THRESHOLDS = [ 0, 620, 800, 960, 1100 ];

function getChunksToShow( viewportHeight ) {
	let count = 1;
	for (
		let threshold = 1;
		threshold < HEIGHT_THRESHOLDS.length;
		threshold++
	) {
		if ( viewportHeight >= HEIGHT_THRESHOLDS[ threshold ] ) {
			count = threshold + 1;
		}
	}
	return count;
}

export default function SetupFlowSVG() {
	const windowHeight = useWindowHeight();
	const chunksToShow = useMemo(
		() => getChunksToShow( windowHeight ),
		[ windowHeight ]
	);

	const errorMessage = __( 'Failed to load graphic', 'google-site-kit' );

	return (
		<Fragment>
			{ lazyChunks.slice( 0, chunksToShow ).map( ( ChunkSVG, index ) => (
				<Suspense
					key={ index }
					fallback={ <PreviewBlock width="100%" height="100%" /> }
				>
					<MediaErrorHandler errorMessage={ errorMessage }>
						<ChunkSVG
							style={ {
								display: 'block',
								width: '100%',
							} }
						/>
					</MediaErrorHandler>
				</Suspense>
			) ) }
		</Fragment>
	);
}
