<?php
/**
 * Content section for the error-email template.
 *
 * Renders the main card with left-aligned warning icon, site domain,
 * title, body paragraphs, and CTA button for getting help.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string   $site_domain        The site domain.
 * @var string   $site_url           The full site URL with protocol.
 * @var string   $title              The email title.
 * @var array    $body               Body paragraphs (may contain HTML).
 * @var array    $cta                Primary CTA configuration with 'url' and 'label'.
 * @var callable $get_asset_url      Function to generate asset URLs.
 * @var callable $render_shared_part Function to render a shared part by name.
 */

$warning_icon_url = $get_asset_url( 'warning-icon' );
?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	<tr>
		<td class="card" style="background-color: #FFFFFF; border-radius: 16px; padding: 24px 16px 12px 16px;">
			<?php /* Warning icon at top, left-aligned. */ ?>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
				<tr>
					<td align="left" style="padding-bottom: 16px;">
						<img src="<?php echo esc_url( $warning_icon_url ); ?>" alt="" width="32" height="32" style="display: block;" />
					</td>
				</tr>
			</table>

			<?php /* Site domain. */ ?>
			<p style="font-size: 14px; line-height: 20px; font-weight: 400; color: #6C726E; margin: 0 0 8px 0;">
				<a class="text-secondary" href="<?php echo esc_url( $site_url ); ?>" style="color: #6C726E; text-decoration: none;"><?php echo esc_html( $site_domain ); ?></a>
			</p>

			<?php /* Title from Content_Map. */ ?>
			<h1 class="text-primary" style="font-size: 16px; line-height: 24px; font-weight: 500; color: #161B18; margin: 0 0 16px 0;">
				<?php echo esc_html( $title ); ?>
			</h1>

			<?php
			/*
			 * Body paragraphs from Content_Map.
			 * Uses wp_kses() for consistency with other simple templates
			 * and to future-proof if HTML tags are added to content later.
			 */
			?>
			<?php foreach ( $body as $paragraph ) : ?>
			<p class="text-primary" style="font-size: 14px; line-height: 20px; font-weight: 400; color: #161B18; margin: 0 0 16px 0;">
				<?php
				echo wp_kses(
					$paragraph,
					array(
						'strong' => array(),
						'a'      => array(
							'href'  => array(),
							'style' => array(),
						),
					)
				);
				?>
			</p>
			<?php endforeach; ?>

			<?php /* CTA Button. */ ?>
			<?php if ( ! empty( $cta['url'] ) ) : ?>
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;">
				<tr>
					<td>
						<?php
						$render_shared_part(
							'dashboard-link',
							array(
								'url'   => $cta['url'],
								'label' => isset( $cta['label'] ) ? $cta['label'] : __( 'Get help', 'google-site-kit' ),
							)
						);
						?>
					</td>
				</tr>
			</table>
			<?php endif; ?>
		</td>
	</tr>
</table>
