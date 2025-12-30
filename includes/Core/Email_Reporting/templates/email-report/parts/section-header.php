<?php
/**
 * Section header for email report sections.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string $icon     URL to the section icon.
 * @var string $title    Section title.
 * @var string $subtitle Section subtitle.
 */

?>
<table role="presentation" width="100%" style="margin-bottom:12px;">
	<tr>
		<td>
			<table role="presentation" width="100%">
				<tr>
					<td style="width:72px; vertical-align:top;">
						<?php
						/* translators: %s: Section title */
						$icon_alt = sprintf( __( '%s section icon', 'google-site-kit' ), $title );
						?>
						<img src="<?php echo esc_url( $icon ); ?>" alt="<?php echo esc_attr( $icon_alt ); ?>" width="30" height="30" style="display:block; margin-bottom:12px;" />
					</td>
				</tr>
				<tr>
					<td style="vertical-align:top;">
					<div style="font-size:18px; line-height:24px; font-weight:500;">
						<?php echo esc_html( $title ); ?>
					</div>
						<div style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E;">
							<?php echo esc_html( $subtitle ); ?>
						</div>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
