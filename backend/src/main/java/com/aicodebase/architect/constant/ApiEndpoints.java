package com.aicodebase.architect.constant;

public final class ApiEndpoints {

    private ApiEndpoints() {
        // Prevent instantiation
    }

    // Base API prefixes
    public static final String API_BASE = "/api";

    // Auth endpoints
    public static final String AUTH = API_BASE + "/auth";
    public static final String AUTH_TOKEN = "/token";

    // Repository endpoints
    public static final String REPOSITORIES = API_BASE + "/repositories";
    public static final String REPOSITORY_BY_ID = "/{id}";
    public static final String REPOSITORY_INDEX = "/{id}/index";
    public static final String REPOSITORY_STATUS = "/{id}/status";
    public static final String REPOSITORY_BRANCHES = "/{id}/branches";
    public static final String REPOSITORY_DIFF = "/{id}/diff";

    // Chat endpoints
    public static final String CHAT = API_BASE + "/chat";
    public static final String CHAT_STREAM = "/stream";
    public static final String CHAT_CONVERSATIONS = "/conversations/{repositoryId}";
    public static final String CHAT_CONVERSATION_BY_ID = "/conversations/id/{conversationId}";
    public static final String CHAT_MESSAGES = "/conversations/{conversationId}/messages";

    // Analysis & audit endpoints
    public static final String ANALYSIS = API_BASE + "/analysis";
    public static final String ANALYSIS_RUN = "/run";
    public static final String ANALYSIS_BY_REPO = "/{repositoryId}";

    // File explorer & codebase graph endpoints
    public static final String FILES = API_BASE + "/files";
    public static final String FILES_BY_REPO = "/{repositoryId}";
    public static final String FILE_CONTENT = "/{repositoryId}/content";
    public static final String FILE_GRAPH = "/{repositoryId}/graph";

    // AI Service WebClient route constants
    public static final class AiService {
        private AiService() {}

        public static final String INDEX = "/api/index";
        public static final String INDEX_STATUS = "/api/index/status/{repositoryId}";
        public static final String BRANCHES = "/api/index/{repositoryId}/branches";
        public static final String DIFF = "/api/index/{repositoryId}/diff";
        public static final String CHAT = "/api/chat";
        public static final String CHAT_STREAM = "/api/chat/stream";
        public static final String ANALYZE = "/api/analyze";
        public static final String GRAPH = "/api/graph/{repositoryId}";
    }
}
