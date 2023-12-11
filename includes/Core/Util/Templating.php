<?php
/**
 * Class Google\Site_Kit\Core\Util\Templating.php
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

trait Templating {

	protected function render( $path, array $context = [] ) {
		call_user_func(
			static function () {
				extract( func_get_arg( 1 ) );
				include path_join( GOOGLESITEKIT_PLUGIN_DIR_PATH, func_get_arg( 0 ) );
			},
			$path,
			$context
		);
	}
}
