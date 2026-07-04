<?php
/**
 * Class Google\Site_Kit\Tests\MutableInput
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Core\Util\Input;

/**
 * Class for Mutable Input implementation.
 */
class MutableInput extends Input {
	/**
	 * @inheritDoc
	 */
	public function filter( $type, $variable_name, $filter = FILTER_DEFAULT, $options = 0 ) {
		$input_map = array(
			INPUT_GET    => $_GET,
			INPUT_POST   => $_POST,
			INPUT_SERVER => $_SERVER,
			INPUT_COOKIE => $_COOKIE, // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
			INPUT_ENV    => $_ENV,
		);

		if ( ! isset( $input_map[ $type ][ $variable_name ] ) ) {
			return null;
		}

		return filter_var( $input_map[ $type ][ $variable_name ], $filter, $options );
	}
}
