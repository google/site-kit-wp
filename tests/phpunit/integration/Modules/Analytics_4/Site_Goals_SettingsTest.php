<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;
use Google\Site_Kit\Tests\TestCase;

class Site_Goals_SettingsTest extends TestCase {

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	public function set_up() {
		parent::set_up();
		$context                   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                   = new Options( $context );
		$this->site_goals_settings = new Site_Goals_Settings( $options );
		$this->site_goals_settings->register();
	}

	public function test_get_default() {
		$this->assertEquals( array( 'activeWidgets' => array() ), $this->site_goals_settings->get(), 'The default settings should have an empty activeWidgets array.' );
	}

	public function test_get_type() {
		$this->assertEquals( 'array', $this->site_goals_settings->get_type(), 'The setting type should be array.' );
	}

	public function test_get_view_only_keys() {
		$this->assertSame( array( 'activeWidgets' ), $this->site_goals_settings->get_view_only_keys(), 'Only activeWidgets should be a view-only key.' );
	}

	public function test_merge__sets_active_widgets() {
		$this->site_goals_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );

		$this->assertEquals( array( 'activeWidgets' => array( 'ecommerce' ) ), $this->site_goals_settings->get(), 'The merged activeWidgets should be persisted.' );
	}

	public function test_merge__unions_active_widgets() {
		$this->site_goals_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );
		$this->site_goals_settings->merge( array( 'activeWidgets' => array( 'lead' ) ) );

		$result = $this->site_goals_settings->get();
		$this->assertContains( 'ecommerce', $result['activeWidgets'], 'The first merged widget should be retained after a second merge.' );
		$this->assertContains( 'lead', $result['activeWidgets'], 'The second merged widget should be added to activeWidgets.' );
	}

	public function test_merge__deduplicates_active_widgets() {
		$this->site_goals_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );
		$this->site_goals_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );

		$this->assertEquals( array( 'activeWidgets' => array( 'ecommerce' ) ), $this->site_goals_settings->get(), 'Duplicate widget values should be deduplicated after successive merges.' );
	}

	public function test_merge__returns_merged_value() {
		$result = $this->site_goals_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );

		$this->assertIsArray( $result, 'The merge method should return an array.' );
		$this->assertArrayHasKey( 'activeWidgets', $result, 'The returned array should include the activeWidgets key.' );
	}

	public function data_site_goals_settings() {
		return array(
			'non-array - bool'              => array(
				false,
				array( 'activeWidgets' => array() ),
			),
			'non-array - int'               => array(
				123,
				array( 'activeWidgets' => array() ),
			),
			'valid activeWidgets ecommerce' => array(
				array( 'activeWidgets' => array( 'ecommerce' ) ),
				array( 'activeWidgets' => array( 'ecommerce' ) ),
			),
			'valid activeWidgets both'      => array(
				array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ),
				array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ),
			),
			'strips invalid widget values'  => array(
				array( 'activeWidgets' => array( 'ecommerce', 'invalid-widget', 'lead' ) ),
				array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ),
			),
			'strips non-string from array'  => array(
				array( 'activeWidgets' => array( 'ecommerce', false, null, array() ) ),
				array( 'activeWidgets' => array( 'ecommerce' ) ),
			),
			'non-array activeWidgets'       => array(
				array( 'activeWidgets' => 'not-an-array' ),
				array( 'activeWidgets' => array() ),
			),
			'unknown top-level key ignored' => array(
				array(
					'activeWidgets' => array( 'lead' ),
					'unknownKey'    => 'value',
				),
				array( 'activeWidgets' => array( 'lead' ) ),
			),
		);
	}

	/**
	 * @dataProvider data_site_goals_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->site_goals_settings->set( $input );
		$this->assertEquals( $expected, $this->site_goals_settings->get(), 'The sanitize callback should produce the expected output.' );
	}
}
