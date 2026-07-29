<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Form_MetadataTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Form_Metadata;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Form_MetadataTest extends TestCase {

	/**
	 * Get_Form_Metadata datapoint instance.
	 *
	 * @var Get_Form_Metadata
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Mirror how WPForms registers its CPT in production: non-public, with a
		// custom capability type (whose capabilities are granted to no one) and
		// `map_meta_cap` disabled. Title resolution must not depend on post
		// capabilities, or it would fail for every real form plugin.
		register_post_type(
			'wpforms',
			array(
				'public'          => false,
				'capability_type' => 'wpforms_form',
				'map_meta_cap'    => false,
			)
		);

		// OptinMonster registers the campaign post type as non-public, which
		// is what `register_post_type()` does when given no options.
		register_post_type( 'omapi' );

		$this->datapoint = new Get_Form_Metadata( array( 'service' => '' ) );
	}

	public function tear_down() {
		unregister_post_type( 'wpforms' );
		unregister_post_type( 'omapi' );
		parent::tear_down();
	}

	private function data_request( array $form_ids ) {
		return new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'form-metadata',
			array( 'formIDs' => $form_ids )
		);
	}

	/**
	 * Creates an `omapi` campaign post and returns the slug WordPress stored.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $title  The campaign title.
	 * @param string $slug   The requested campaign slug.
	 * @param string $status Optional. The post status. Default 'publish'.
	 * @return string The stored campaign slug.
	 */
	private function create_omapi_campaign( $title, $slug, $status = 'publish' ) {
		$post_id = self::factory()->post->create(
			array(
				'post_title'  => $title,
				'post_name'   => $slug,
				'post_type'   => 'omapi',
				'post_status' => $status,
			)
		);

		// The lookup under test finds a campaign by slug, not by post ID, so
		// each caller sends this value on as the form ID.
		return get_post( $post_id )->post_name;
	}

	public function test_create_request__returns_title_for_known_post_type() {
		$form_id = self::factory()->post->create(
			array(
				'post_title' => 'Contact',
				'post_type'  => 'wpforms',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$this->assertSame(
			array(
				$form_id => array(
					'title' => 'Contact',
				),
			),
			$request(),
			'A known form CPT should resolve its title.'
		);
	}

	public function test_create_request__does_not_disclose_non_form_post_titles() {
		// A non-form post type (e.g. a regular page/post) must not have its title
		// echoed back — only known form CPTs resolve a title.
		$form_id = self::factory()->post->create( array( 'post_title' => 'Some private page' ) );

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$result = $request();
		$this->assertNull(
			$result[ $form_id ]['title'],
			'A non-form post type must not have its title disclosed.'
		);
	}

	public function test_create_request__does_not_disclose_unpublished_form_title() {
		$form_id = self::factory()->post->create(
			array(
				'post_title'  => 'Secret form',
				'post_type'   => 'wpforms',
				'post_status' => 'private',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		// Only published forms resolve a title; private/draft/trashed don't.
		$this->assertNull(
			$request()[ $form_id ]['title'],
			'An unpublished form title must not be disclosed.'
		);
	}

	public function test_create_request__returns_null_title_for_missing_post() {
		$missing_id = 99999;

		$request = $this->datapoint->create_request( $this->data_request( array( $missing_id ) ) );

		$this->assertSame(
			array(
				$missing_id => array(
					'title' => null,
				),
			),
			$request(),
			'A missing post should resolve null metadata under its requested ID.'
		);
	}

	public function test_create_request__returns_error_when_form_ids_not_array() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'form-metadata',
			array( 'formIDs' => 'not-an-array' )
		);

		$result = $this->datapoint->create_request( $data_request );

		$this->assertWPError( $result, 'Form metadata request with non-array form IDs should return a WP_Error.' );
		$this->assertSame(
			'missing_required_param',
			$result->get_error_code(),
			'A non-array formIDs parameter should return the missing parameter error.'
		);
	}

	public function test_create_request__ignores_non_positive_and_empty_string_ids() {
		$form_id = self::factory()->post->create( array( 'post_title' => 'Real form' ) );

		$request = $this->datapoint->create_request(
			$this->data_request( array( $form_id, 0, -5, '-3', '' ) )
		);

		// A post ID is a positive integer, and an empty string names nothing,
		// so the result holds none of these values.
		$this->assertSame(
			array( $form_id ),
			array_keys( $request() ),
			'A zero, a negative, or an empty form ID should not reach the result.'
		);
	}

	public function test_create_request__ignores_a_form_id_that_is_not_a_number_or_a_string() {
		$form_id = self::factory()->post->create( array( 'post_title' => 'Real form' ) );

		// A request can nest an array under formIDs, and only a number or a
		// string can name a form, so the array reaches no lookup. The
		// `is_string()` test is what keeps an array away from
		// `get_page_by_path()`.
		$request = $this->datapoint->create_request(
			$this->data_request( array( $form_id, array( 'nested' ) ) )
		);

		$this->assertSame(
			array( $form_id ),
			array_keys( $request() ),
			'A form ID that is not a number or a string should not reach the result.'
		);
	}

	public function test_create_request__resolves_an_optin_monster_campaign_title_by_slug() {
		$slug = $this->create_omapi_campaign( 'Newsletter Popup', 'newsletter-popup' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertSame(
			array(
				$slug => array(
					'title' => 'Newsletter Popup',
				),
			),
			$request(),
			'A published OptinMonster campaign should resolve its title by slug.'
		);
	}

	public function test_create_request__resolves_a_draft_optin_monster_campaign_title() {
		// OptinMonster saves a paused campaign as a draft, so a paused campaign
		// with historical conversions must still resolve its name.
		$slug = $this->create_omapi_campaign( 'Paused Popup', 'paused-popup', 'draft' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertSame(
			array(
				$slug => array(
					'title' => 'Paused Popup',
				),
			),
			$request(),
			'A draft OptinMonster campaign should still resolve its title.'
		);
	}

	public function test_create_request__returns_null_title_for_a_pending_campaign() {
		// Only a published or draft campaign resolves a title. Any other
		// status, such as a pending one, leaves the JS side its ID fallback
		// label for the tab.
		$slug = $this->create_omapi_campaign( 'Pending Popup', 'pending-popup', 'pending' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertNull(
			$request()[ $slug ]['title'],
			'A campaign outside the publish and draft statuses must not resolve a title.'
		);
	}

	public function test_create_request__returns_null_title_for_an_unknown_campaign_slug() {
		$slug = 'no-such-campaign';

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		// An unknown slug resolves to a null title, keyed by the requested
		// value, so the JS side keeps its ID fallback label for the tab.
		$this->assertSame(
			array(
				$slug => array(
					'title' => null,
				),
			),
			$request(),
			'An unknown campaign slug should resolve to a null title.'
		);
	}

	public function test_create_request__does_not_disclose_the_title_of_a_page_holding_a_campaign_slug() {
		// The lookup asks only for the post types in FORM_SLUG_POST_TYPES, so a
		// page holding the slug must not resolve a title.
		$page_id = self::factory()->post->create(
			array(
				'post_title' => 'Secret page',
				'post_name'  => 'shared-page-slug',
				'post_type'  => 'page',
			)
		);

		// Requesting a slug the page never took would pass the assertion
		// without reaching the lookup, so request the slug the page stored.
		$slug = get_post( $page_id )->post_name;

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertNull(
			$request()[ $slug ]['title'],
			'A page holding a campaign slug must not have its title disclosed.'
		);
	}

	public function test_create_request__does_not_disclose_the_title_of_an_attachment_holding_a_campaign_slug() {
		// Given one post type as a string, `get_page_by_path()` searches
		// attachments as well. The lookup passes an array of post types
		// instead, so an attachment holding the slug must not resolve a
		// title.
		$attachment_id = self::factory()->post->create(
			array(
				'post_title'  => 'Secret attachment',
				'post_name'   => 'shared-attachment-slug',
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
			)
		);

		$slug = get_post( $attachment_id )->post_name;

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertNull(
			$request()[ $slug ]['title'],
			'An attachment holding a campaign slug must not have its title disclosed.'
		);
	}

	public function test_create_request__does_not_resolve_a_title_by_slug_for_a_form_named_by_post_id() {
		// WPForms reports a post ID, so it belongs to FORM_POST_TYPES rather
		// than FORM_SLUG_POST_TYPES. Another plugin's slug that happens to
		// match one of its forms must not name that form.
		$form_id = self::factory()->post->create(
			array(
				'post_title' => 'Contact',
				'post_name'  => 'shared-form-slug',
				'post_type'  => 'wpforms',
			)
		);

		$slug = get_post( $form_id )->post_name;

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertNull(
			$request()[ $slug ]['title'],
			'A form whose plugin reports a post ID should not resolve its title by slug.'
		);
	}

	public function test_create_request__decodes_an_ampersand_in_a_campaign_title() {
		$slug = $this->create_omapi_campaign( 'Tips & Tricks', 'tips-tricks' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		// `get_the_title()` applies the `the_title` filters, and WordPress core
		// adds `wptexturize()` to them, which rewrites a bare "&" as the
		// "&#038;" entity. A breakdown tab prints its label as plain text, so
		// the response has to hold the character rather than the entity.
		$this->assertSame(
			'Tips & Tricks',
			$request()[ $slug ]['title'],
			'A campaign title holding an ampersand should resolve to the "&" character, not the "&#038;" entity.'
		);
	}

	public function test_create_request__decodes_a_curly_apostrophe_in_a_campaign_title() {
		$slug = $this->create_omapi_campaign( "Amara's Bookshop Sale", 'amaras-bookshop-sale' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		// The same `wptexturize()` pass rewrites a straight apostrophe as the
		// "&#8217;" entity, so the decoded title holds the curly apostrophe
		// rather than the straight one this campaign stores.
		$this->assertSame(
			'Amara’s Bookshop Sale',
			$request()[ $slug ]['title'],
			'A campaign title holding an apostrophe should resolve to the curly apostrophe, not the "&#8217;" entity.'
		);
	}

	public function test_create_request__decodes_an_ampersand_in_a_form_post_title() {
		// A form found by post ID reads its title through `get_the_title()`
		// too, so `wptexturize()` encodes that title the same way. The decoding
		// has to cover a WPForms form, not only an OptinMonster campaign.
		$form_id = self::factory()->post->create(
			array(
				'post_title' => 'Sales & Support',
				'post_type'  => 'wpforms',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$this->assertSame(
			'Sales & Support',
			$request()[ $form_id ]['title'],
			'A form title holding an ampersand should resolve to the "&" character, not the "&#038;" entity.'
		);
	}

	public function test_is_shareable() {
		// Shareable so shared-dashboard viewers (view-only users) pass base-scope
		// validation and can read the breakdown tab labels.
		$this->assertTrue(
			$this->datapoint->is_shareable(),
			'The datapoint should be shareable for view-only dashboard users.'
		);
	}

	public function test_permission_callback() {
		// Non-sensitive site config shown with the breakdown, so it gates on
		// dashboard access rather than manage_options.
		$this->assertSame(
			current_user_can( Permissions::VIEW_DASHBOARD ),
			$this->datapoint->permission_callback(),
			'The datapoint permission should gate on the VIEW_DASHBOARD capability.'
		);
	}

	public function test_parse_response() {
		$test_data = array( 1 => array( 'title' => 'Contact' ) );

		$this->assertSame(
			$test_data,
			$this->datapoint->parse_response( $test_data, $this->data_request( array( 1 ) ) ),
			'The response should pass through without modification.'
		);
	}
}
