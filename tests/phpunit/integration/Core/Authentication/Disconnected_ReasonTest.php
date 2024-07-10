<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Disconnected_ReasonTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * Disconnected_ReasonTest
 *
 * @group Authentication
 */
class Disconnected_ReasonTest extends SettingsTestCase {

	/**
	 * User_Options object.
	 *
	 * @var User_Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();
		$this->options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_register() {
		$disconnected_reason = new Disconnected_Reason( $this->options );

		$action   = 'googlesitekit_authorize_user';
		$callback = array( $disconnected_reason, 'delete' );

		$this->assertFalse( has_action( $action, $callback ) );
		$disconnected_reason->register();
		$this->assertTrue( false !== has_action( $action, $callback ) );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Disconnected_Reason::OPTION;
	}
}
