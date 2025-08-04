/**
 * Site Kit polyfills.
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

// eslint-disable-next-line camelcase, no-undef
__webpack_public_path__ = `${ global._googlesitekitBaseData.assetsURL }js/`;

async function loadPolyfills() {
	// Add findLastIndex polyfill to prevent:
	// `block-editor.js wp.blockEditor.transformStyles Failed to transform CSS.
	// TypeError: tokenized.findLastIndex is not a function`
	// errors blocks within Gutenberg built with node < v18.
	if ( ! Array.prototype.findLastIndex ) {
		Array.prototype.findLastIndex = function ( predicate, thisArg ) {
			if ( this === null || this === undefined ) {
				throw new TypeError(
					'Array.prototype.findLastIndex called on null or undefined'
				);
			}
			if ( typeof predicate !== 'function' ) {
				throw new TypeError( 'predicate must be a function' );
			}

			const obj = Object( this );
			const len = parseInt( obj.length ) || 0;

			for ( let i = len - 1; i >= 0; i-- ) {
				if ( i in obj ) {
					const element = obj[ i ];
					if ( predicate.call( thisArg, element, i, obj ) ) {
						return i;
					}
				}
			}
			return -1;
		};
	}

	if ( typeof global.IntersectionObserver === 'undefined' ) {
		await import( 'intersection-observer' );
	}
}

loadPolyfills();
