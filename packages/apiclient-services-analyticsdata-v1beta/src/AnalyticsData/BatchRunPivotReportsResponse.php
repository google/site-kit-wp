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

namespace Google\Service\AnalyticsData;

class BatchRunPivotReportsResponse extends \Google\Collection
{
  protected $collection_key = 'pivotReports';
  /**
   * @var string
   */
  public $kind;
  protected $pivotReportsType = RunPivotReportResponse::class;
  protected $pivotReportsDataType = 'array';

  /**
   * @param string
   */
  public function setKind($kind)
  {
    $this->kind = $kind;
  }
  /**
   * @return string
   */
  public function getKind()
  {
    return $this->kind;
  }
  /**
   * @param RunPivotReportResponse[]
   */
  public function setPivotReports($pivotReports)
  {
    $this->pivotReports = $pivotReports;
  }
  /**
   * @return RunPivotReportResponse[]
   */
  public function getPivotReports()
  {
    return $this->pivotReports;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(BatchRunPivotReportsResponse::class, 'Google_Service_AnalyticsData_BatchRunPivotReportsResponse');
