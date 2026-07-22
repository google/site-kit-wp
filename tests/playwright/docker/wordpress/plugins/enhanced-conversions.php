<?php
/**
 * Plugin Name: E2E Tests Enhanced Conversions Plugin
 * Description: Test utilities for Enhanced Conversions E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_action(
	'googlesitekit_setup_gtag',
	function ( $gtag ) {
		$gtag->add_tag( 'G-TEST1234' );
	},
	1
);

/**
 * Allow tests to toggle Conversion Tracking with an unauthenticated
 * REST request.
 */
add_filter(
	'rest_endpoints',
	function ( $endpoints ) {
		$route = '/' . Google\Site_Kit\Core\REST_API\REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking';

		foreach ( array_keys( $endpoints[ $route ] ) as $key ) {
			if ( 'namespace' === $key ) {
				continue;
			}

			$endpoints[ $route ][ $key ]['permission_callback'] = '__return_true';
		}

		return $endpoints;
	}
);

/**
 * Gets the WPForms fixtures used by the Enhanced Conversions Playwright tests.
 *
 * @return array[] Form and page definitions.
 */
function google_site_kit_e2e_get_wpforms_fixtures() {
	$email_field = array(
		'type'  => 'email',
		'label' => 'Email Address',
	);
	$name_field  = array(
		'type'  => 'name',
		'label' => 'Name',
		'size'  => 'medium',
	);
	$phone_field = array(
		'type'  => 'text',
		'label' => 'Phone Number',
	);

	return array(
		array(
			'title'  => 'E2E WPForms Email',
			'fields' => array( $email_field ),
		),
		array(
			'title'  => 'E2E WPForms Name',
			'fields' => array( $name_field ),
		),
		array(
			'title'  => 'E2E WPForms Phone',
			'fields' => array( $phone_field ),
		),
		array(
			'title'  => 'E2E WPForms All Fields',
			'fields' => array( $email_field, $name_field, $phone_field ),
		),
	);
}

/**
 * Creates a WPForms form for an Enhanced Conversions fixture.
 *
 * @param string $title  Form title.
 * @param array  $fields Form fields.
 * @return int Form ID.
 */
function google_site_kit_e2e_create_wpforms_form( $title, $fields ) {
	// WPForms needs an explicit numeric field ID that matches the index.
	foreach ( $fields as $field_id => $field ) {
		$fields[ $field_id ]['id'] = (string) $field_id;
	}

	$forms   = wpforms()->get( 'form' );
	$form_id = $forms->add( $title );

	$forms->update(
		$form_id,
		array(
			'id'       => $form_id,
			'fields'   => $fields,
			'settings' => array(
				'submit_text' => 'Submit',
				'ajax_submit' => '1',
			),
		)
	);

	return $form_id;
}

/**
 * Creates a page containing a WPForms form block.
 *
 * @param string $title   Page title.
 * @param int    $form_id Form ID.
 */
function google_site_kit_e2e_create_wpforms_page( $title, $form_id ) {
	wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_content' => sprintf( '<!-- wp:wpforms/form-selector {"formId":"%d"} /-->', $form_id ),
		)
	);
}

/**
 * Creates all WPForms fixtures for the Enhanced Conversions Playwright tests.
 */
function google_site_kit_e2e_create_wpforms_fixtures() {
	foreach ( google_site_kit_e2e_get_wpforms_fixtures() as $fixture ) {
		if ( get_page_by_path( sanitize_title( $fixture['title'] ), OBJECT, 'page' ) ) {
			continue;
		}

		$form_id = google_site_kit_e2e_create_wpforms_form( $fixture['title'], $fixture['fields'] );

		google_site_kit_e2e_create_wpforms_page( $fixture['title'], $form_id );
	}

	WP_CLI::success( 'The WPForms test fixtures are ready.' );
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'site-kit-e2e create-wpforms-fixtures', 'google_site_kit_e2e_create_wpforms_fixtures' );
}
