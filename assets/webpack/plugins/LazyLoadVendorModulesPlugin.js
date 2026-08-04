/**
 * LazyLoadVendorModulesPlugin webpack plugin.
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

const PLUGIN_NAME = 'LazyLoadVendorModulesPlugin';

/**
 * Collects the source resource paths a module resolves from.
 *
 * @since n.e.x.t
 *
 * @param {Object} module A webpack module.
 * @return {string[]} The resolved resource paths for the module and any inner modules.
 */
function getModuleResources( module ) {
	const resources = [];

	function visit( current ) {
		if ( ! current ) {
			return;
		}

		const resource =
			typeof current.nameForCondition === 'function'
				? current.nameForCondition()
				: current.resource;

		if ( resource ) {
			resources.push( resource );
		}

		// ConcatenatedModule exposes its inner modules on `.modules`.
		if ( Array.isArray( current.modules ) ) {
			current.modules.forEach( visit );
		}
	}

	visit( module );

	return resources;
}

/**
 * Fails the build when a module is found in an initial chunk that should be
 * lazy-loaded.
 *
 * @since n.e.x.t
 */
class LazyLoadVendorModulesPlugin {
	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}   options            Plugin options.
	 * @param {string}   options.chunkName  The initial chunk to guard.
	 * @param {RegExp[]} options.disallowed Patterns matched against module resource paths.
	 */
	constructor( { chunkName, disallowed } ) {
		this.chunkName = chunkName;
		this.disallowed = disallowed;
	}

	/**
	 * Applies the plugin to the webpack compiler.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} compiler The webpack compiler.
	 */
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, ( compilation ) => {
			// `afterOptimizeChunkModules` runs after `SplitChunksPlugin` has
			// assigned `node_modules` to the vendor cacheGroup, so the chunk's
			// module graph is complete here—it shouldn't be modified again.
			compilation.hooks.afterOptimizeChunkModules.tap(
				PLUGIN_NAME,
				( chunks ) => {
					const { chunkGraph } = compilation;

					for ( const chunk of chunks ) {
						if ( chunk.name !== this.chunkName ) {
							continue;
						}

						const offenders = new Set();

						for ( const module of chunkGraph.getChunkModulesIterable(
							chunk
						) ) {
							for ( const resource of getModuleResources(
								module
							) ) {
								if (
									this.disallowed.some( ( pattern ) =>
										pattern.test( resource )
									)
								) {
									offenders.add( resource );
								}
							}
						}

						if ( offenders.size > 0 ) {
							compilation.errors.push(
								new Error(
									`${ PLUGIN_NAME }: disallowed module(s) were bundled into the "${
										this.chunkName
									}" chunk. Lazy-load these dependencies instead: \n\n${ Array.from(
										offenders
									)
										.sort()
										.map(
											( resource ) => `  - ${ resource }`
										)
										.join(
											'\n'
										) } \n\n(E.g. via the "googlesitekit-vendor-lazy-pdf" chunk.)`
								)
							);
						}
					}
				}
			);
		} );
	}
}

module.exports = LazyLoadVendorModulesPlugin;
