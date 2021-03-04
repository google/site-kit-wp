<?php
/**
 * Class Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard
 *
 * @package   Google\Site_Kit\Core\Tags\Guards
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Guards;

use Google\Site_Kit\Core\Guards\Guard_Interface;
use Google\Site_Kit\Core\Util\Input;

/**
 * Guard that verifies if the "tagverify" query arg is used.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class Tag_Verify_Guard implements Guard_Interface {

	/**
	 * Input access abstraction.
	 *
	 * @since 1.24.0
	 * @var Input
	 */
	private $input;

	/**
	 * Constructor.
	 *
	 * @since 1.24.0
	 *
	 * @param Input $input Input instance.
	 */
	public function __construct( Input $input ) {
		$this->input = $input;
	}

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.24.0
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		return ! $this->input->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN );
	}

}
