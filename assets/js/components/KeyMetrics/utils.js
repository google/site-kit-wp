/**
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

/**
 * Returns a Higher-Order Component to render wrapped components when the Key Metrics widget is visible.
 *
 * @since 1.103.0
 *
 * @return {Function} Enhancing function.
 */
export function whenKeyMetricsWidgetVisible() {
	return ( WrappedComponent ) => {
		const WrapperComponent = ( props ) => {
			const { WidgetNull } = props;

			const isHidden = useSelect( ( select ) =>
				select( CORE_USER ).isKeyMetricsWidgetHidden()
			);

			if ( isHidden !== false ) {
				if ( WidgetNull ) {
					return <WidgetNull />;
				}

				return null;
			}

			// Return the wrapped component.
			return <WrappedComponent { ...props } />;
		};

		WrapperComponent.displayName = `WhenKeyMetricsWidgetVisible(${
			WrappedComponent.displayName ||
			WrappedComponent.name ||
			'Annonymous'
		})`;

		return WrapperComponent;
	};
}
