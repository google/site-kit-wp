<?php
/**
 * Enhanced_ConversionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Ads
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Ads\Enhanced_Conversions;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class Enhanced_ConversionsTest extends TestCase {
	/**
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	public function test_is_tos_accepted() {
		$enhanced_conversions = new Enhanced_Conversions( $this->context );

		// Check if the Terms of Service for Enhanced Conversions are accepted.
		$this->assertFalse( $enhanced_conversions->is_tos_accepted(), 'Expected TOS to not be accepted by default.' );
	}

	public function test_get_user_data() {
		$enhanced_conversions = new Enhanced_Conversions( $this->context );
		$user_data            = $enhanced_conversions->get_user_data();

		$this->assertIsArray( $user_data, 'Expected user data to be an array.' );
	}
}
