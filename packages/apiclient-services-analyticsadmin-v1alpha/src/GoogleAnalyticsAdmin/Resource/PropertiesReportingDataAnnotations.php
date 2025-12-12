<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListReportingDataAnnotationsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaReportingDataAnnotation;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "reportingDataAnnotations" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $reportingDataAnnotations = $analyticsadminService->properties_reportingDataAnnotations;
 *  </code>
 */
class PropertiesReportingDataAnnotations extends \Google\Service\Resource
{
  /**
   * Creates a Reporting Data Annotation. (reportingDataAnnotations.create)
   *
   * @param string $parent Required. The property for which to create a Reporting
   * Data Annotation. Format: properties/property_id Example: properties/123
   * @param GoogleAnalyticsAdminV1alphaReportingDataAnnotation $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaReportingDataAnnotation
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaReportingDataAnnotation $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaReportingDataAnnotation::class);
  }
  /**
   * Deletes a Reporting Data Annotation. (reportingDataAnnotations.delete)
   *
   * @param string $name Required. Resource name of the Reporting Data Annotation
   * to delete. Format:
   * properties/property_id/reportingDataAnnotations/reporting_data_annotation
   * Example: properties/123/reportingDataAnnotations/456
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Lookup a single Reporting Data Annotation. (reportingDataAnnotations.get)
   *
   * @param string $name Required. Resource name of the Reporting Data Annotation
   * to lookup. Format:
   * properties/property_id/reportingDataAnnotations/reportingDataAnnotation
   * Example: properties/123/reportingDataAnnotations/456
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaReportingDataAnnotation
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaReportingDataAnnotation::class);
  }
  /**
   * List all Reporting Data Annotations on a property.
   * (reportingDataAnnotations.listPropertiesReportingDataAnnotations)
   *
   * @param string $parent Required. Resource name of the property. Format:
   * properties/property_id Example: properties/123
   * @param array $optParams Optional parameters.
   *
   * @opt_param string filter Optional. Filter that restricts which reporting data
   * annotations under the parent property are listed. Supported fields are: *
   * 'name' * `title` * `description` * `annotation_date` *
   * `annotation_date_range` * `color` Additionally, this API provides the
   * following helper functions: * annotation_duration() : the duration that this
   * annotation marks, [durations](https://github.com/protocolbuffers/protobuf/blo
   * b/main/src/google/protobuf/duration.proto). expect a numeric representation
   * of seconds followed by an `s` suffix. * is_annotation_in_range(start_date,
   * end_date) : if the annotation is in the range specified by the `start_date`
   * and `end_date`. The dates are in ISO-8601 format, for example `2031-06-28`.
   * Supported operations: * `=` : equals * `!=` : not equals * `<` : less than *
   * `>` : greater than * `<=` : less than or equals * `>=` : greater than or
   * equals * `:` : has operator * `=~` : [regular
   * expression](https://github.com/google/re2/wiki/Syntax) match * `!~` :
   * [regular expression](https://github.com/google/re2/wiki/Syntax) does not
   * match * `NOT` : Logical not * `AND` : Logical and * `OR` : Logical or
   * Examples: 1. `title="Holiday Sale"` 2. `description=~"[Bb]ig
   * [Gg]ame.*[Ss]ale"` 3. `is_annotation_in_range("2025-12-25", "2026-01-16") =
   * true` 4. `annotation_duration() >= 172800s AND title:BOGO`
   * @opt_param int pageSize Optional. The maximum number of resources to return.
   * The service may return fewer than this value, even if there are additional
   * pages. If unspecified, at most 50 resources will be returned. The maximum
   * value is 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListReportingDataAnnotations` call. Provide this to retrieve the subsequent
   * page. When paginating, all other parameters provided to
   * `ListReportingDataAnnotations` must match the call that provided the page
   * token.
   * @return GoogleAnalyticsAdminV1alphaListReportingDataAnnotationsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesReportingDataAnnotations($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListReportingDataAnnotationsResponse::class);
  }
  /**
   * Updates a Reporting Data Annotation. (reportingDataAnnotations.patch)
   *
   * @param string $name Required. Identifier. Resource name of this Reporting
   * Data Annotation. Format: 'properties/{property_id}/reportingDataAnnotations/{
   * reporting_data_annotation}' Format:
   * 'properties/123/reportingDataAnnotations/456'
   * @param GoogleAnalyticsAdminV1alphaReportingDataAnnotation $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Optional. The list of fields to update. Field
   * names must be in snake case (for example, "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaReportingDataAnnotation
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaReportingDataAnnotation $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaReportingDataAnnotation::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesReportingDataAnnotations::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesReportingDataAnnotations');
