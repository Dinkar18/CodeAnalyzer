package com.aicodebase.architect.controller;

import com.aicodebase.architect.constant.ApiEndpoints;
import com.aicodebase.architect.dto.ChatRequestDto;
import com.aicodebase.architect.dto.ChatResponseDto;
import com.aicodebase.architect.dto.ConversationDto;
import com.aicodebase.architect.dto.MessageDto;
import com.aicodebase.architect.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiEndpoints.CHAT)
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponseDto> chat(@Valid @RequestBody ChatRequestDto request) {
        return ResponseEntity.ok(chatService.sendMessage(request));
    }

    @PostMapping(value = ApiEndpoints.CHAT_STREAM, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@Valid @RequestBody ChatRequestDto request) {
        return chatService.streamMessage(request);
    }

    @GetMapping(ApiEndpoints.CHAT_CONVERSATIONS)
    public ResponseEntity<List<ConversationDto>> getConversations(@PathVariable UUID repositoryId) {
        return ResponseEntity.ok(chatService.getConversations(repositoryId));
    }

    @GetMapping(ApiEndpoints.CHAT_MESSAGES)
    public ResponseEntity<List<MessageDto>> getMessages(@PathVariable UUID conversationId) {
        return ResponseEntity.ok(chatService.getConversationMessages(conversationId));
    }

    @DeleteMapping(ApiEndpoints.CHAT_CONVERSATION_BY_ID)
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID conversationId) {
        chatService.deleteConversation(conversationId);
        return ResponseEntity.noContent().build();
    }
}
