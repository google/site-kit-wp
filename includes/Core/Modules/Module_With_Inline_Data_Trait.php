<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Inline_Data_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Trait for a module that sets inline data.
 *
 * @since 1.158.0
 * @access private
 * @ignore
 */
trait Module_With_Inline_Data_Trait {

	/**
	 * Registers the hook to add required scopes.
	 *
	 * @since 1.158.0
	 */
	private function register_inline_data() {
		add_filter(
			'googlesitekit_inline_modules_data',
			array( $this, 'get_inline_data' ),
		);
	}
}
