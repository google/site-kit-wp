<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\User_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\User_Settings;
use Google\Site_Kit\Tests\TestCase;

class User_SettingsTest extends TestCase {

	/**
	 * User_Settings instance.
	 *
	 * @var User_Settings
	 */
	private $user_settings;

	public function set_up() {
		parent::set_up();
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( User_Settings::OPTION );

		unregister_meta_key( 'user', $meta_key );
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->user_settings = new User_Settings( $user_options );
		$this->user_settings->register();
	}

	public function test_get_default() {
		$this->assertEquals(
			array(
				'lastActionedExpressSetups' => array(),
			),
			$this->user_settings->get()
		);
	}

	public function test_merge__adds_and_updates_last_actioned_express_setups() {
		$this->user_settings->merge(
			array(
				'lastActionedExpressSetups' => array(
					'publicationSetup' => 1752451200,
					'productSetup'     => 1752537600,
				),
			)
		);

		$this->user_settings->merge(
			array(
				'lastActionedExpressSetups' => array(
					'publicationSetup' => 1752624000,
				),
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'lastActionedExpressSetups' => array(
					'publicationSetup' => 1752624000,
					'productSetup'     => 1752537600,
				),
			),
			$this->user_settings->get()
		);
	}

	public function test_merge__ignores_unknown_keys() {
		$this->user_settings->merge(
			array(
				'lastActionedExpressSetups' => array( 'publicationSetup' => 1752451200 ),
				'unknownKey'                => 'unknownValue',
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'lastActionedExpressSetups' => array( 'publicationSetup' => 1752451200 ),
			),
			$this->user_settings->get()
		);
	}

	public function test_merge__ignores_null_values() {
		$settings = array(
			'lastActionedExpressSetups' => array( 'publicationSetup' => 1752451200 ),
		);

		$this->user_settings->merge( $settings );
		$this->user_settings->merge( array( 'lastActionedExpressSetups' => null ) );

		$this->assertEqualSetsWithIndex( $settings, $this->user_settings->get() );
	}

	public function data_user_settings() {
		return array(
			'ignores non-array values'                  => array(
				123,
				array(),
			),
			'ignores non-array setting values'          => array(
				array( 'lastActionedExpressSetups' => 'invalid' ),
				array( 'lastActionedExpressSetups' => array() ),
			),
			'drops unknown settings'                    => array(
				array( 'unknownKey' => array( 'publicationSetup' => 1752451200 ) ),
				array(),
			),
			'keeps string keys with integer timestamps' => array(
				array(
					'lastActionedExpressSetups' => array(
						'publicationSetup' => 1752451200,
						'productSetup'     => 1752537600,
					),
				),
				array(
					'lastActionedExpressSetups' => array(
						'publicationSetup' => 1752451200,
						'productSetup'     => 1752537600,
					),
				),
			),
			'drops non-string keys and non-integer timestamps' => array(
				array(
					'lastActionedExpressSetups' => array(
						'publicationSetup' => 1752451200,
						'stringTimestamp'  => '1752537600',
						123                => 1752624000,
					),
				),
				array(
					'lastActionedExpressSetups' => array(
						'publicationSetup' => 1752451200,
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_user_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->user_settings->set( $input );
		$this->assertEquals( $expected, $this->user_settings->get() );
	}
}
