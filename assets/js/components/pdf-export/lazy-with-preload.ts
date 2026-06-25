/**
 * Preload-capable `lazy` helper for PDF export widgets.
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
import type { ComponentType, LazyExoticComponent } from 'react';

/**
 * WordPress dependencies
 */
import { lazy } from '@wordpress/element';

type ImportFactory< P > = () => Promise< { default: ComponentType< P > } >;

export type PreloadableLazyComponent< P > = LazyExoticComponent<
	ComponentType< P >
> & {
	preload: ImportFactory< P >;
};

/**
 * Wraps `lazy` with a `preload` method exposing the import factory.
 *
 * The PDF orchestrator awaits `preload()` to resolve the chunk before handing
 * the component to `@react-pdf`, whose renderer does not honour `Suspense`.
 * Registering a widget's `pdf.Component` with a plain `lazy()` makes the
 * orchestrator skip the resolution step and hand the Suspense wrapper straight
 * to `@react-pdf`, which throws while rendering and rejects the export.
 *
 * @since n.e.x.t
 *
 * @param factory Dynamic import factory returning `{ default }`.
 * @return Lazy component with a `preload` method.
 */
export default function lazyWithPreload< P >(
	factory: ImportFactory< P >
): PreloadableLazyComponent< P > {
	const Component = lazy( factory ) as PreloadableLazyComponent< P >;
	Component.preload = factory;
	return Component;
}
