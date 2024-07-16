<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Tag_GuardTest extends TestCase {

	/**
	 * @var Tag_Guard
	 */
	protected $guard;

	public function set_up() {
		parent::set_up();

		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options     = new Options( $context );
		$settings    = new Settings( $options );
		$this->guard = new Tag_Guard( $settings );
	}

	public function test_can_activate() {
		update_option(
			Settings::OPTION,
			array(
				'measurementID' => '123456',
				'useSnippet'    => true,
			)
		);

		$this->assertTrue( $this->guard->can_activate() );
	}

	public function test_can_activate__with_use_snippet_false() {
		update_option(
			Settings::OPTION,
			array(
				'measurementID' => '123456',
				'useSnippet'    => false,
			)
		);

		$this->assertFalse(
			$this->guard->can_activate(),
			'Should return FALSE when useSnippet is not enabled.'
		);
	}

	public function test_can_activate__with_no_measurement_id() {
		update_option(
			Settings::OPTION,
			array(
				'measurementID' => '',
				'useSnippet'    => true,
			)
		);

		$this->assertFalse(
			$this->guard->can_activate(),
			'Should return FALSE when measurementID is empty.'
		);
	}
}
