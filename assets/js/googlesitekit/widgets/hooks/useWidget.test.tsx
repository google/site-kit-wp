/**
 * `useWidget` hook tests.
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
 * External dependencies
 */
import type { ReactNode } from 'react';
import { renderHook } from 'tests/js/test-utils';
/**
 * Internal dependencies
 */
import {
	Provider as WidgetContextProvider,
	type WidgetContextValue,
} from '@/js/googlesitekit/widgets/components/WidgetContext';
import useWidget from './useWidget';

describe( 'useWidget', () => {
	it( 'should return empty object when no provider is found', () => {
		const { result } = renderHook( () => useWidget() ) as {
			result: { current: WidgetContextValue };
		};

		expect( result.current ).toEqual( {} );
	} );

	it( 'should return the widget context value from the provider', () => {
		const mockWidget: WidgetContextValue = {
			slug: 'test-widget',
			priority: 10,
		};

		function wrapper( { children }: { children: ReactNode } ) {
			return (
				<WidgetContextProvider value={ mockWidget }>
					{ children }
				</WidgetContextProvider>
			);
		}

		const { result } = renderHook(
			() => useWidget(),
			// The `renderHook` options type doesn't include `wrapper`, but it's supported at runtime.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{ wrapper } as any
		) as {
			result: { current: WidgetContextValue };
		};

		expect( result.current ).toEqual( mockWidget );
	} );
} );
