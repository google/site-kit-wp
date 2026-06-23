/**
 * `lazyWithPreload` helper.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ComponentType, LazyExoticComponent } from 'react';

/**
 * WordPress dependencies
 */
import { lazy } from '@wordpress/element';

/**
 * A lazy component that also exposes its import factory as a `preload` method.
 */
type PreloadableLazyComponent< Props > = LazyExoticComponent<
	ComponentType< Props >
> & {
	preload: () => Promise< { default: ComponentType< Props > } >;
};

/**
 * Wraps `lazy` with a `preload` method exposing the import factory.
 *
 * The PDF orchestrator awaits `preload()` to resolve the chunk before
 * passing the component to `@react-pdf`, whose renderer doesn't honor
 * `Suspense`.
 *
 * @since n.e.x.t
 *
 * @param factory Dynamic import factory returning `{ default }`.
 * @return Lazy component with a `preload` method.
 */
export default function lazyWithPreload< Props = Record< string, never > >(
	factory: () => Promise< { default: ComponentType< Props > } >
): PreloadableLazyComponent< Props > {
	return Object.assign( lazy( factory ), { preload: factory } );
}
