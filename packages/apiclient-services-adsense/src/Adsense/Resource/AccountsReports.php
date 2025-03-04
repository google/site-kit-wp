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

namespace Google\Service\Adsense\Resource;

use Google\Service\Adsense\HttpBody;
use Google\Service\Adsense\ReportResult;
use Google\Service\Adsense\SavedReport;

/**
 * The "reports" collection of methods.
 * Typical usage is:
 *  <code>
 *   $adsenseService = new Google\Service\Adsense(...);
 *   $reports = $adsenseService->accounts_reports;
 *  </code>
 */
class AccountsReports extends \Google\Service\Resource
{
  /**
   * Generates an ad hoc report. (reports.generate)
   *
   * @param string $account Required. The account which owns the collection of
   * reports. Format: accounts/{account}
   * @param array $optParams Optional parameters.
   *
   * @opt_param string currencyCode The [ISO-4217 currency
   * code](https://en.wikipedia.org/wiki/ISO_4217) to use when reporting on
   * monetary metrics. Defaults to the account's currency if not set.
   * @opt_param string dateRange Date range of the report, if unset the range will
   * be considered CUSTOM.
   * @opt_param string dimensions Dimensions to base the report on.
   * @opt_param int endDate.day Day of a month. Must be from 1 to 31 and valid for
   * the year and month, or 0 to specify a year by itself or a year and month
   * where the day isn't significant.
   * @opt_param int endDate.month Month of a year. Must be from 1 to 12, or 0 to
   * specify a year without a month and day.
   * @opt_param int endDate.year Year of the date. Must be from 1 to 9999, or 0 to
   * specify a date without a year.
   * @opt_param string filters A list of
   * [filters](/adsense/management/reporting/filtering) to apply to the report.
   * All provided filters must match in order for the data to be included in the
   * report.
   * @opt_param string languageCode The language to use for translating report
   * output. If unspecified, this defaults to English ("en"). If the given
   * language is not supported, report output will be returned in English. The
   * language is specified as an [IETF BCP-47 language
   * code](https://en.wikipedia.org/wiki/IETF_language_tag).
   * @opt_param int limit The maximum number of rows of report data to return.
   * Reports producing more rows than the requested limit will be truncated. If
   * unset, this defaults to 100,000 rows for `Reports.GenerateReport` and
   * 1,000,000 rows for `Reports.GenerateCsvReport`, which are also the maximum
   * values permitted here. Report truncation can be identified (for
   * `Reports.GenerateReport` only) by comparing the number of rows returned to
   * the value returned in `total_matched_rows`.
   * @opt_param string metrics Required. Reporting metrics.
   * @opt_param string orderBy The name of a dimension or metric to sort the
   * resulting report on, can be prefixed with "+" to sort ascending or "-" to
   * sort descending. If no prefix is specified, the column is sorted ascending.
   * @opt_param string reportingTimeZone Timezone in which to generate the report.
   * If unspecified, this defaults to the account timezone. For more information,
   * see [changing the time zone of your
   * reports](https://support.google.com/adsense/answer/9830725).
   * @opt_param int startDate.day Day of a month. Must be from 1 to 31 and valid
   * for the year and month, or 0 to specify a year by itself or a year and month
   * where the day isn't significant.
   * @opt_param int startDate.month Month of a year. Must be from 1 to 12, or 0 to
   * specify a year without a month and day.
   * @opt_param int startDate.year Year of the date. Must be from 1 to 9999, or 0
   * to specify a date without a year.
   * @return ReportResult
   * @throws \Google\Service\Exception
   */
  public function generate($account, $optParams = [])
  {
    $params = ['account' => $account];
    $params = array_merge($params, $optParams);
    return $this->call('generate', [$params], ReportResult::class);
  }
  /**
   * Generates a csv formatted ad hoc report. (reports.generateCsv)
   *
   * @param string $account Required. The account which owns the collection of
   * reports. Format: accounts/{account}
   * @param array $optParams Optional parameters.
   *
   * @opt_param string currencyCode The [ISO-4217 currency
   * code](https://en.wikipedia.org/wiki/ISO_4217) to use when reporting on
   * monetary metrics. Defaults to the account's currency if not set.
   * @opt_param string dateRange Date range of the report, if unset the range will
   * be considered CUSTOM.
   * @opt_param string dimensions Dimensions to base the report on.
   * @opt_param int endDate.day Day of a month. Must be from 1 to 31 and valid for
   * the year and month, or 0 to specify a year by itself or a year and month
   * where the day isn't significant.
   * @opt_param int endDate.month Month of a year. Must be from 1 to 12, or 0 to
   * specify a year without a month and day.
   * @opt_param int endDate.year Year of the date. Must be from 1 to 9999, or 0 to
   * specify a date without a year.
   * @opt_param string filters A list of
   * [filters](/adsense/management/reporting/filtering) to apply to the report.
   * All provided filters must match in order for the data to be included in the
   * report.
   * @opt_param string languageCode The language to use for translating report
   * output. If unspecified, this defaults to English ("en"). If the given
   * language is not supported, report output will be returned in English. The
   * language is specified as an [IETF BCP-47 language
   * code](https://en.wikipedia.org/wiki/IETF_language_tag).
   * @opt_param int limit The maximum number of rows of report data to return.
   * Reports producing more rows than the requested limit will be truncated. If
   * unset, this defaults to 100,000 rows for `Reports.GenerateReport` and
   * 1,000,000 rows for `Reports.GenerateCsvReport`, which are also the maximum
   * values permitted here. Report truncation can be identified (for
   * `Reports.GenerateReport` only) by comparing the number of rows returned to
   * the value returned in `total_matched_rows`.
   * @opt_param string metrics Required. Reporting metrics.
   * @opt_param string orderBy The name of a dimension or metric to sort the
   * resulting report on, can be prefixed with "+" to sort ascending or "-" to
   * sort descending. If no prefix is specified, the column is sorted ascending.
   * @opt_param string reportingTimeZone Timezone in which to generate the report.
   * If unspecified, this defaults to the account timezone. For more information,
   * see [changing the time zone of your
   * reports](https://support.google.com/adsense/answer/9830725).
   * @opt_param int startDate.day Day of a month. Must be from 1 to 31 and valid
   * for the year and month, or 0 to specify a year by itself or a year and month
   * where the day isn't significant.
   * @opt_param int startDate.month Month of a year. Must be from 1 to 12, or 0 to
   * specify a year without a month and day.
   * @opt_param int startDate.year Year of the date. Must be from 1 to 9999, or 0
   * to specify a date without a year.
   * @return HttpBody
   * @throws \Google\Service\Exception
   */
  public function generateCsv($account, $optParams = [])
  {
    $params = ['account' => $account];
    $params = array_merge($params, $optParams);
    return $this->call('generateCsv', [$params], HttpBody::class);
  }
  /**
   * Gets the saved report from the given resource name. (reports.getSaved)
   *
   * @param string $name Required. The name of the saved report to retrieve.
   * Format: accounts/{account}/reports/{report}
   * @param array $optParams Optional parameters.
   * @return SavedReport
   * @throws \Google\Service\Exception
   */
  public function getSaved($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getSaved', [$params], SavedReport::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(AccountsReports::class, 'Google_Service_Adsense_Resource_AccountsReports');
