package com.aicodebase.architect.controller;

import com.aicodebase.architect.constant.ApiEndpoints;
import com.aicodebase.architect.dto.AnalyzeRequestDto;
import com.aicodebase.architect.dto.FindingDto;
import com.aicodebase.architect.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiEndpoints.ANALYSIS)
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping(ApiEndpoints.ANALYSIS_RUN)
    public ResponseEntity<List<FindingDto>> runAnalysis(@Valid @RequestBody AnalyzeRequestDto request) {
        return ResponseEntity.ok(analysisService.runAnalysis(request));
    }

    @GetMapping(ApiEndpoints.ANALYSIS_BY_REPO)
    public ResponseEntity<List<FindingDto>> getFindings(@PathVariable UUID repositoryId) {
        return ResponseEntity.ok(analysisService.getFindingsForRepository(repositoryId));
    }
}
