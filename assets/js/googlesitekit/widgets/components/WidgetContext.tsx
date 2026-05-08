/**
 * Context for widgets.
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
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Widget } from '@/js/googlesitekit/widgets/types';

/**
 * Widget context value interface.
 *
 * @since 1.170.0
 */
export type WidgetContextValue = Partial< Widget >;

const WidgetContext = createContext< WidgetContextValue >( {} );

export const { Consumer, Provider } = WidgetContext;

export default WidgetContext;
