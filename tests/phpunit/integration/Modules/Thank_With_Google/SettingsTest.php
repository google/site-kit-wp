<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Thank_With_Google\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Thank_With_Google
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Thank_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Thank_With_Google\Settings;
use Google\Site_Kit\Tests\Core\Storage\Setting_With_Owned_Keys_ContractTests;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Thank_With_Google
 */
class SettingsTest extends SettingsTestCase {
	use Setting_With_Owned_Keys_ContractTests;

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'ownerID'       => '',
				'publicationID' => '',
				'colorTheme'    => '',
				'ctaPlacement'  => '',
				'ctaPostTypes'  => array( 'post' ),
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_get_sanitize_callback() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		register_post_type( 'test', array( 'public' => true ) );

		$settings->merge(
			array(
				'colorTheme'   => 'invalid',
				'ctaPlacement' => 'invalid',
				'ctaPostTypes' => array(
					'post',
					'test',
					'invalid',
				),
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'ownerID'       => '',
				'publicationID' => '',
				'colorTheme'    => '',
				'ctaPlacement'  => '',
				'ctaPostTypes'  => array( 'post', 'test' ),
			),
			get_option( Settings::OPTION )
		);

		$settings->merge(
			array(
				'colorTheme'   => 'cyan',
				'ctaPlacement' => 'static_auto',
				'ctaPostTypes' => array(
					'post',
					'test',
					'invalid',
				),
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'ownerID'       => '',
				'publicationID' => '',
				'colorTheme'    => 'cyan',
				'ctaPlacement'  => 'static_auto',
				'ctaPostTypes'  => array( 'post', 'test' ),
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_get() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		register_post_type( 'test', array( 'public' => true ) );

		$settings->merge( array( 'ctaPostTypes' => array( 'post', 'test' ) ) );

		$this->assertEqualSetsWithIndex( array( 'post', 'test' ), $settings->get()['ctaPostTypes'] );

		unregister_post_type( 'test' );

		$this->assertEqualSetsWithIndex( array( 'post' ), $settings->get()['ctaPostTypes'] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}

	protected function get_setting_with_owned_keys() {
		return new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
	}
}
